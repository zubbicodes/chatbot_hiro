import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { AdminConversationViewer } from "@/components/admin/conversation-viewer";

export default async function AdminConversationsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");

  const conversations = await db.conversation.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true, sessionId: true, origin: true, createdAt: true,
      bot: {
        select: {
          name: true, primaryColor: true,
          user: { select: { name: true, email: true } },
        },
      },
      _count: { select: { messages: true } },
    },
  });

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-white">All Conversations</h1>
        <p className="text-slate-400 mt-1 text-sm">
          {conversations.length} most recent across all clients
        </p>
      </div>
      <AdminConversationViewer conversations={conversations} />
    </div>
  );
}
