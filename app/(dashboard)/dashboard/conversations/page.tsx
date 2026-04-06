import { redirect } from "next/navigation";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ConversationViewer } from "@/components/dashboard/conversation-viewer";

interface Props {
  searchParams: Promise<{ bot?: string }>;
}

export default async function ConversationsPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { bot: filterBotId } = await searchParams;

  const [bots, conversations] = await Promise.all([
    db.bot.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, primaryColor: true },
    }),
    db.conversation.findMany({
      where: {
        bot: { userId: session.user.id },
        ...(filterBotId ? { botId: filterBotId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true, sessionId: true, origin: true, createdAt: true,
        bot: { select: { name: true, primaryColor: true } },
        _count: { select: { messages: true } },
      },
    }),
  ]);

  const activeBot = filterBotId ? bots.find((b) => b.id === filterBotId) : null;

  return (
    <div className="space-y-8 max-w-4xl" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#111]">Conversations</h1>
        <p className="text-[#999] mt-1 text-sm">
          {conversations.length === 0
            ? "No conversations yet."
            : `${conversations.length} conversation${conversations.length !== 1 ? "s" : ""}${activeBot ? ` with ${activeBot.name}` : ""}`}
        </p>
      </div>

      {/* Bot filter tabs */}
      {bots.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Link
            href="/dashboard/conversations"
            className={`flex-shrink-0 px-4 py-1.5 rounded-xl text-sm font-medium transition-all cursor-pointer border ${
              !filterBotId
                ? "text-[#111] border-[#ddd]"
                : "text-[#999] border-transparent hover:border-[#eee] hover:text-[#555]"
            }`}
            style={!filterBotId ? { backgroundColor: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" } : {}}
          >
            All bots
          </Link>
          {bots.map((bot) => (
            <Link
              key={bot.id}
              href={`/dashboard/conversations?bot=${bot.id}`}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-medium transition-all cursor-pointer border ${
                filterBotId === bot.id
                  ? "text-[#111] border-[#ddd]"
                  : "text-[#999] border-transparent hover:border-[#eee] hover:text-[#555]"
              }`}
              style={filterBotId === bot.id ? { backgroundColor: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" } : {}}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: bot.primaryColor }} />
              {bot.name}
            </Link>
          ))}
        </div>
      )}

      {/* List */}
      {conversations.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-center"
          style={{ borderColor: "#e0e0e0", backgroundColor: "#fff" }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: "#f8f7f4" }}
          >
            <MessageSquare className="w-7 h-7 text-[#ccc]" />
          </div>
          <h3 className="font-semibold text-[#111] mb-2">No conversations yet</h3>
          <p className="text-[#999] text-sm max-w-xs">
            Once visitors start chatting through your widget, conversations will appear here.
          </p>
        </div>
      ) : (
        <ConversationViewer conversations={conversations} />
      )}
    </div>
  );
}
