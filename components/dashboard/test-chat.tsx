"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, RefreshCw, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Message {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

interface TestChatProps {
  botId: string;
  botName: string;
  primaryColor: string;
  greeting: string;
  avatarUrl?: string | null;
  suggestions?: string[];
}

function generateSessionId() {
  return crypto.randomUUID();
}

export function TestChat({ botId, botName, primaryColor, greeting, avatarUrl, suggestions = [] }: TestChatProps) {
  const [sessionId] = useState(generateSessionId);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: greeting },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestionsVisible, setSuggestionsVisible] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  async function sendMessage(text?: string, e?: React.FormEvent) {
    e?.preventDefault();
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    setInput("");
    setError(null);
    setSuggestionsVisible(false);

    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "", streaming: true },
    ]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botId, sessionId, message: msg }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.streaming) {
            updated[updated.length - 1] = { ...last, content: fullText };
          }
          return updated;
        });
      }

      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.streaming) {
          updated[updated.length - 1] = { ...last, streaming: false };
        }
        return updated;
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      setMessages((prev) =>
        prev.filter((m, i) => !(i === prev.length - 1 && m.streaming))
      );
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function resetChat() {
    setMessages([{ role: "assistant", content: greeting }]);
    setError(null);
    setInput("");
    setSuggestionsVisible(true);
  }

  const userHasChatted = messages.some((m) => m.role === "user");

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

      {/* Messages — scrollable area */}
      <div
        ref={messagesRef}
        className="flex-1 overflow-y-auto px-4 py-4 min-h-0"
        style={{ backgroundColor: "#f8f7f4" }}
      >
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex items-end gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {msg.role === "assistant" && (
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
                  style={{ backgroundColor: primaryColor }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={avatarUrl || "/hiro_logo.png"} alt="" className="w-full h-full object-cover" />
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
          ))}

          {error && (
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs"
              style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}
            >
              <RefreshCw className="w-3.5 h-3.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Suggestion chips — shown before first user message */}
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
              style={{
                backgroundColor: "#fff",
                borderColor: primaryColor + "40",
                color: primaryColor,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = primaryColor + "10";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#fff";
              }}
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
