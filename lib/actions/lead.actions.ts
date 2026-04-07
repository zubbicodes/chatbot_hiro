"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function getLeads(botId?: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  const leads = await db.lead.findMany({
    where: {
      bot: { userId: session.user.id },
      ...(botId ? { botId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 500,
    include: {
      bot: { select: { id: true, name: true, primaryColor: true } },
    },
  });

  return leads.map((l) => ({
    ...l,
    fieldsData: JSON.parse(l.fieldsData) as Record<string, string>,
  }));
}
