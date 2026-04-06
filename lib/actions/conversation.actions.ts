"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function getConversationMessages(conversationId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  return db.conversation.findFirst({
    where: {
      id: conversationId,
      bot: { userId: session.user.id },
    },
    include: {
      bot: { select: { name: true, primaryColor: true, avatarUrl: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function getAdminConversationMessages(conversationId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return null;

  return db.conversation.findFirst({
    where: { id: conversationId },
    include: {
      bot: { select: { name: true, primaryColor: true, user: { select: { name: true, email: true } } } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
}
