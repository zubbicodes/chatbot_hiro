"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, RotateCcw, Calendar, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { LeadField } from "@/lib/validations/lead";

type MessageType = "text" | "booking" | "lead_form" | "lead_submitted";

interface Message {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  type?: MessageType;
}

interface TestChatProps {
  botId: string;
  botName: string;
  primaryColor: string;
  greeting: string;
  avatarUrl?: string | null;
  suggestions?: string[];
  leadEnabled?: boolean;
  leadTrigger?: "immediately" | "after_first_reply";
  leadFields?: LeadField[];
  bookingEnabled?: boolean;
  bookingUrl?: string;
}

function generateSessionId() {
  return crypto.randomUUID();
}

const TYPING_MS = 18;

export function TestChat({
  botId,
  botName,
  primaryColor,
  greeting,
  avatarUrl,
  suggestions = [],
  leadEnabled = false,
  leadTrigger = "after_first_reply",
  leadFields = [],
  bookingEnabled = false,
  bookingUrl = "",
}: TestChatProps) {
  const [sessionId] = useState(generateSessionId);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: greeting, type: "text" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestionsVisible, setSuggestionsVisible] = useState(true);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadFormValues, setLeadFormValues] = useState<Record<string, string>>({});
  const [leadErrors, setLeadErrors] = useState<Record<string, string>>({});
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const conversationIdRef = useRef<string | null>(null);
  const userMessageCountRef = useRef(0);
  const pendingBookingRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  // Typing animation refs
  const bufferRef = useRef("");
  const streamDoneRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, []);

  // Show lead form immediately when chat opens (if trigger === "immediately")
  useEffect(() => {
    if (leadEnabled && leadTrigger === "immediately" && !leadSubmitted && leadFields.length > 0) {
      setMessages((prev) => {
        const hasLeadForm = prev.some((m) => m.type === "lead_form" || m.type === "lead_submitted");
        if (hasLeadForm) return prev;
        return [...prev, { role: "assistant", content: "", type: "lead_form" }];
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadEnabled, leadTrigger, leadFields.length]);

  function stopTyping() {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function flushAndStop() {
    stopTyping();
    const remaining = bufferRef.current;
    bufferRef.current = "";
    setMessages((prev) => {
      const arr = [...prev];
      const last = arr[arr.length - 1];
      if (last?.streaming) {
        arr[arr.length - 1] = { ...last, content: last.content + remaining, streaming: false };
      }
      return arr;
    });
  }

  function startTyping() {
    stopTyping();
    intervalRef.current = setInterval(() => {
      if (bufferRef.current.length > 0) {
        const char = bufferRef.current[0];
        bufferRef.current = bufferRef.current.slice(1);
        setMessages((prev) => {
          const arr = [...prev];
          const last = arr[arr.length - 1];
          if (last?.streaming !== undefined) {
            return [...arr.slice(0, -1), { ...last, content: last.content + char }];
          }
          return arr;
        });
      } else if (streamDoneRef.current) {
        stopTyping();
        setMessages((prev) => {
          const arr = [...prev];
          const last = arr[arr.length - 1];
          if (!last?.streaming) return arr;

          const isBM = last.content.trim() === "BOOK_MEETING" && bookingEnabled && bookingUrl;
          const needLeadFirst =
            isBM && leadEnabled && leadFields.length > 0 && !leadSubmitted;
          const showLeadAfterFirst =
            !isBM &&
            leadEnabled &&
            leadTrigger === "after_first_reply" &&
            !leadSubmitted &&
            leadFields.length > 0 &&
            userMessageCountRef.current === 1;

          const result: Message[] = [...arr.slice(0, -1)];

          if (needLeadFirst) {
            // Lead form must come first — set pending flag, show form
            pendingBookingRef.current = true;
            result.push({ role: "assistant" as const, content: "Before I pull up the booking calendar, let me grab a few details.", type: "text" as MessageType });
            const hasLeadForm = result.some((m) => m.type === "lead_form" || m.type === "lead_submitted");
            if (!hasLeadForm) {
              result.push({ role: "assistant" as const, content: "", type: "lead_form" as MessageType });
            }
          } else if (isBM) {
            result.push({ role: "assistant" as const, content: "", type: "booking" as MessageType });
          } else {
            result.push({ ...last, streaming: false, type: "text" as MessageType });
            if (showLeadAfterFirst) {
              const hasLeadForm = result.some((m) => m.type === "lead_form" || m.type === "lead_submitted");
              if (!hasLeadForm) {
                result.push({ role: "assistant" as const, content: "", type: "lead_form" as MessageType });
              }
            }
          }

          return result;
        });
      }
    }, TYPING_MS);
  }

  async function submitLead(e: React.FormEvent) {
    e.preventDefault();
    const errors: Record<string, string> = {};
    for (const f of leadFields) {
      const val = (leadFormValues[f.key] ?? "").trim();
      if (f.required && !val) errors[f.key] = `${f.label} is required`;
    }
    if (Object.keys(errors).length > 0) {
      setLeadErrors(errors);
      return;
    }
    setLeadSubmitting(true);
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botId,
          conversationId: conversationIdRef.current ?? undefined,
          fieldsData: leadFormValues,
        }),
      });
    } catch {
      // Best-effort — don't block the UX
    }
    setLeadSubmitted(true);
    setLeadSubmitting(false);
    setMessages((prev) =>
      prev.map((m) =>
        m.type === "lead_form"
          ? { ...m, type: "lead_submitted" as MessageType, content: "Thanks! We'll be in touch soon." }
          : m
      )
    );
    // If booking was pending behind the lead form, show it now
    if (pendingBookingRef.current) {
      pendingBookingRef.current = false;
      setMessages((prev) => [...prev, { role: "assistant" as const, content: "", type: "booking" as MessageType }]);
    }
  }

  function confirmBooking(msgIndex: number) {
    setMessages((prev) =>
      prev.map((m, i) =>
        i === msgIndex
          ? { role: "assistant" as const, content: "Your meeting has been booked! You'll receive a confirmation email shortly. Is there anything else I can help you with?", type: "text" as MessageType }
          : m
      )
    );
  }

  async function sendMessage(text?: string, e?: React.FormEvent) {
    e?.preventDefault();
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    flushAndStop();
    setInput("");
    setError(null);
    setSuggestionsVisible(false);

    userMessageCountRef.current += 1;

    setMessages((prev) => [...prev, { role: "user", content: msg, type: "text" }]);
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "", streaming: true, type: "text" },
    ]);
    setLoading(true);

    bufferRef.current = "";
    streamDoneRef.current = false;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botId, sessionId, message: msg }),
      });

      // Capture conversationId from first response
      const cid = res.headers.get("X-Conversation-Id");
      if (cid && !conversationIdRef.current) conversationIdRef.current = cid;

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      startTyping();

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bufferRef.current += decoder.decode(value, { stream: true });
      }

      streamDoneRef.current = true;
    } catch (err) {
      stopTyping();
      bufferRef.current = "";
      const errMsg = err instanceof Error ? err.message : "Something went wrong";
      setError(errMsg);
      setMessages((prev) => prev.filter((m, i) => !(i === prev.length - 1 && m.streaming)));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function resetChat() {
    flushAndStop();
    bufferRef.current = "";
    streamDoneRef.current = false;
    userMessageCountRef.current = 0;
    conversationIdRef.current = null;
    setLeadSubmitted(false);
    setLeadFormValues({});
    setLeadErrors({});
    const initial: Message[] = [{ role: "assistant", content: greeting, type: "text" }];
    if (leadEnabled && leadTrigger === "immediately" && leadFields.length > 0) {
      initial.push({ role: "assistant", content: "", type: "lead_form" });
    }
    setMessages(initial);
    setError(null);
    setInput("");
    setSuggestionsVisible(true);
  }

  const userHasChatted = messages.some((m) => m.role === "user");

  function renderMessage(msg: Message, i: number) {
    if (msg.type === "booking") {
      return (
        <div key={i} className="flex items-start gap-2.5">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden mt-1"
            style={{ backgroundColor: primaryColor }}
          >
            <img src={avatarUrl || "/hiro_logo.png"} alt="" className="w-full h-full object-cover" /> {/* eslint-disable-line @next/next/no-img-element */}
          </div>
          <div
            className="flex-1 rounded-2xl rounded-tl-sm overflow-hidden border"
            style={{ backgroundColor: "#fff", borderColor: "#eee" }}
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "#f0f0f0" }}>
              <Calendar className="w-4 h-4 text-amber-500" />
              <p className="text-sm font-semibold text-[#111]">Book a meeting</p>
            </div>
            <iframe
              src={bookingUrl}
              className="w-full"
              style={{ height: "520px", border: "none" }}
              loading="lazy"
              allow="payment"
              title="Book a meeting"
            />
            <div className="px-4 py-3 border-t" style={{ borderColor: "#f0f0f0" }}>
              <button
                type="button"
                onClick={() => confirmBooking(i)}
                className="w-full h-9 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: primaryColor }}
              >
                ✓ Done — I&apos;ve booked my meeting
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (msg.type === "lead_form") {
      return (
        <div key={i} className="flex items-start gap-2.5">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden mt-1"
            style={{ backgroundColor: primaryColor }}
          >
            <img src={avatarUrl || "/hiro_logo.png"} alt="" className="w-full h-full object-cover" /> {/* eslint-disable-line @next/next/no-img-element */}
          </div>
          <div
            className="flex-1 rounded-2xl rounded-tl-sm border p-4 space-y-3"
            style={{ backgroundColor: "#fff", borderColor: "#eee" }}
          >
            <p className="text-sm font-semibold text-[#111]">Before we continue, mind sharing a few details?</p>
            <form onSubmit={submitLead} className="space-y-2.5">
              {leadFields.map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-[#555] mb-1">
                    {f.label}{f.required && <span className="text-red-400 ml-0.5">*</span>}
                  </label>
                  <input
                    type={f.type}
                    value={leadFormValues[f.key] ?? ""}
                    onChange={(ev) => {
                      setLeadFormValues((prev) => ({ ...prev, [f.key]: ev.target.value }));
                      setLeadErrors((prev) => ({ ...prev, [f.key]: "" }));
                    }}
                    placeholder={f.label}
                    className="w-full h-9 rounded-xl border px-3 text-sm text-[#111] placeholder:text-[#ccc] outline-none focus:ring-1 transition-all"
                    style={{
                      borderColor: leadErrors[f.key] ? "#fca5a5" : "#e5e5e5",
                      // @ts-expect-error custom property
                      "--tw-ring-color": primaryColor,
                    }}
                  />
                  {leadErrors[f.key] && (
                    <p className="text-xs text-red-500 mt-0.5">{leadErrors[f.key]}</p>
                  )}
                </div>
              ))}
              <button
                type="submit"
                disabled={leadSubmitting}
                className="w-full h-9 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: primaryColor }}
              >
                {leadSubmitting ? "Submitting…" : "Submit"}
              </button>
            </form>
          </div>
        </div>
      );
    }

    if (msg.type === "lead_submitted") {
      return (
        <div key={i} className="flex items-end gap-2.5">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
            style={{ backgroundColor: primaryColor }}
          >
            <img src={avatarUrl || "/hiro_logo.png"} alt="" className="w-full h-full object-cover" /> {/* eslint-disable-line @next/next/no-img-element */}
          </div>
          <div
            className="flex items-center gap-2 rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-sm"
            style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534" }}
          >
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            {msg.content}
          </div>
        </div>
      );
    }

    // Standard text message (user or assistant)
    return (
      <div
        key={i}
        className={`flex items-end gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
      >
        {msg.role === "assistant" && (
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
            style={{ backgroundColor: primaryColor }}
          >
            <img src={avatarUrl || "/hiro_logo.png"} alt="" className="w-full h-full object-cover" /> {/* eslint-disable-line @next/next/no-img-element */}
          </div>
        )}
        <div
          className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
            msg.role === "user" ? "text-white rounded-br-sm" : "rounded-bl-sm"
          }`}
          style={
            msg.role === "user"
              ? { backgroundColor: primaryColor }
              : { backgroundColor: "#fff", color: "#333", border: "1px solid #eee" }
          }
        >
          {msg.streaming && msg.content === "" ? (
            <div className="flex gap-1 items-center py-0.5">
              <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: "#bbb", animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: "#bbb", animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: "#bbb", animationDelay: "300ms" }} />
            </div>
          ) : (
            <span className="whitespace-pre-wrap">{msg.content}</span>
          )}
          {msg.streaming && msg.content !== "" && (
            <span className="inline-block w-0.5 h-4 bg-current ml-0.5 animate-pulse align-middle opacity-60" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ backgroundColor: "#fff" }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3.5 flex-shrink-0"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatarUrl || "/hiro_logo.png"} alt={botName} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1">
          <p className="text-white font-semibold text-sm">{botName}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-300" />
            <p className="text-white/70 text-xs">Online · Test mode</p>
          </div>
        </div>
        <button
          type="button"
          onClick={resetChat}
          title="Clear chat"
          className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Messages */}
      <div
        ref={messagesRef}
        className="flex-1 overflow-y-auto px-4 py-4 min-h-0"
        style={{ backgroundColor: "#f8f7f4" }}
      >
        <div className="space-y-4">
          {messages.map((msg, i) => renderMessage(msg, i))}

          {error && (
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs"
              style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}
            >
              {error}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Suggestion chips */}
      {suggestions.length > 0 && suggestionsVisible && !userHasChatted && (
        <div
          className="flex flex-wrap gap-2 px-4 py-3 flex-shrink-0 border-t"
          style={{ backgroundColor: "#fafaf9", borderColor: "#eeebe6" }}
        >
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => sendMessage(s)}
              disabled={loading}
              className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer hover:shadow-sm disabled:opacity-50"
              style={{ backgroundColor: "#fff", borderColor: primaryColor + "40", color: primaryColor }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = primaryColor + "10"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#fff"; }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={(e) => sendMessage(undefined, e)}
        className="flex items-center gap-2 px-4 py-3 border-t flex-shrink-0"
        style={{ borderColor: "#eeebe6", backgroundColor: "#fff" }}
      >
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          disabled={loading}
          className="flex-1 h-10 rounded-xl border-[#e5e5e5] text-[#111] placeholder:text-[#ccc] focus-visible:ring-1 focus-visible:ring-green-500 text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 transition-all hover:opacity-90"
          style={{ backgroundColor: primaryColor }}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 text-white animate-spin" />
          ) : (
            <Send className="w-4 h-4 text-white" />
          )}
        </button>
      </form>
    </div>
  );
}
