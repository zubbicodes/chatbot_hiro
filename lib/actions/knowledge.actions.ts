"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { load as cheerioLoad } from "cheerio";
import { PDFParse } from "pdf-parse";

export type KnowledgeActionState = {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
};

function countTokens(text: string): number {
  return Math.ceil(text.trim().length / 4);
}

function cleanText(text: string): string {
  return text.replace(/\s+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

/** Verify the session user owns the bot */
async function assertBotOwner(botId: string, userId: string) {
  const bot = await db.bot.findFirst({ where: { id: botId, userId } });
  if (!bot) throw new Error("Bot not found");
  return bot;
}

// ── Add text source ─────────────────────────────────────────────────────────

export async function addKnowledgeText(
  _prev: KnowledgeActionState,
  formData: FormData
): Promise<KnowledgeActionState> {
  const session = await auth();
  if (!session?.user?.id) return { message: "Unauthorized" };

  const botId = formData.get("botId") as string;
  const content = (formData.get("content") as string)?.trim();

  if (!botId) return { errors: { botId: ["Please select a bot"] } };
  if (!content) return { errors: { content: ["Content is required"] } };
  if (content.length > 100_000)
    return { errors: { content: ["Content is too large (max 100,000 chars)"] } };

  try {
    await assertBotOwner(botId, session.user.id);
  } catch {
    return { message: "Bot not found" };
  }

  const cleaned = cleanText(content);

  await db.knowledgeBase.create({
    data: {
      botId,
      sourceType: "TEXT",
      sourceRef: null,
      content: cleaned,
      tokenCount: countTokens(cleaned),
    },
  });

  revalidatePath("/dashboard/knowledge");
  return { success: true, message: "Text added to knowledge base." };
}

// ── Add URL source ───────────────────────────────────────────────────────────

export async function addKnowledgeUrl(
  _prev: KnowledgeActionState,
  formData: FormData
): Promise<KnowledgeActionState> {
  const session = await auth();
  if (!session?.user?.id) return { message: "Unauthorized" };

  const botId = formData.get("botId") as string;
  const url = (formData.get("url") as string)?.trim();

  if (!botId) return { errors: { botId: ["Please select a bot"] } };
  if (!url) return { errors: { url: ["URL is required"] } };

  let parsed: URL;
  try {
    parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
  } catch {
    return { errors: { url: ["Must be a valid http/https URL"] } };
  }

  try {
    await assertBotOwner(botId, session.user.id);
  } catch {
    return { message: "Bot not found" };
  }

  let html: string;
  try {
    const res = await fetch(parsed.href, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; HiroBot/1.0)" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    html = await res.text();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { errors: { url: [`Failed to fetch URL: ${msg}`] } };
  }

  const $ = cheerioLoad(html);
  $("script, style, nav, header, footer, aside, noscript, iframe").remove();
  const text = cleanText($("body").text());

  if (!text || text.length < 50) {
    return { errors: { url: ["Could not extract meaningful text from this URL"] } };
  }

  const truncated = text.slice(0, 100_000);

  await db.knowledgeBase.create({
    data: {
      botId,
      sourceType: "URL",
      sourceRef: parsed.href,
      content: truncated,
      tokenCount: countTokens(truncated),
    },
  });

  revalidatePath("/dashboard/knowledge");
  return { success: true, message: "URL scraped and added to knowledge base." };
}

// ── Add PDF source ───────────────────────────────────────────────────────────

export async function addKnowledgePdf(
  _prev: KnowledgeActionState,
  formData: FormData
): Promise<KnowledgeActionState> {
  const session = await auth();
  if (!session?.user?.id) return { message: "Unauthorized" };

  const botId = formData.get("botId") as string;
  const file = formData.get("file") as File | null;

  if (!botId) return { errors: { botId: ["Please select a bot"] } };
  if (!file || file.size === 0) return { errors: { file: ["Please select a PDF file"] } };
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return { errors: { file: ["File must be a PDF"] } };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { errors: { file: ["PDF must be under 10 MB"] } };
  }

  try {
    await assertBotOwner(botId, session.user.id);
  } catch {
    return { message: "Bot not found" };
  }

  let text: string;
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    text = cleanText(result.text);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Parse failed";
    return { errors: { file: [`Could not parse PDF: ${msg}`] } };
  }

  if (!text || text.length < 10) {
    return { errors: { file: ["PDF appears to contain no extractable text"] } };
  }

  const truncated = text.slice(0, 100_000);

  await db.knowledgeBase.create({
    data: {
      botId,
      sourceType: "PDF",
      sourceRef: file.name,
      content: truncated,
      tokenCount: countTokens(truncated),
    },
  });

  revalidatePath("/dashboard/knowledge");
  return { success: true, message: `"${file.name}" added to knowledge base.` };
}

// ── Delete knowledge source ──────────────────────────────────────────────────

export async function deleteKnowledge(id: string): Promise<KnowledgeActionState> {
  const session = await auth();
  if (!session?.user?.id) return { message: "Unauthorized" };

  const kb = await db.knowledgeBase.findFirst({
    where: { id },
    include: { bot: { select: { userId: true } } },
  });

  if (!kb || kb.bot.userId !== session.user.id) {
    return { message: "Not found" };
  }

  await db.knowledgeBase.delete({ where: { id } });
  revalidatePath("/dashboard/knowledge");
  return { success: true };
}

// ── Queries ──────────────────────────────────────────────────────────────────

export async function getKnowledgeBases(botId?: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  return db.knowledgeBase.findMany({
    where: {
      bot: { userId: session.user.id },
      ...(botId ? { botId } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      botId: true,
      sourceType: true,
      sourceRef: true,
      tokenCount: true,
      createdAt: true,
      content: true,
      bot: { select: { name: true, primaryColor: true } },
    },
  });
}
