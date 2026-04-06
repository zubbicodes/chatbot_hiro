import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Settings } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { TestChat } from "@/components/dashboard/test-chat";
import { Badge } from "@/components/ui/badge";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TestChatPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const bot = await db.bot.findFirst({
    where: { id, userId: session.user.id },
    include: {
      _count: { select: { knowledgeBases: true, conversations: true } },
    },
  });

  if (!bot) notFound();

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] max-w-4xl gap-0">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 mb-5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/bots/${id}`}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white">{bot.name}</h1>
              <Badge
                className={
                  bot.isActive
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20 text-xs"
                    : "bg-slate-700/50 text-slate-500 border-slate-700 text-xs"
                }
              >
                {bot.isActive ? "Active" : "Inactive"}
              </Badge>
              {!bot.isActive && (
                <span className="text-xs text-amber-400">
                  (Activate bot to enable chat)
                </span>
              )}
            </div>
            <p className="text-slate-500 text-xs mt-0.5">
              Live test — messages are saved to the database
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/knowledge?bot=${id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-white/5 transition-all cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            {bot._count.knowledgeBases} sources
          </Link>
          <Link
            href={`/dashboard/bots/${id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-white/5 transition-all cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            Settings
          </Link>
        </div>
      </div>

      {/* Chat window */}
      <div className="flex-1 min-h-0">
        <TestChat
          botId={bot.id}
          botName={bot.name}
          primaryColor={bot.primaryColor}
          greeting={bot.greeting}
          avatarUrl={bot.avatarUrl}
        />
      </div>
    </div>
  );
}
