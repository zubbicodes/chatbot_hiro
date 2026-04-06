"use client";

import { useState, useTransition } from "react";
import { Bot, MessageSquare, Loader2, User } from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getAdminConversationMessages } from "@/lib/actions/conversation.actions";

type Conversation = {
  id: string;
  sessionId: string;
  origin: string | null;
  createdAt: Date;
  bot: { name: string; primaryColor: string; user: { name: string | null; email: string | null } };
  _count: { messages: number };
};

type ConvDetail = Awaited<ReturnType<typeof getAdminConversationMessages>>;

function getOriginLabel(origin: string | null) {
  if (!origin) return "Direct";
  try { return new URL(origin).hostname; } catch { return origin; }
}

export function AdminConversationViewer({ conversations }: { conversations: Conversation[] }) {
  const [selected, setSelected] = useState<ConvDetail>(null);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function open_(id: string) {
    setOpen(true);
    setSelected(null);
    startTransition(async () => {
      const data = await getAdminConversationMessages(id);
      setSelected(data);
    });
  }

  return (
    <>
      <div className="rounded-xl border border-white/5 bg-slate-800/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {["Bot", "Client", "Origin", "Messages", "Date"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {conversations.map((conv) => (
                <tr
                  key={conv.id}
                  onClick={() => open_(conv.id)}
                  className="hover:bg-white/[0.03] transition-colors cursor-pointer"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: conv.bot.primaryColor }} />
                      <span className="text-sm text-white font-medium">{conv.bot.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm text-slate-300 truncate max-w-[160px]">
                      {conv.bot.user.name ?? conv.bot.user.email ?? "—"}
                    </p>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">{getOriginLabel(conv.origin)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-sm text-slate-400">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-600" />
                      {conv._count.messages}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">
                    {new Date(conv.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg bg-slate-950 border-l border-white/5 flex flex-col gap-0 p-0">
          <SheetHeader className="px-5 pt-5 pb-4 border-b border-white/5">
            {selected ? (
              <>
                <SheetTitle className="text-white text-sm font-semibold">{selected.bot.name}</SheetTitle>
                <SheetDescription className="text-slate-500 text-xs mt-0.5">
                  #{selected.sessionId.slice(0, 12)} · {selected.messages.length} messages · {getOriginLabel(selected.origin)}
                </SheetDescription>
              </>
            ) : (
              <SheetTitle className="text-slate-400 text-sm">Loading…</SheetTitle>
            )}
          </SheetHeader>
          <ScrollArea className="flex-1 px-4 py-4">
            {isPending || !selected ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                {selected.messages.map((msg) => {
                  const isBot = msg.role === "ASSISTANT";
                  return (
                    <div key={msg.id} className={`flex items-start gap-2.5 ${isBot ? "flex-row" : "flex-row-reverse"}`}>
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                        style={isBot ? { backgroundColor: selected.bot.primaryColor } : { backgroundColor: "#334155" }}
                      >
                        {isBot ? <Bot className="w-3.5 h-3.5 text-white" /> : <User className="w-3.5 h-3.5 text-slate-400" />}
                      </div>
                      <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${isBot ? "bg-slate-800 text-slate-200 rounded-tl-sm" : "bg-slate-700 text-slate-100 rounded-tr-sm"}`}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        <p className="text-[10px] text-slate-600 mt-1.5">
                          {new Date(msg.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                          {msg.tokensUsed > 0 && ` · ${msg.tokensUsed} tok`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}
