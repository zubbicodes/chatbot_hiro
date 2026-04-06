import Link from "next/link";
import { BookOpen, Bot, Plus } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { KnowledgeItem } from "@/components/dashboard/knowledge-item";
import { AddKnowledgeSheet } from "@/components/dashboard/add-knowledge-sheet";
import { redirect } from "next/navigation";

interface Props {
  searchParams: Promise<{ bot?: string }>;
}

export default async function KnowledgePage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { bot: filterBotId } = await searchParams;

  const [bots, allKnowledge] = await Promise.all([
    db.bot.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, primaryColor: true },
    }),
    db.knowledgeBase.findMany({
      where: {
        bot: { userId: session.user.id },
        ...(filterBotId ? { botId: filterBotId } : {}),
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
    }),
  ]);

  const totalTokens = allKnowledge.reduce((s, k) => s + k.tokenCount, 0);

  function formatTokens(n: number) {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
  }

  const activeBot = filterBotId ? bots.find((b) => b.id === filterBotId) : null;

  return (
    <div className="space-y-8 max-w-5xl" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111]">Knowledge Base</h1>
          <p className="text-[#999] mt-1 text-sm">
            {allKnowledge.length === 0
              ? "Add content to train your bots."
              : `${allKnowledge.length} source${allKnowledge.length !== 1 ? "s" : ""} · ${formatTokens(totalTokens)} total tokens`}
          </p>
        </div>
        <AddKnowledgeSheet
          bots={bots}
          defaultBotId={filterBotId ?? bots[0]?.id}
        />
      </div>

      {/* No bots state */}
      {bots.length === 0 && (
        <div
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-24 text-center"
          style={{ borderColor: "#e0e0e0", backgroundColor: "#fff" }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
            style={{ backgroundColor: "#f0fdf4" }}
          >
            <Bot className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="font-bold text-[#111] text-lg mb-2">
            Create a bot first
          </h3>
          <p className="text-[#999] text-sm max-w-xs mb-8">
            You need at least one bot before you can add knowledge sources.
          </p>
          <Link
            href="/dashboard/bots/new"
            className="flex items-center gap-2 text-sm font-semibold text-white px-6 py-3 rounded-xl transition-all hover:opacity-90 hover:shadow-md cursor-pointer"
            style={{ backgroundColor: "#111" }}
          >
            <Plus className="w-4 h-4" />
            Create a bot
          </Link>
        </div>
      )}

      {/* Bot filter tabs */}
      {bots.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Link
            href="/dashboard/knowledge"
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-medium transition-all cursor-pointer border ${
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
              href={`/dashboard/knowledge?bot=${bot.id}`}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-medium transition-all cursor-pointer border ${
                filterBotId === bot.id
                  ? "text-[#111] border-[#ddd]"
                  : "text-[#999] border-transparent hover:border-[#eee] hover:text-[#555]"
              }`}
              style={filterBotId === bot.id ? { backgroundColor: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" } : {}}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: bot.primaryColor }}
              />
              {bot.name}
            </Link>
          ))}
        </div>
      )}

      {/* Knowledge list */}
      {bots.length > 0 && (
        <>
          {allKnowledge.length > 0 ? (
            <div className="space-y-2">
              {/* Active bot header */}
              {activeBot && (
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: activeBot.primaryColor }}
                  />
                  <h2 className="text-sm font-semibold text-[#111]">
                    {activeBot.name}
                  </h2>
                  <span className="text-[#bbb] text-xs">
                    ({allKnowledge.length} source{allKnowledge.length !== 1 ? "s" : ""})
                  </span>
                </div>
              )}

              {allKnowledge.map((kb) => (
                <KnowledgeItem
                  key={kb.id}
                  id={kb.id}
                  sourceType={kb.sourceType as "URL" | "PDF" | "TEXT"}
                  sourceRef={kb.sourceRef}
                  tokenCount={kb.tokenCount}
                  createdAt={kb.createdAt}
                  content={kb.content}
                  botName={kb.bot.name}
                  botColor={kb.bot.primaryColor}
                  showBot={!filterBotId}
                />
              ))}
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-center"
              style={{ borderColor: "#e0e0e0", backgroundColor: "#fff" }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ backgroundColor: "#f8f7f4" }}
              >
                <BookOpen className="w-7 h-7 text-[#ccc]" />
              </div>
              <h3 className="font-semibold text-[#111] mb-2">No sources yet</h3>
              <p className="text-[#999] text-sm max-w-xs">
                {filterBotId
                  ? `Add knowledge sources to train ${activeBot?.name ?? "this bot"}.`
                  : "Add your first knowledge source using the button above."}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
