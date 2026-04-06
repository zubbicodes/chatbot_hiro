import { NextRequest } from "next/server";
import { db } from "@/lib/db";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

const GROQ_BASE = "https://api.groq.com/openai/v1/chat/completions";
const MAX_KNOWLEDGE_CHARS = 8_000;
const MAX_HISTORY_TURNS = 10; // last N user+assistant pairs

function buildSystemPrompt(
  botName: string,
  systemPromptExtra: string | null,
  knowledgeChunks: string[]
): string {
  const parts: string[] = [];

  parts.push(
    `You are ${botName}, a helpful AI support assistant. Be concise, friendly, and accurate.`
  );

  if (systemPromptExtra?.trim()) {
    parts.push(systemPromptExtra.trim());
  }

  if (knowledgeChunks.length > 0) {
    let combined = knowledgeChunks.join("\n\n---\n\n");
    if (combined.length > MAX_KNOWLEDGE_CHARS) {
      combined = combined.slice(0, MAX_KNOWLEDGE_CHARS) + "\n[content truncated]";
    }
    parts.push(
      `Use the following knowledge base to answer questions. If the answer is not in the knowledge base, say so honestly.\n\n=== KNOWLEDGE BASE ===\n${combined}\n=== END KNOWLEDGE BASE ===`
    );
  }

  return parts.join("\n\n");
}

/** Strip <think>...</think> blocks emitted by reasoning models */
function stripThinking(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
}

export async function POST(req: NextRequest) {
  let botId: string, sessionId: string, message: string, origin: string | undefined;

  try {
    ({ botId, sessionId, message, origin } = await req.json());
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!botId || !sessionId || !message?.trim()) {
    return Response.json({ error: "botId, sessionId, and message are required" }, { status: 400, headers: CORS_HEADERS });
  }

  // ── Load bot ────────────────────────────────────────────────────────────────
  const bot = await db.bot.findFirst({
    where: { id: botId, isActive: true },
    include: {
      knowledgeBases: {
        orderBy: { createdAt: "desc" },
        select: { content: true },
      },
    },
  });

  if (!bot) {
    return Response.json({ error: "Bot not found or inactive" }, { status: 404, headers: CORS_HEADERS });
  }

  // ── Build system prompt ─────────────────────────────────────────────────────
  const systemPrompt = buildSystemPrompt(
    bot.name,
    bot.systemPromptExtra,
    bot.knowledgeBases.map((k) => k.content)
  );

  // ── Get or create conversation ──────────────────────────────────────────────
  let conversation = await db.conversation.findFirst({
    where: { botId, sessionId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        take: MAX_HISTORY_TURNS * 2,
        select: { role: true, content: true },
      },
    },
  });

  if (!conversation) {
    conversation = await db.conversation.create({
      data: { botId, sessionId, origin: origin ?? null },
      include: { messages: true },
    });
  }

  // ── Save user message ───────────────────────────────────────────────────────
  await db.message.create({
    data: {
      conversationId: conversation.id,
      role: "USER",
      content: message.trim(),
    },
  });

  // ── Build messages array for OpenRouter ────────────────────────────────────
  const historyMessages = conversation.messages.map((m) => ({
    role: m.role === "USER" ? "user" : "assistant",
    content: m.content,
  }));

  const chatMessages = [
    ...historyMessages,
    { role: "user", content: message.trim() },
  ];

  // ── Call Groq with streaming ────────────────────────────────────────────────
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

  if (!apiKey || apiKey === "REPLACE_WITH_YOUR_GROQ_KEY") {
    return Response.json({ error: "Groq API key not configured" }, { status: 500, headers: CORS_HEADERS });
  }

  let orResponse: globalThis.Response;
  try {
    orResponse = await fetch(GROQ_BASE, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        stream: true,
        max_tokens: 1024,
        messages: [{ role: "system", content: systemPrompt }, ...chatMessages],
      }),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Network error";
    return Response.json({ error: `Groq request failed: ${msg}` }, { status: 502, headers: CORS_HEADERS });
  }

  if (!orResponse.ok) {
    const text = await orResponse.text();
    return Response.json({ error: `Groq error ${orResponse.status}: ${text}` }, { status: 502, headers: CORS_HEADERS });
  }

  // ── Stream response back to client ─────────────────────────────────────────
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const convId = conversation.id;
  const userId = bot.userId;

  // Process stream in background
  (async () => {
    let fullText = "";
    let buffer = "";

    try {
      const reader = orResponse.body!.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const data = trimmed.slice(5).trim();
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              fullText += delta;
              await writer.write(encoder.encode(delta));
            }
          } catch {
            // malformed SSE chunk — skip
          }
        }
      }
    } catch {
      // stream interrupted
    } finally {
      await writer.close();

      // Save assistant reply
      const cleanReply = stripThinking(fullText);
      if (cleanReply) {
        const tokensUsed = Math.ceil(cleanReply.length / 4);
        await db.message.create({
          data: {
            conversationId: convId,
            role: "ASSISTANT",
            content: cleanReply,
            tokensUsed,
          },
        });
        // Update usage log (upsert by userId + botId + date)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const existingLog = await db.usageLog.findFirst({
          where: { userId, botId, date: today },
        });
        if (existingLog) {
          await db.usageLog.update({
            where: { id: existingLog.id },
            data: { tokensUsed: { increment: tokensUsed } },
          });
        } else {
          await db.usageLog.create({
            data: { userId, botId, tokensUsed, date: today },
          });
        }
      }
    }
  })();

  return new Response(readable, {
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "X-Conversation-Id": convId,
    },
  });
}
