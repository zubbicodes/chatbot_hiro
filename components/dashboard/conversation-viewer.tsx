"use client";

import { useState, useTransition } from "react";
import { Bot, MessageSquare, Loader2, User } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { getConversationMessages } from "@/lib/actions/conversation.actions";

type Conversation = {
  id: string;
  sessionId: string;
  origin: string | null;
  createdAt: Date;
  bot: { name: string; primaryColor: string };
  _count: { messages: number };
};

interface ConversationViewerProps {
  conversations: Conversation[];
}

type ConvDetail = Awaited<ReturnType<typeof getConversationMessages>>;

export function ConversationViewer({ conversations }: ConversationViewerProps) {
  const [selected, setSelected] = useState<ConvDetail>(null);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function openConversation(id: string) {
    setOpen(true);
    setSelected(null);
    startTransition(async () => {
      const data = await getConversationMessages(id);
      setSelected(data);
    });
  }

  function getOriginLabel(origin: string | null) {
    if (!origin) return "Direct";
    try { return new URL(origin).hostname; }
    catch { return origin; }
  }

  function formatDate(d: Date) {
    return new Date(d).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  return (
    <>
      {/* Conversation list */}
      <div className="space-y-2">
        {conversations.map((conv) => (
          <button
            key={conv.id}
            type="button"
            onClick={() => openConversation(conv.id)}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all cursor-pointer text-left group hover:shadow-sm"
            style={{ backgroundColor: "#fff", borderColor: "#eeebe6" }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#fafaf9")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#fff")}
          >
            {/* Bot color icon */}
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${conv.bot.primaryColor}18` }}
            >
              <Bot className="w-4 h-4" style={{ color: conv.bot.primaryColor }} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#111] truncate">
                  {conv.bot.name}
                </span>
                <span className="text-xs text-[#ccc] font-mono hidden sm:inline">
                  #{conv.sessionId.slice(0, 8)}
                </span>
              </div>
              <p className="text-xs text-[#aaa] mt-0.5">
                {getOriginLabel(conv.origin)} · {new Date(conv.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-[#bbb] text-xs flex-shrink-0">
              <MessageSquare className="w-3.5 h-3.5" />
              {conv._count.messages}
            </div>

            <div
              className="w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              style={{ backgroundColor: "#f5f5f5" }}
            >
              <svg className="w-3 h-3 text-[#999]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        ))}
      </div>

      {/* Message viewer sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-lg flex flex-col gap-0 p-0 border-l"
          style={{ backgroundColor: "#fff", borderColor: "#eeebe6" }}
        >
          <SheetHeader className="px-5 pt-5 pb-4 border-b" style={{ borderColor: "#eeebe6", backgroundColor: "#fafaf9" }}>
            {selected ? (
              <>
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${selected.bot.primaryColor}18` }}
                  >
                    <Bot className="w-4 h-4" style={{ color: selected.bot.primaryColor }} />
                  </div>
                  <div>
                    <SheetTitle className="text-[#111] text-sm font-bold">
                      {selected.bot.name}
                    </SheetTitle>
                    <SheetDescription className="text-[#aaa] text-xs mt-0.5">
                      Session #{selected.sessionId.slice(0, 12)} · {selected.messages.length} messages
                    </SheetDescription>
                  </div>
                </div>
                {selected.origin && (
                  <p className="text-xs text-[#bbb] mt-1">
                    From {getOriginLabel(selected.origin)} · {formatDate(selected.createdAt)}
                  </p>
                )}
              </>
            ) : (
              <>
                <SheetTitle className="text-[#111] text-sm font-bold">
                  Loading conversation…
                </SheetTitle>
                <SheetDescription className="text-[#aaa] text-xs">
                  Fetching messages
                </SheetDescription>
              </>
            )}
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0" style={{ backgroundColor: "#f8f7f4" }}>
            {isPending || !selected ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-5 h-5 text-[#bbb] animate-spin" />
              </div>
            ) : selected.messages.length === 0 ? (
              <div className="text-center py-20 text-[#bbb] text-sm">No messages in this conversation.</div>
            ) : (
              <div className="space-y-3">
                {selected.messages.map((msg) => {
                  const isBot = msg.role === "ASSISTANT";
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-2.5 ${isBot ? "flex-row" : "flex-row-reverse"}`}
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                        style={isBot ? { backgroundColor: selected.bot.primaryColor } : { backgroundColor: "#e5e5e5" }}
                      >
                        {isBot ? (
                          <Bot className="w-3.5 h-3.5 text-white" />
                        ) : (
                          <User className="w-3.5 h-3.5 text-[#888]" />
                        )}
                      </div>
                      <div
                        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                          isBot ? "rounded-tl-sm" : "rounded-tr-sm"
                        }`}
                        style={
                          isBot
                            ? { backgroundColor: "#fff", color: "#333", border: "1px solid #eee" }
                            : { backgroundColor: "#111", color: "#f5f5f5" }
                        }
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        <p className="text-[10px] mt-1.5" style={{ color: isBot ? "#bbb" : "rgba(255,255,255,0.45)" }}>
                          {new Date(msg.createdAt).toLocaleTimeString("en-US", {
                            hour: "2-digit", minute: "2-digit",
                          })}
                          {msg.tokensUsed > 0 && ` · ${msg.tokensUsed} tokens`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
