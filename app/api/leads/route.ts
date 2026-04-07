import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { LeadSubmissionSchema } from "@/lib/validations/lead";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400, headers: CORS });
  }

  const parsed = LeadSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid data" }, { status: 400, headers: CORS });
  }

  const { botId, conversationId, fieldsData } = parsed.data;

  // Verify bot exists and has lead collection enabled
  const bot = await db.bot.findFirst({
    where: { id: botId, isActive: true, leadEnabled: true },
  });
  if (!bot) {
    return Response.json({ error: "Bot not found or lead collection not enabled" }, { status: 404, headers: CORS });
  }

  // Verify conversation belongs to this bot (when provided)
  if (conversationId) {
    const conv = await db.conversation.findFirst({
      where: { id: conversationId, botId },
    });
    if (!conv) {
      return Response.json({ error: "Conversation not found" }, { status: 404, headers: CORS });
    }
  }

  await db.lead.create({
    data: {
      botId,
      conversationId: conversationId ?? null,
      fieldsData: JSON.stringify(fieldsData),
    },
  });

  return Response.json({ success: true }, { headers: CORS });
}
