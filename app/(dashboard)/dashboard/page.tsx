import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Bot, MessageSquare, Zap, TrendingUp, ArrowRight, Plus } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [botCount, conversationCount, messageCount] = await Promise.all([
    db.bot.count({ where: { userId } }),
    db.conversation.count({ where: { bot: { userId } } }),
    db.message.count({ where: { conversation: { bot: { userId } } } }),
  ]);

  const stats = [
    {
      label: "Active Bots",
      value: botCount,
      icon: Bot,
      iconBg: "#f0fdf4",
      iconColor: "#16a34a",
      trend: "+0 this week",
    },
    {
      label: "Conversations",
      value: conversationCount,
      icon: MessageSquare,
      iconBg: "#eff6ff",
      iconColor: "#2563eb",
      trend: "+0 this week",
    },
    {
      label: "Messages Handled",
      value: messageCount,
      icon: Zap,
      iconBg: "#fffbeb",
      iconColor: "#d97706",
      trend: "+0 this week",
    },
    {
      label: "Satisfaction",
      value: "—",
      icon: TrendingUp,
      iconBg: "#fdf4ff",
      iconColor: "#9333ea",
      trend: "No data yet",
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111]">
            Welcome back, {session?.user.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-[#999] mt-1 text-sm">
            Here&apos;s what&apos;s happening with your chatbots.
          </p>
        </div>
        <Link
          href="/dashboard/bots/new"
          className="flex items-center gap-2 text-sm font-semibold text-white px-5 py-2.5 rounded-xl transition-all hover:opacity-90 hover:shadow-md"
          style={{ backgroundColor: "#111" }}
        >
          <Plus className="w-4 h-4" />
          New Bot
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl p-5 border transition-all hover:shadow-md hover:-translate-y-0.5"
            style={{ backgroundColor: "#fff", borderColor: "#eeebe6" }}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-[#aaa] uppercase tracking-wider">
                {stat.label}
              </p>
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: stat.iconBg }}
              >
                <stat.icon className="w-4 h-4" style={{ color: stat.iconColor }} />
              </div>
            </div>
            <p className="text-3xl font-bold text-[#111]">{stat.value}</p>
            <p className="text-xs text-[#bbb] mt-1">{stat.trend}</p>
          </div>
        ))}
      </div>

      {/* CTA / Empty state */}
      {botCount === 0 && (
        <div
          className="rounded-2xl border border-dashed overflow-hidden"
          style={{ borderColor: "#d4f1d9", backgroundColor: "#f0fdf4" }}
        >
          <div className="flex flex-col sm:flex-row items-center gap-6 p-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "#dcfce7" }}
            >
              <Bot className="w-8 h-8 text-green-600" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-bold text-[#111] text-lg mb-1">
                Create your first ChatBot
              </h3>
              <p className="text-sm text-[#777]">
                Train a custom AI chatbot on your business content and embed it on any website in minutes.
              </p>
            </div>
            <Link
              href="/dashboard/bots/new"
              className="flex items-center gap-2 text-sm font-semibold text-white px-6 py-3 rounded-xl flex-shrink-0 transition-all hover:opacity-90 hover:shadow-md"
              style={{ backgroundColor: "#111" }}
            >
              Start Creating
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Quick links */}
      <div>
        <h2 className="font-semibold text-[#111] mb-4 text-base">Quick access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Manage Bots", desc: "Create, edit and monitor your chatbots", href: "/dashboard/bots", color: "#16a34a", bg: "#f0fdf4" },
            { label: "Knowledge Base", desc: "Upload documents and train your bots", href: "/dashboard/knowledge", color: "#2563eb", bg: "#eff6ff" },
            { label: "Embed Script", desc: "Get your chatbot live on any website", href: "/dashboard/embed", color: "#9333ea", bg: "#fdf4ff" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-4 p-4 rounded-2xl border transition-all hover:shadow-md hover:-translate-y-0.5 group"
              style={{ backgroundColor: "#fff", borderColor: "#eeebe6" }}
            >
              <div
                className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
                style={{ backgroundColor: item.bg }}
              >
                <ArrowRight className="w-4 h-4" style={{ color: item.color }} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#111] group-hover:text-green-700 transition-colors">{item.label}</p>
                <p className="text-xs text-[#999] truncate">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
