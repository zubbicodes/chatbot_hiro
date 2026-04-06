"use client";

import { useState } from "react";
import Link from "next/link";
import { Bot, MessageSquare, Pencil, Trash2, MoreVertical, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteBot } from "@/lib/actions/bot.actions";

interface BotCardProps {
  bot: {
    id: string;
    name: string;
    primaryColor: string;
    isActive: boolean;
    greeting: string;
    createdAt: Date;
    _count: { conversations: number };
  };
}

export function BotCard({ bot }: BotCardProps) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${bot.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    await deleteBot(bot.id);
  }

  return (
    <div
      className="group relative flex flex-col gap-4 rounded-2xl border p-5 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
      style={{ backgroundColor: "#fff", borderColor: "#eeebe6" }}
    >
      {/* Color accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
        style={{ backgroundColor: bot.primaryColor }}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mt-1">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${bot.primaryColor}18` }}
          >
            <Bot className="w-5 h-5" style={{ color: bot.primaryColor }} />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-[#111] text-sm truncate">
              {bot.name}
            </h3>
            <p className="text-xs text-[#aaa] mt-0.5 truncate">
              {new Date(bot.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7 text-[#ccc] hover:text-[#555] hover:bg-[#f5f5f5] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-white border-[#eeebe6] text-[#333] shadow-xl rounded-xl"
          >
            <DropdownMenuItem asChild className="cursor-pointer hover:bg-[#f8f7f4] focus:bg-[#f8f7f4] rounded-lg text-sm">
              <Link href={`/dashboard/bots/${bot.id}`} className="flex items-center gap-2">
                <Pencil className="w-3.5 h-3.5 text-[#888]" />
                Edit bot
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer hover:bg-[#f8f7f4] focus:bg-[#f8f7f4] rounded-lg text-sm">
              <Link href={`/dashboard/bots/${bot.id}/test`} className="flex items-center gap-2">
                <FlaskConical className="w-3.5 h-3.5 text-[#888]" />
                Test chat
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-500 cursor-pointer hover:bg-red-50 focus:bg-red-50 focus:text-red-500 flex items-center gap-2 rounded-lg text-sm"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 className="w-3.5 h-3.5" />
              {deleting ? "Deleting…" : "Delete bot"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Greeting preview */}
      <p className="text-xs text-[#999] leading-relaxed line-clamp-2 italic">
        &ldquo;{bot.greeting}&rdquo;
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5 text-[#bbb] text-xs">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>{bot._count.conversations} conversations</span>
        </div>
        <div
          className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium"
          style={
            bot.isActive
              ? { backgroundColor: "#f0fdf4", color: "#16a34a" }
              : { backgroundColor: "#f5f5f5", color: "#999" }
          }
        >
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: bot.isActive ? "#22c55e" : "#ccc" }}
          />
          {bot.isActive ? "Active" : "Inactive"}
        </div>
      </div>

      {/* Edit overlay link */}
      <Link
        href={`/dashboard/bots/${bot.id}`}
        className="absolute inset-0 rounded-2xl"
        aria-label={`Edit ${bot.name}`}
      />
    </div>
  );
}
