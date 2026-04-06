import { db } from "@/lib/db";
import { Users, Bot, MessageSquare, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

export default async function AdminUsersPage() {
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { bots: true } },
    },
  });

  // Get conversation counts per user efficiently
  const convCounts = await db.conversation.groupBy({
    by: ["botId"],
    _count: { id: true },
  });

  // Map botId → userId via bots
  const bots = await db.bot.findMany({
    select: { id: true, userId: true },
  });
  const botToUser = new Map(bots.map((b) => [b.id, b.userId]));

  const convsByUser = new Map<string, number>();
  for (const row of convCounts) {
    const uid = botToUser.get(row.botId);
    if (uid) {
      convsByUser.set(uid, (convsByUser.get(uid) ?? 0) + row._count.id);
    }
  }

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-slate-400 mt-1 text-sm">
            {users.length} registered user{users.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Users", value: users.length, icon: Users, color: "text-rose-400", bg: "bg-rose-500/10" },
          { label: "Admins", value: users.filter(u => u.role === "ADMIN").length, icon: Shield, color: "text-purple-400", bg: "bg-purple-500/10" },
          { label: "Clients", value: users.filter(u => u.role === "CLIENT").length, icon: Bot, color: "text-indigo-400", bg: "bg-indigo-500/10" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-white/5 bg-slate-800/40 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{s.label}</p>
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/5 bg-slate-800/30 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/5">
          <p className="text-sm font-semibold text-white">All users</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {["User", "Role", "Bots", "Conversations", "Joined"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-indigo-400">
                          {(user.name ?? user.email ?? "?")[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {user.name ?? "—"}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge
                      className={
                        user.role === "ADMIN"
                          ? "bg-rose-500/15 text-rose-400 border-rose-500/20 text-xs"
                          : "bg-slate-700/50 text-slate-400 border-slate-700 text-xs"
                      }
                    >
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-sm text-slate-300">
                      <Bot className="w-3.5 h-3.5 text-slate-500" />
                      {user._count.bots}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-sm text-slate-300">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                      {convsByUser.get(user.id) ?? 0}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">
                    {formatDate(user.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
