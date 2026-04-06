import { db } from "@/lib/db";
import { Users, Bot, MessageSquare, Zap, TrendingUp, Activity } from "lucide-react";
import Link from "next/link";

function formatTokens(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(n);
}

export default async function AdminPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const [
    userCount,
    botCount,
    conversationCount,
    messageCount,
    totalTokensResult,
    recentUsers,
    recentConversations,
    dailyUsage,
  ] = await Promise.all([
    db.user.count({ where: { role: "CLIENT" } }),
    db.bot.count(),
    db.conversation.count(),
    db.message.count(),
    db.usageLog.aggregate({ _sum: { tokensUsed: true } }),
    db.user.findMany({
      where: { role: "CLIENT" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true, name: true, email: true, createdAt: true,
        _count: { select: { bots: true } },
      },
    }),
    db.conversation.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true, sessionId: true, origin: true, createdAt: true,
        bot: {
          select: {
            name: true, primaryColor: true,
            user: { select: { name: true } },
          },
        },
        _count: { select: { messages: true } },
      },
    }),
    db.usageLog.findMany({
      where: { date: { gte: sevenDaysAgo } },
      select: { date: true, tokensUsed: true },
      orderBy: { date: "asc" },
    }),
  ]);

  const totalTokens = totalTokensResult._sum.tokensUsed ?? 0;

  // Aggregate daily tokens for sparkline
  const tokensByDay = new Map<string, number>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    tokensByDay.set(d.toISOString().slice(0, 10), 0);
  }
  for (const log of dailyUsage) {
    const key = new Date(log.date).toISOString().slice(0, 10);
    tokensByDay.set(key, (tokensByDay.get(key) ?? 0) + log.tokensUsed);
  }
  const dailyValues = Array.from(tokensByDay.values());
  const maxDaily = Math.max(...dailyValues, 1);

  const stats = [
    { label: "Total Clients",  value: userCount,       icon: Users,        color: "text-rose-400",    bg: "bg-rose-500/10",    href: "/admin/users" },
    { label: "Active Bots",    value: botCount,         icon: Bot,          color: "text-indigo-400",  bg: "bg-indigo-500/10",  href: null },
    { label: "Conversations",  value: conversationCount, icon: MessageSquare, color: "text-emerald-400", bg: "bg-emerald-500/10", href: "/admin/conversations" },
    { label: "Messages",       value: messageCount,     icon: Activity,     color: "text-purple-400",  bg: "bg-purple-500/10",  href: null },
    { label: "Total Tokens",   value: formatTokens(totalTokens), icon: Zap, color: "text-amber-400",   bg: "bg-amber-500/10",   href: null },
    { label: "Growth (7d)",    value: dailyUsage.length > 0 ? "↑" : "—", icon: TrendingUp, color: "text-teal-400", bg: "bg-teal-500/10", href: null },
  ];

  function getOriginLabel(origin: string | null) {
    if (!origin) return "Direct";
    try { return new URL(origin).hostname; } catch { return origin; }
  }

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
        <p className="text-slate-400 mt-1 text-sm">Real-time stats across all clients and bots.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const inner = (
            <div className="rounded-xl border border-white/5 bg-slate-800/40 p-4 h-full transition-colors hover:bg-slate-800/60">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
                <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </div>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </div>
          );
          return stat.href ? (
            <Link key={stat.label} href={stat.href} className="block cursor-pointer">{inner}</Link>
          ) : (
            <div key={stat.label}>{inner}</div>
          );
        })}
      </div>

      {/* 7-day token sparkline */}
      <div className="rounded-xl border border-white/5 bg-slate-800/30 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-white">Token usage — last 7 days</h2>
            <p className="text-xs text-slate-500 mt-0.5">{formatTokens(totalTokens)} total all-time</p>
          </div>
        </div>
        <div className="flex items-end gap-1.5 h-16">
          {dailyValues.map((v, i) => {
            const pct = (v / maxDaily) * 100;
            const keys = Array.from(tokensByDay.keys());
            const label = keys[i] ? new Date(keys[i] + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" }) : "";
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-sm bg-rose-500/40 hover:bg-rose-500/70 transition-colors"
                  style={{ height: pct > 0 ? `${Math.max(pct, 8)}%` : "4px" }}
                  title={`${formatTokens(v)} tokens`}
                />
                <span className="text-[9px] text-slate-600">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent clients */}
        <div className="rounded-xl border border-white/5 bg-slate-800/30 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Recent clients</h2>
            <Link href="/admin/users" className="text-xs text-rose-400 hover:text-rose-300 transition-colors cursor-pointer">
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {recentUsers.length === 0 ? (
              <p className="text-slate-600 text-sm py-4 text-center">No clients yet.</p>
            ) : recentUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors">
                <div className="w-7 h-7 rounded-full bg-rose-500/15 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-rose-400">
                    {(u.name ?? u.email ?? "?")[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{u.name ?? "—"}</p>
                  <p className="text-xs text-slate-500 truncate">{u.email}</p>
                </div>
                <span className="text-xs text-slate-600 flex-shrink-0">{u._count.bots} bots</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent conversations */}
        <div className="rounded-xl border border-white/5 bg-slate-800/30 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Recent conversations</h2>
            <Link href="/admin/conversations" className="text-xs text-rose-400 hover:text-rose-300 transition-colors cursor-pointer">
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {recentConversations.length === 0 ? (
              <p className="text-slate-600 text-sm py-4 text-center">No conversations yet.</p>
            ) : recentConversations.map((conv) => (
              <div key={conv.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: conv.bot.primaryColor }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">
                    {conv.bot.name}
                    <span className="text-slate-600 font-normal ml-2 text-xs">{conv.bot.user.name}</span>
                  </p>
                  <p className="text-xs text-slate-500">{getOriginLabel(conv.origin)}</p>
                </div>
                <span className="text-xs text-slate-500 flex-shrink-0">{conv._count.messages} msgs</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
