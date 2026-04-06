"use client";

import { useActionState, useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Bot, Check, Eye, Loader2, MessageSquare, Plus, Sparkles, X } from "lucide-react";
import { TestChat } from "@/components/dashboard/test-chat";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { createBot, updateBot, type BotActionState } from "@/lib/actions/bot.actions";

interface BotData {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  greeting: string;
  avatarUrl: string | null;
  systemPromptExtra: string | null;
  isActive: boolean;
  suggestions: string[];
}

interface BotFormProps {
  bot?: BotData;
}

const PRESET_COLORS = [
  "#22c55e", // green
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#06b6d4", // cyan
  "#0ea5e9", // sky
  "#64748b", // slate
];

function ChatWidgetPreview({
  name,
  primaryColor,
  greeting,
  avatarUrl,
}: {
  name: string;
  primaryColor: string;
  greeting: string;
  avatarUrl: string;
}) {
  return (
    <div
      className="relative w-full h-full flex items-end justify-end p-5 select-none"
      style={{ backgroundColor: "#f8f7f4" }}
    >
      {/* Browser chrome mockup */}
      <div
        className="absolute inset-0 rounded-xl overflow-hidden border"
        style={{ backgroundColor: "#f0ede8", borderColor: "#e5e0d8" }}
      >
        {/* Browser top bar */}
        <div
          className="flex items-center gap-1.5 px-3 py-2.5 border-b"
          style={{ backgroundColor: "#fff", borderColor: "#eeebe6" }}
        >
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#ff5f57" }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#febc2e" }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#28c840" }} />
          <div
            className="flex-1 mx-3 h-4 rounded-lg flex items-center px-2"
            style={{ backgroundColor: "#f5f5f5" }}
          >
            <span className="text-[8px]" style={{ color: "#bbb" }}>yourwebsite.com</span>
          </div>
        </div>
        {/* Page content placeholder */}
        <div className="p-5 space-y-2 opacity-40">
          <div className="h-2 w-3/4 rounded-full" style={{ backgroundColor: "#ddd" }} />
          <div className="h-2 w-1/2 rounded-full" style={{ backgroundColor: "#ddd" }} />
          <div className="h-2 w-2/3 rounded-full" style={{ backgroundColor: "#ddd" }} />
          <div className="mt-4 h-8 w-1/3 rounded-lg" style={{ backgroundColor: "#ddd" }} />
        </div>
      </div>

      {/* Chat window */}
      <div
        className="relative z-10 mb-14 mr-0 w-[220px] rounded-2xl overflow-hidden border shadow-xl"
        style={{ borderColor: "#eee", boxShadow: `0 20px 60px ${primaryColor}25` }}
      >
        {/* Chat header */}
        <div
          className="flex items-center gap-2.5 px-3.5 py-2.5"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="Bot avatar" className="w-full h-full object-cover" />
            ) : (
              <Bot className="w-3.5 h-3.5 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{name || "My Bot"}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-300" />
              <p className="text-white/70 text-[9px]">Online</p>
            </div>
          </div>
          <X className="w-3.5 h-3.5 text-white/60" />
        </div>

        {/* Chat body */}
        <div className="px-3 py-3 space-y-2.5 min-h-[100px]" style={{ backgroundColor: "#fff" }}>
          {/* Bot greeting bubble */}
          <div className="flex items-end gap-1.5">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              <Bot className="w-2.5 h-2.5 text-white" />
            </div>
            <div
              className="rounded-2xl rounded-bl-sm px-2.5 py-1.5 max-w-[160px] border"
              style={{ backgroundColor: "#f8f7f4", borderColor: "#eeebe6" }}
            >
              <p className="text-[10px] leading-relaxed" style={{ color: "#333" }}>
                {greeting || "Hi there! How can I help you today?"}
              </p>
            </div>
          </div>

          {/* Mock user message */}
          <div className="flex justify-end">
            <div
              className="rounded-2xl rounded-br-sm px-2.5 py-1.5 max-w-[130px]"
              style={{ backgroundColor: primaryColor }}
            >
              <p className="text-white text-[10px]">Hey, I need help!</p>
            </div>
          </div>

          {/* Typing indicator */}
          <div className="flex items-end gap-1.5">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              <Bot className="w-2.5 h-2.5 text-white" />
            </div>
            <div
              className="rounded-2xl rounded-bl-sm px-3 py-2 border"
              style={{ backgroundColor: "#f8f7f4", borderColor: "#eeebe6" }}
            >
              <div className="flex gap-1 items-center">
                <span className="w-1 h-1 rounded-full animate-bounce" style={{ backgroundColor: "#bbb", animationDelay: "0ms" }} />
                <span className="w-1 h-1 rounded-full animate-bounce" style={{ backgroundColor: "#bbb", animationDelay: "150ms" }} />
                <span className="w-1 h-1 rounded-full animate-bounce" style={{ backgroundColor: "#bbb", animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Chat input */}
        <div
          className="border-t px-2.5 py-2 flex items-center gap-1.5"
          style={{ backgroundColor: "#fff", borderColor: "#eeebe6" }}
        >
          <div
            className="flex-1 h-6 rounded-full border"
            style={{ backgroundColor: "#f8f7f4", borderColor: "#eee" }}
          />
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: primaryColor }}
          >
            <svg className="w-3 h-3 text-white rotate-90" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Floating chat bubble */}
      <div
        className="relative z-10 w-11 h-11 rounded-full shadow-xl flex items-center justify-center cursor-pointer"
        style={{ backgroundColor: primaryColor, boxShadow: `0 8px 30px ${primaryColor}50` }}
      >
        <Bot className="w-5 h-5 text-white" />
      </div>
    </div>
  );
}

