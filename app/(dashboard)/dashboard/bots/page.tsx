import Link from "next/link";
import { Plus, Bot } from "lucide-react";
import { BotCard } from "@/components/dashboard/bot-card";
import { getBots } from "@/lib/actions/bot.actions";

export default async function BotsPage() {
  const bots = await getBots();

  return (
    <div className="space-y-8 max-w-6xl" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111]">My Bots</h1>
          <p className="text-[#999] mt-1 text-sm">
            {bots.length === 0
              ? "Create your first bot to get started."
              : `${bots.length} bot${bots.length !== 1 ? "s" : ""} — click any card to configure.`}
          </p>
        </div>
        <Link
          href="/dashboard/bots/new"
          className="flex items-center gap-2 text-sm font-semibold text-white px-5 py-2.5 rounded-xl transition-all hover:opacity-90 hover:shadow-md cursor-pointer"
          style={{ backgroundColor: "#111" }}
        >
          <Plus className="w-4 h-4" />
          New Bot
        </Link>
      </div>

      {/* Grid */}
      {bots.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {bots.map((bot) => (
            <BotCard key={bot.id} bot={bot} />
          ))}
        </div>
      ) : (
        /* Empty state */
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
            No bots yet
          </h3>
          <p className="text-[#999] text-sm max-w-xs mb-8">
            Create your first AI chatbot, train it on your content, and embed it on any website.
          </p>
          <Link
            href="/dashboard/bots/new"
            className="flex items-center gap-2 text-sm font-semibold text-white px-6 py-3 rounded-xl transition-all hover:opacity-90 hover:shadow-md cursor-pointer"
            style={{ backgroundColor: "#111" }}
          >
            <Plus className="w-4 h-4" />
            Create your first bot
          </Link>
        </div>
      )}
    </div>
  );
}
