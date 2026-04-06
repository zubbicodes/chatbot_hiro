import { NextRequest } from "next/server";
import { db } from "@/lib/db";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  const { botId } = await params;

  const bot = await db.bot.findFirst({
    where: { id: botId, isActive: true },
    select: {
      id: true,
      name: true,
      primaryColor: true,
      greeting: true,
      avatarUrl: true,
    },
  });

  if (!bot) {
    return Response.json({ error: "Bot not found" }, { status: 404, headers: CORS });
  }

  return Response.json(bot, {
    headers: {
      ...CORS,
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
