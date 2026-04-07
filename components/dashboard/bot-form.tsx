"use client";

import { useActionState, useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft, Bot, Check, Loader2, Plus, Sparkles, X,
  Palette, MessageSquare, Zap,
} from "lucide-react";
import { TestChat } from "@/components/dashboard/test-chat";
import { BookingSection } from "@/components/dashboard/booking-section";
import { LeadFormSection } from "@/components/dashboard/lead-form-section";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { createBot, updateBot, type BotActionState } from "@/lib/actions/bot.actions";
import type { LeadField } from "@/lib/validations/lead";

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
  leadEnabled: boolean;
  leadTrigger: "immediately" | "after_first_reply";
  leadFields: LeadField[];
  bookingEnabled: boolean;
  bookingUrl: string | null;
}

interface BotFormProps {
  bot?: BotData;
}

const PRESET_COLORS = [
  "#22c55e", "#6366f1", "#8b5cf6", "#ec4899",
  "#ef4444", "#f97316", "#eab308", "#06b6d4",
  "#0ea5e9", "#64748b",
];

const TABS = [
  { id: "identity", label: "Identity & Look", icon: Palette },
  { id: "behavior", label: "Behavior", icon: MessageSquare },
  { id: "features", label: "Features", icon: Zap },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function BotForm({ bot }: BotFormProps) {
  const isEditing = !!bot;
  const [activeTab, setActiveTab] = useState<TabId>("identity");

  const boundAction = isEditing ? updateBot.bind(null, bot.id) : createBot;
  const [state, action, pending] = useActionState<BotActionState, FormData>(boundAction, {});

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [preview, setPreview] = useState({
    name: bot?.name ?? "",
    primaryColor: bot?.primaryColor ?? "#22c55e",
    greeting: bot?.greeting ?? "Hi there! How can I help you today?",
    avatarUrl: bot?.avatarUrl ?? "",
    systemPromptExtra: bot?.systemPromptExtra ?? "",
    isActive: bot?.isActive ?? true,
  });

  const [suggestions, setSuggestions] = useState<string[]>(bot?.suggestions ?? []);
  const [suggestionInput, setSuggestionInput] = useState("");
  const suggestionInputRef = useRef<HTMLInputElement>(null);

  const [leadEnabled, setLeadEnabled] = useState(bot?.leadEnabled ?? false);
  const [leadTrigger, setLeadTrigger] = useState<"immediately" | "after_first_reply">(
    bot?.leadTrigger ?? "after_first_reply"
  );
  const [leadFields, setLeadFields] = useState<LeadField[]>(bot?.leadFields ?? []);
  const [bookingEnabled, setBookingEnabled] = useState(bot?.bookingEnabled ?? false);
  const [bookingUrl, setBookingUrl] = useState(bot?.bookingUrl ?? "");

  const update = useCallback(
    (field: keyof typeof preview, value: string | boolean) =>
      setPreview((prev) => ({ ...prev, [field]: value })),
    []
  );

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

  const inputClass =
    "h-10 rounded-xl border-[#e5e5e5] text-[#111] placeholder:text-[#ccc] focus-visible:ring-1 focus-visible:ring-green-500 text-sm";

  return (
    /* Full-height flex column so the fixed widget doesn't obscure content */
    <div className="min-h-screen" style={{ fontFamily: "'Poppins', sans-serif", backgroundColor: "#fafaf9" }}>

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-20 flex items-center justify-between gap-4 px-6 py-4 border-b"
        style={{ backgroundColor: "#fff", borderColor: "#eeebe6" }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/bots"
            className="flex items-center justify-center w-8 h-8 rounded-xl border transition-colors cursor-pointer"
            style={{ borderColor: "#e5e5e5", backgroundColor: "#fff" }}
          >
            <ArrowLeft className="w-4 h-4 text-[#888]" />
          </Link>
          <div>
            <h1 className="text-base font-bold text-[#111]">
              {isEditing ? `Edit "${bot.name}"` : "Create a new bot"}
            </h1>
            <p className="text-xs text-[#bbb] mt-0.5">
              {isEditing ? "Changes saved instantly on save." : "Set up your bot in seconds."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {state.success && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-green-600">
              <Check className="w-3.5 h-3.5" /> Saved
            </span>
          )}
          {state.message && !state.success && (
            <span className="text-xs text-red-500">{state.message}</span>
          )}
          <button
            form="bot-form"
            type="submit"
            disabled={pending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-md disabled:opacity-60 cursor-pointer"
            style={{ backgroundColor: "#111" }}
          >
            {pending ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
            ) : (
              <><Sparkles className="w-4 h-4" />{isEditing ? "Save changes" : "Create bot"}</>
            )}
          </button>
        </div>
      </div>

      {/* ── Tab nav ─────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-1 px-6 pt-4 pb-0"
        style={{ backgroundColor: "#fafaf9" }}
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                active
                  ? "border-green-500 text-green-700"
                  : "border-transparent text-[#888] hover:text-[#444]"
              }`}
              style={active ? { backgroundColor: "#fff" } : {}}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      {/* Right padding accounts for the fixed widget (360px + 24px gap + 24px right) */}
      <div className="px-6 pt-0 pb-8" style={{ paddingRight: isEditing ? "432px" : "24px" }}>
        <form id="bot-form" action={action}>
          {/* Always-present hidden fields */}
          <input type="hidden" name="isActive" value={preview.isActive ? "true" : "false"} />
          <input type="hidden" name="suggestions" value={JSON.stringify(suggestions)} />
          <input type="hidden" name="secondaryColor" value="#ffffff" />
          <input type="hidden" name="leadEnabled" value={leadEnabled ? "true" : "false"} />
          <input type="hidden" name="leadTrigger" value={leadTrigger} />
          <input type="hidden" name="leadFields" value={JSON.stringify(leadFields)} />
          <input type="hidden" name="bookingEnabled" value={bookingEnabled ? "true" : "false"} />
          <input type="hidden" name="bookingUrl" value={bookingUrl} />

          {/* ── TAB 1: Identity & Look ────────────────────────────────────── */}
          {activeTab === "identity" && (
            <div
              className="rounded-b-2xl rounded-tr-2xl border p-6 space-y-5"
              style={{ backgroundColor: "#fff", borderColor: "#eeebe6" }}
            >
              {/* Bot name + status in a row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[#555]">
                    Bot name <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    name="name"
                    placeholder="e.g. Support Assistant"
                    defaultValue={bot?.name}
                    onChange={(e) => update("name", e.target.value)}
                    className={inputClass}
                  />
                  {state.errors?.name && (
                    <p className="text-xs text-red-500">{state.errors.name[0]}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[#555]">Status</Label>
                  <div
                    className="flex items-center justify-between h-10 rounded-xl px-3.5"
                    style={{ backgroundColor: "#f8f7f4", border: "1px solid #eeebe6" }}
                  >
                    <span className="text-sm text-[#444]">
                      {preview.isActive ? "Active" : "Paused"}
                    </span>
                    <Switch
                      checked={preview.isActive}
                      onCheckedChange={(v) => update("isActive", v)}
                    />
                  </div>
                </div>
              </div>

              {/* Primary color */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-[#555]">Primary color</Label>
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
                    className="h-10 w-28 rounded-xl border-[#e5e5e5] text-[#111] font-mono text-sm focus-visible:ring-1 focus-visible:ring-green-500"
                  />
                  {/* Preset swatches */}
                  <div className="flex flex-wrap gap-2 flex-1">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => update("primaryColor", color)}
                        className="w-7 h-7 rounded-lg border-2 transition-all cursor-pointer hover:scale-110 flex-shrink-0"
                        style={{
                          backgroundColor: color,
                          borderColor: preview.primaryColor === color ? "#111" : "transparent",
                          boxShadow: preview.primaryColor === color ? `0 0 0 2px #fff, 0 0 0 4px ${color}` : "none",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Avatar URL */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#555]">
                  Avatar image URL <span className="text-[#bbb] font-normal">(optional)</span>
                </Label>
                <Input
                  name="avatarUrl"
                  placeholder="https://example.com/avatar.png"
                  defaultValue={bot?.avatarUrl ?? ""}
                  onChange={(e) => update("avatarUrl", e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {/* ── TAB 2: Behavior ──────────────────────────────────────────── */}
          {activeTab === "behavior" && (
            <div
              className="rounded-b-2xl rounded-tr-2xl border p-6 space-y-5"
              style={{ backgroundColor: "#fff", borderColor: "#eeebe6" }}
            >
              {/* Greeting */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#555]">
                  Greeting message <span className="text-red-400">*</span>
                </Label>
                <Textarea
                  name="greeting"
                  placeholder="Hi there! How can I help you today?"
                  defaultValue={bot?.greeting}
                  onChange={(e) => update("greeting", e.target.value)}
                  rows={3}
                  className="rounded-xl bg-white border-[#e5e5e5] text-[#111] placeholder:text-[#ccc] focus-visible:ring-1 focus-visible:ring-green-500 text-sm resize-none"
                />
                <p className="text-xs text-[#ccc]">{preview.greeting.length}/300</p>
                {state.errors?.greeting && (
                  <p className="text-xs text-red-500">{state.errors.greeting[0]}</p>
                )}
              </div>

              {/* Custom instructions */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#555]">
                  Custom instructions <span className="text-[#bbb] font-normal">(optional)</span>
                </Label>
                <Textarea
                  name="systemPromptExtra"
                  placeholder="e.g. Always respond in a friendly tone. Only answer product-related questions."
                  defaultValue={bot?.systemPromptExtra ?? ""}
                  onChange={(e) => update("systemPromptExtra", e.target.value)}
                  rows={4}
                  className="rounded-xl bg-white border-[#e5e5e5] text-[#111] placeholder:text-[#ccc] focus-visible:ring-1 focus-visible:ring-green-500 text-sm resize-none"
                />
                <p className="text-xs text-[#ccc]">{preview.systemPromptExtra.length}/2000</p>
              </div>

              {/* Quick Suggestions */}
              <div className="space-y-2">
                <div>
                  <Label className="text-xs font-semibold text-[#555]">
                    Quick suggestions <span className="text-[#bbb] font-normal">(max 6)</span>
                  </Label>
                  <p className="text-xs text-[#ccc] mt-0.5">
                    Clickable prompts shown before the user types.
                  </p>
                </div>

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
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {suggestions.length < 6 && (
                  <div className="flex items-center gap-2">
                    <input
                      ref={suggestionInputRef}
                      type="text"
                      value={suggestionInput}
                      onChange={(e) => setSuggestionInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { e.preventDefault(); addSuggestion(); }
                      }}
                      placeholder={suggestions.length === 0 ? '"What are your hours?"' : "Add another…"}
                      maxLength={100}
                      className="flex-1 h-10 rounded-xl border px-3 text-sm text-[#111] placeholder:text-[#ccc] outline-none focus:ring-1 focus:ring-green-500 transition-all"
                      style={{ borderColor: "#e5e5e5" }}
                    />
                    <button
                      type="button"
                      onClick={addSuggestion}
                      disabled={!suggestionInput.trim()}
                      className="w-10 h-10 rounded-xl flex items-center justify-center border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#f5f5f5]"
                      style={{ borderColor: "#e5e5e5" }}
                    >
                      <Plus className="w-4 h-4 text-[#555]" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB 3: Features ──────────────────────────────────────────── */}
          {activeTab === "features" && (
            <div
              className="rounded-b-2xl rounded-tr-2xl border p-6 space-y-5"
              style={{ backgroundColor: "#fff", borderColor: "#eeebe6" }}
            >
              {/* Lead collection — rendered inline without its own card wrapper */}
              <LeadFormSection
                leadEnabled={leadEnabled}
                leadTrigger={leadTrigger}
                leadFields={leadFields}
                onEnabledChange={setLeadEnabled}
                onTriggerChange={setLeadTrigger}
                onFieldsChange={setLeadFields}
              />

              {/* Divider */}
              <div className="border-t" style={{ borderColor: "#f0ede8" }} />

              {/* Booking */}
              <BookingSection
                bookingEnabled={bookingEnabled}
                bookingUrl={bookingUrl}
                onEnabledChange={setBookingEnabled}
                onUrlChange={setBookingUrl}
              />
            </div>
          )}
        </form>
      </div>

      {/* ── Fixed bot widget — bottom-right ─────────────────────────────────── */}
      {isEditing && (
        <div
          className="fixed bottom-6 right-6 z-30 flex flex-col"
          style={{ width: "360px" }}
        >
          {/* "Live test" label */}
          <div className="flex items-center justify-end mb-2 pr-1">
            <span
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold"
              style={{ backgroundColor: "#111", color: "#fff" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Live test
            </span>
          </div>

          {/* Chat window */}
          <div
            className="rounded-2xl overflow-hidden flex flex-col"
            style={{
              height: "520px",
              boxShadow: `0 24px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)`,
            }}
          >
            <TestChat
              botId={bot.id}
              botName={preview.name || bot.name}
              primaryColor={preview.primaryColor}
              greeting={preview.greeting || bot.greeting}
              avatarUrl={preview.avatarUrl || bot.avatarUrl}
              suggestions={suggestions}
              leadEnabled={leadEnabled}
              leadTrigger={leadTrigger}
              leadFields={leadFields}
              bookingEnabled={bookingEnabled}
              bookingUrl={bookingUrl}
            />
          </div>
        </div>
      )}

      {/* When creating a new bot — show a small static preview hint */}
      {!isEditing && (
        <div className="fixed bottom-6 right-6 z-30">
          <div
            className="rounded-2xl p-4 border text-center"
            style={{ backgroundColor: "#fff", borderColor: "#eeebe6", width: "220px" }}
          >
            <div
              className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center"
              style={{ backgroundColor: preview.primaryColor }}
            >
              <Bot className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm font-semibold text-[#111]">{preview.name || "My Bot"}</p>
            <p className="text-xs text-[#aaa] mt-1">
              Save to start testing your bot here.
            </p>
            <div
              className="mt-3 rounded-xl px-3 py-2 text-xs text-left"
              style={{ backgroundColor: "#f8f7f4", color: "#555" }}
            >
              {preview.greeting || "Hi there! How can I help?"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
