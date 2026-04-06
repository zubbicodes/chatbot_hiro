import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { BarChart2, Bot, MessageSquare, TrendingUp, Zap } from "lucide-react";
import { BarChart } from "@/components/dashboard/bar-chart";

function formatTokens(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(n);
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function shortDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function dayLabel(d: Date) {
  return d.toLocaleDateString("en-US", { month: "numeric", day: "numeric" });
}

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const fourteenDaysAgo = new Date(today);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);

  const [
    bots,
    usageLogs,
    conversationCount,
    messageCount,
    recentConversations,
  ] = await Promise.all([
    db.bot.findMany({
      where: { userId },
      select: {
        id: true, name: true, primaryColor: true, isActive: true,
        _count: { select: { conversations: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.usageLog.findMany({
      where: { userId, date: { gte: fourteenDaysAgo } },
      select: { date: true, tokensUsed: true, botId: true },
      orderBy: { date: "asc" },
    }),
    db.conversation.count({ where: { bot: { userId } } }),
    db.message.count({ where: { conversation: { bot: { userId } } } }),
    db.conversation.findMany({
      where: { bot: { userId } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true, sessionId: true, origin: true, createdAt: true,
        bot: { select: { name: true, primaryColor: true } },
        _count: { select: { messages: true } },
      },
    }),
  ]);

  const totalTokens = usageLogs.reduce((s, l) => s + l.tokensUsed, 0);

  const tokensByDate = new Map<string, number>();
  for (let i = 0; i < 14; i++) {
    const d = new Date(fourteenDaysAgo);
    d.setDate(d.getDate() + i);
    tokensByDate.set(d.toISOString().slice(0, 10), 0);
  }
  for (const log of usageLogs) {
    const key = new Date(log.date).toISOString().slice(0, 10);
    tokensByDate.set(key, (tokensByDate.get(key) ?? 0) + log.tokensUsed);
  }

  const chartData = Array.from(tokensByDate.entries()).map(([iso, value]) => {
    const d = new Date(iso + "T00:00:00");
    return { label: dayLabel(d), fullLabel: formatDate(d), value };
  });

  const tokensByBot = new Map<string, number>();
  for (const log of usageLogs) {
    tokensByBot.set(log.botId, (tokensByBot.get(log.botId) ?? 0) + log.tokensUsed);
  }
  const maxBotTokens = Math.max(...Array.from(tokensByBot.values()), 1);

  const stats = [
    { label: "Active Bots", value: bots.filter((b) => b.isActive).length, icon: Bot, iconBg: "#f0fdf4", iconColor: "#16a34a" },
    { label: "Conversations", value: conversationCount, icon: MessageSquare, iconBg: "#eff6ff", iconColor: "#2563eb" },
    { label: "Messages", value: messageCount, icon: TrendingUp, iconBg: "#fdf4ff", iconColor: "#9333ea" },
    { label: "Tokens (14d)", value: formatTokens(totalTokens), icon: Zap, iconBg: "#fffbeb", iconColor: "#d97706" },
  ];

  return (
    <div className="space-y-8 max-w-6xl" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111]">Analytics</h1>
          <p className="text-[#999] mt-1 text-sm">
            Usage overview across all your bots.
          </p>
        </div>
        <div
          className="flex items-center gap-2 text-xs font-medium text-[#888] border rounded-xl px-3 py-1.5"
          style={{ borderColor: "#e5e5e5", backgroundColor: "#fff" }}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          Last 14 days
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border p-5 transition-all hover:shadow-md hover:-translate-y-0.5"
            style={{ backgroundColor: "#fff", borderColor: "#eeebe6" }}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-[#aaa] uppercase tracking-wider">
                {stat.label}
              </p>
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: stat.iconBg }}
              >
                <stat.icon className="w-4 h-4" style={{ color: stat.iconColor }} />
              </div>
            </div>
            <p className="text-3xl font-bold text-[#111]">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Token usage chart */}
      <div
        className="rounded-2xl border p-6"
        style={{ backgroundColor: "#fff", borderColor: "#eeebe6" }}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-bold text-[#111]">Token usage</h2>
            <p className="text-xs text-[#aaa] mt-0.5">Daily tokens consumed across all bots</p>
          </div>
          <span className="text-xs font-semibold text-[#888]">
            {formatTokens(totalTokens)} total
          </span>
        </div>
        {totalTokens === 0 ? (
          <div className="h-32 flex items-center justify-center text-sm text-[#bbb]">
            No usage data yet. Start chatting to see metrics.
          </div>
        ) : (
          <BarChart data={chartData} color="#22c55e" height={128} unit="tokens" />
        )}
      </div>

      {/* Per-bot breakdown */}
      {bots.length > 0 && (
        <div
          className="rounded-2xl border p-6"
          style={{ backgroundColor: "#fff", borderColor: "#eeebe6" }}
        >
          <h2 className="text-sm font-bold text-[#111] mb-5">Bot performance</h2>
          <div className="space-y-4">
            {bots.map((bot) => {
              const tokens = tokensByBot.get(bot.id) ?? 0;
              const pct = maxBotTokens > 0 ? (tokens / maxBotTokens) * 100 : 0;
              return (
                <div key={bot.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: bot.primaryColor }}
                      />
                      <span className="text-sm font-semibold text-[#333]">{bot.name}</span>
                      {!bot.isActive && (
                        <span
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: "#f5f5f5", color: "#aaa" }}
                        >
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[#aaa]">
                      <span>{bot._count.conversations} convos</span>
                      <span className="font-semibold text-[#555]">{formatTokens(tokens)} tokens</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#f0f0f0" }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: bot.primaryColor }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent conversations */}
      {recentConversations.length > 0 && (
        <div
          className="rounded-2xl border p-6"
          style={{ backgroundColor: "#fff", borderColor: "#eeebe6" }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-[#111]">Recent conversations</h2>
            <a
              href="/dashboard/conversations"
              className="text-xs font-semibold text-green-600 hover:text-green-700 transition-colors cursor-pointer"
            >
              View all
            </a>
          </div>
          <div className="space-y-1">
            {recentConversations.map((conv) => (
              <div
                key={conv.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#f8f7f4] transition-colors"
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: conv.bot.primaryColor }}
                />
                <span className="text-sm font-medium text-[#333] truncate flex-1">
                  {conv.bot.name}
                </span>
                <span className="text-xs text-[#bbb] hidden sm:block">
                  {conv.origin
                    ? (() => { try { return new URL(conv.origin).hostname; } catch { return conv.origin; } })()
                    : "Direct"}
                </span>
                <span className="text-xs text-[#aaa]">
                  {conv._count.messages} msgs
                </span>
                <span className="text-xs text-[#bbb]">
                  {shortDate(conv.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