export function BotForm({ bot }: BotFormProps) {
  const isEditing = !!bot;
  const [rightPanel, setRightPanel] = useState<"preview" | "test">("preview");

  const boundAction = isEditing
    ? updateBot.bind(null, bot.id)
    : createBot;

  const [state, action, pending] = useActionState<BotActionState, FormData>(
    boundAction,
    {}
  );

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [preview, setPreview] = useState({
    name: bot?.name ?? "",
    primaryColor: bot?.primaryColor ?? "#22c55e",
    secondaryColor: bot?.secondaryColor ?? "#ffffff",
    greeting: bot?.greeting ?? "Hi there! How can I help you today?",
    avatarUrl: bot?.avatarUrl ?? "",
    systemPromptExtra: bot?.systemPromptExtra ?? "",
    isActive: bot?.isActive ?? true,
  });

  const [suggestions, setSuggestions] = useState<string[]>(bot?.suggestions ?? []);
  const [suggestionInput, setSuggestionInput] = useState("");
  const suggestionInputRef = useRef<HTMLInputElement>(null);

  function addSuggestion() {
    const val = suggestionInput.trim();
    if (!val || suggestions.length >= 6 || suggestions.includes(val)) return;
    setSuggestions((prev) => [...prev, val]);
    setSuggestionInput("");
    suggestionInputRef.current?.focus();
  }

  function removeSuggestion(i: number) {
    setSuggestions((prev) => prev.filter((_, idx) => idx !== i));
  }

  const update = useCallback(
    (field: keyof typeof preview, value: string | boolean) =>
      setPreview((prev) => ({ ...prev, [field]: value })),
    []
  );

  return (
    <div className="flex flex-col h-full" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/bots"
            className="flex items-center justify-center w-8 h-8 rounded-xl border transition-colors cursor-pointer"
            style={{ borderColor: "#e5e5e5", backgroundColor: "#fff" }}
          >
            <ArrowLeft className="w-4 h-4 text-[#888]" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#111]">
              {isEditing ? `Edit "${bot.name}"` : "Create a new bot"}
            </h1>
            <p className="text-[#aaa] text-sm mt-0.5">
              {isEditing
                ? "Modify your bot settings. Changes are saved instantly."
                : "Set up your bot in seconds. You can always change these later."}
            </p>
          </div>
        </div>

        <button
          form="bot-form"
          type="submit"
          disabled={pending}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-md disabled:opacity-60 cursor-pointer"
          style={{ backgroundColor: "#111" }}
        >
          {pending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving…
            </>
          ) : state.success ? (
            <>
              <Check className="w-4 h-4" />
              Saved
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              {isEditing ? "Save changes" : "Create bot"}
            </>
          )}
        </button>
      </div>

      {/* Success / error messages */}
      {state.message && !state.success && (
        <div
          className="mb-6 flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
          style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}
        >
          <X className="w-4 h-4 flex-shrink-0" />
          {state.message}
        </div>
      )}
      {state.success && state.message && (
        <div
          className="mb-6 flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
          style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a" }}
        >
          <Check className="w-4 h-4 flex-shrink-0" />
          {state.message}
        </div>
      )}

      {/* Two-column layout */}
      <div className="flex flex-col xl:flex-row gap-6 flex-1 min-h-0">
        {/* LEFT — Form */}
        <form
          id="bot-form"
          action={action}
          className="flex flex-col gap-5 xl:w-[480px] flex-shrink-0"
        >
          <input
            type="hidden"
            name="isActive"
            value={preview.isActive ? "true" : "false"}
          />
          <input
            type="hidden"
            name="suggestions"
            value={JSON.stringify(suggestions)}
          />

          {/* Section: Identity */}
          <section
            className="rounded-2xl border p-5 space-y-4"
            style={{ backgroundColor: "#fff", borderColor: "#eeebe6" }}
          >
            <h2 className="text-sm font-bold text-[#111] flex items-center gap-2">
              <span
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "#f0fdf4" }}
              >
                <Bot className="w-3.5 h-3.5 text-green-600" />
              </span>
              Identity
            </h2>

            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-semibold text-[#555]">
                Bot name <span className="text-red-400">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g. Support Assistant"
                defaultValue={bot?.name}
                onChange={(e) => update("name", e.target.value)}
                className="h-11 rounded-xl border-[#e5e5e5] text-[#111] placeholder:text-[#ccc] focus-visible:ring-1 focus-visible:ring-green-500 focus-visible:border-green-400"
              />
              {state.errors?.name && (
                <p className="text-xs text-red-500">{state.errors.name[0]}</p>
              )}
            </div>

            <div
              className="flex items-center justify-between p-3.5 rounded-xl"
              style={{ backgroundColor: "#f8f7f4" }}
            >
              <div>
                <p className="text-sm font-semibold text-[#333]">Status</p>
                <p className="text-xs text-[#aaa] mt-0.5">
                  {preview.isActive ? "Bot is live and accepting chats" : "Bot is paused"}
                </p>
              </div>
              <Switch
                checked={preview.isActive}
                onCheckedChange={(v) => update("isActive", v)}
              />
            </div>
          </section>

          {/* Section: Appearance */}
          <section
            className="rounded-2xl border p-5 space-y-4"
            style={{ backgroundColor: "#fff", borderColor: "#eeebe6" }}
          >
            <h2 className="text-sm font-bold text-[#111] flex items-center gap-2">
              <span
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "#fdf4ff" }}
              >
                <svg className="w-3.5 h-3.5" style={{ color: "#9333ea" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </span>
              Appearance
            </h2>

            {/* Primary color */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-[#555]">
                Primary color
              </Label>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="primaryColor"
                    className="relative w-10 h-10 rounded-xl border-2 overflow-hidden cursor-pointer flex-shrink-0 hover:shadow-md transition-all"
                    style={{ backgroundColor: preview.primaryColor, borderColor: preview.primaryColor }}
                    suppressHydrationWarning
                  >
                    {mounted && (
                      <input
                        id="primaryColor"
                        type="color"
                        name="primaryColor"
                        value={preview.primaryColor}
                        onChange={(e) => update("primaryColor", e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    )}
                  </label>
                  <Input
                    type="text"
                    value={preview.primaryColor}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) update("primaryColor", v);
                    }}
                    maxLength={7}
                    className="h-10 rounded-xl border-[#e5e5e5] text-[#111] font-mono text-sm focus-visible:ring-1 focus-visible:ring-green-500"
                  />
                </div>
                {/* Preset swatches */}
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => update("primaryColor", color)}
                      className="w-7 h-7 rounded-lg border-2 transition-all cursor-pointer hover:scale-110"
                      style={{
                        backgroundColor: color,
                        borderColor: preview.primaryColor === color ? "#111" : "transparent",
                        boxShadow: preview.primaryColor === color ? `0 0 0 2px #fff, 0 0 0 4px ${color}` : "none",
                      }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
              {state.errors?.primaryColor && (
                <p className="text-xs text-red-500">{state.errors.primaryColor[0]}</p>
              )}
            </div>

            {/* Avatar URL */}
            <div className="space-y-1.5">
              <Label htmlFor="avatarUrl" className="text-sm font-semibold text-[#555]">
                Avatar image URL{" "}
                <span className="text-[#aaa] font-normal">(optional)</span>
              </Label>
              <Input
                id="avatarUrl"
                name="avatarUrl"
                placeholder="https://example.com/avatar.png"
                defaultValue={bot?.avatarUrl ?? ""}
                onChange={(e) => update("avatarUrl", e.target.value)}
                className="h-11 rounded-xl border-[#e5e5e5] text-[#111] placeholder:text-[#ccc] focus-visible:ring-1 focus-visible:ring-green-500"
              />
              {state.errors?.avatarUrl && (
                <p className="text-xs text-red-500">{state.errors.avatarUrl[0]}</p>
              )}
            </div>
          </section>

          {/* Section: Behavior */}
          <section
            className="rounded-2xl border p-5 space-y-4"
            style={{ backgroundColor: "#fff", borderColor: "#eeebe6" }}
          >
            <h2 className="text-sm font-bold text-[#111] flex items-center gap-2">
              <span
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "#f0fdf4" }}
              >
                <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </span>
              Behavior
            </h2>

            <div className="space-y-1.5">
              <Label htmlFor="greeting" className="text-sm font-semibold text-[#555]">
                Greeting message <span className="text-red-400">*</span>
              </Label>
              <Textarea
                id="greeting"
                name="greeting"
                placeholder="Hi there! How can I help you today?"
                defaultValue={bot?.greeting}
                onChange={(e) => update("greeting", e.target.value)}
                rows={3}
                className="rounded-xl border-[#e5e5e5] text-[#111] placeholder:text-[#ccc] focus-visible:ring-1 focus-visible:ring-green-500"
              />
              <p className="text-xs text-[#bbb]">
                {preview.greeting.length}/300 characters
              </p>
              {state.errors?.greeting && (
                <p className="text-xs text-red-500">{state.errors.greeting[0]}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="systemPromptExtra" className="text-sm font-semibold text-[#555]">
                Custom instructions{" "}
                <span className="text-[#aaa] font-normal">(optional)</span>
              </Label>
              <Textarea
                id="systemPromptExtra"
                name="systemPromptExtra"
                placeholder="e.g. Always respond in a friendly tone. Only answer questions related to our product. Escalate billing issues to support@company.com."
                defaultValue={bot?.systemPromptExtra ?? ""}
                onChange={(e) => update("systemPromptExtra", e.target.value)}
                rows={4}
                className="rounded-xl border-[#e5e5e5] text-[#111] placeholder:text-[#ccc] focus-visible:ring-1 focus-visible:ring-green-500"
              />
              <p className="text-xs text-[#bbb]">
                Extra instructions appended to the AI system prompt.{" "}
                {preview.systemPromptExtra.length}/2000
              </p>
              {state.errors?.systemPromptExtra && (
                <p className="text-xs text-red-500">{state.errors.systemPromptExtra[0]}</p>
              )}
            </div>
          </section>

          {/* Section: Quick Suggestions */}
          <section
            className="rounded-2xl border p-5 space-y-4"
            style={{ backgroundColor: "#fff", borderColor: "#eeebe6" }}
          >
            <div>
              <h2 className="text-sm font-bold text-[#111] flex items-center gap-2">
                <span
                  className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: "#eff6ff" }}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                </span>
                Quick suggestions
              </h2>
              <p className="text-xs text-[#aaa] mt-1 ml-8">
                Clickable prompts shown to users before they type. Max 6.
              </p>
            </div>

            {/* Chips */}
            {suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border"
                    style={{
                      backgroundColor: preview.primaryColor + "10",
                      borderColor: preview.primaryColor + "40",
                      color: preview.primaryColor,
                    }}
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => removeSuggestion(i)}
                      className="flex-shrink-0 hover:opacity-70 transition-opacity cursor-pointer"
                      aria-label="Remove suggestion"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Add input */}
            {suggestions.length < 6 && (
              <div className="flex items-center gap-2">
                <input
                  ref={suggestionInputRef}
                  type="text"
                  value={suggestionInput}
                  onChange={(e) => setSuggestionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSuggestion();
                    }
                  }}
                  placeholder={suggestions.length === 0 ? 'e.g. "What are your hours?"' : "Add another…"}
                  maxLength={100}
                  className="flex-1 h-10 rounded-xl border px-3 text-sm text-[#111] placeholder:text-[#ccc] outline-none focus:ring-1 focus:ring-green-500 focus:border-green-400 transition-all"
                  style={{ borderColor: "#e5e5e5" }}
                />
                <button
                  type="button"
                  onClick={addSuggestion}
                  disabled={!suggestionInput.trim()}
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#f5f5f5]"
                  style={{ borderColor: "#e5e5e5" }}
                >
                  <Plus className="w-4 h-4 text-[#555]" />
                </button>
              </div>
            )}

            {suggestions.length >= 6 && (
              <p className="text-xs text-[#aaa]">Maximum 6 suggestions reached.</p>
            )}
          </section>
        </form>

        {/* RIGHT — Preview / Test panel */}
        <div className="flex-1 xl:sticky xl:top-6 xl:self-start">
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ backgroundColor: "#fff", borderColor: "#eeebe6" }}
          >
            {/* Panel header with toggle */}
            <div
              className="flex items-center gap-2 px-3 py-3 border-b"
              style={{ borderColor: "#eeebe6", backgroundColor: "#fafaf9" }}
            >
              {/* Tab buttons */}
              <div className="flex items-center gap-1 flex-1">
                <button
                  type="button"
                  onClick={() => setRightPanel("preview")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${rightPanel === "preview"
                      ? "text-[#111]"
                      : "text-[#aaa] hover:text-[#555]"
                    }`}
                  style={rightPanel === "preview" ? { backgroundColor: "#fff", border: "1px solid #e5e5e5" } : {}}
                >
                  <Eye className="w-3 h-3" />
                  Preview
                </button>
                <button
                  type="button"
                  onClick={() => setRightPanel("test")}
                  disabled={!isEditing}
                  title={!isEditing ? "Save your bot first to test it" : undefined}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${rightPanel === "test"
                      ? "text-green-700"
                      : "text-[#aaa] hover:text-[#555]"
                    }`}
                  style={rightPanel === "test" ? { backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" } : {}}
                >
                  <MessageSquare className="w-3 h-3" />
                  Test chat
                  {isEditing && (
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  )}
                </button>
              </div>
              {rightPanel === "preview" && (
                <span className="text-[10px] text-[#bbb]">Updates as you type</span>
              )}
              {rightPanel === "test" && (
                <span className="text-[10px] text-[#bbb]">Live · messages saved</span>
              )}
            </div>

            {/* Panel body */}
            <div className="h-[520px]">
              {rightPanel === "preview" ? (
                <ChatWidgetPreview
                  name={preview.name}
                  primaryColor={preview.primaryColor}
                  greeting={preview.greeting}
                  avatarUrl={preview.avatarUrl}
                />
              ) : isEditing ? (
                <TestChat
                  botId={bot.id}
                  botName={preview.name || bot.name}
                  primaryColor={preview.primaryColor}
                  greeting={preview.greeting || bot.greeting}
                  avatarUrl={preview.avatarUrl || bot.avatarUrl}
                  suggestions={suggestions}
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
