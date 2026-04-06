"use client";

import { useEffect, useState } from "react";
import { Check, Code2, Copy, ExternalLink, Globe, Zap } from "lucide-react";

interface Bot {
  id: string;
  name: string;
  primaryColor: string;
  isActive: boolean;
}

export default function EmbedPage() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/embed/bots")
      .then((r) => r.json())
      .then((data: Bot[]) => {
        setBots(data);
        if (data.length > 0) setSelectedId(data[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  const appUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "https://yourapp.com";

  const snippet = selectedId
    ? `<!-- Hiro Chat Widget -->\n<script\n  src="${appUrl}/widget.js"\n  data-bot-id="${selectedId}"\n  data-host="${appUrl}"\n  defer\n></script>`
    : "";

  async function copySnippet() {
    if (!snippet) return;
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const selectedBot = bots.find((b) => b.id === selectedId);

  return (
    <div className="space-y-8 max-w-4xl" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#111]">Embed Widget</h1>
        <p className="text-[#999] mt-1 text-sm">
          Add your AI chatbot to any website with one line of HTML.
        </p>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Code2, iconBg: "#eff6ff", iconColor: "#2563eb", title: "Copy snippet", desc: "Grab the script tag below" },
          { icon: Globe, iconBg: "#f0fdf4", iconColor: "#16a34a", title: "Paste anywhere", desc: "Before </body> on your site" },
          { icon: Zap, iconBg: "#fffbeb", iconColor: "#d97706", title: "Goes live instantly", desc: "No rebuild or deploy needed" },
        ].map((step) => (
          <div
            key={step.title}
            className="flex gap-3 items-start rounded-2xl border p-4"
            style={{ backgroundColor: "#fff", borderColor: "#eeebe6" }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ backgroundColor: step.iconBg }}
            >
              <step.icon className="w-4 h-4" style={{ color: step.iconColor }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#111]">{step.title}</p>
              <p className="text-xs text-[#aaa] mt-0.5">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bot selector + snippet */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ backgroundColor: "#fff", borderColor: "#eeebe6" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between gap-4 px-5 py-4 border-b"
          style={{ borderColor: "#eeebe6", backgroundColor: "#fafaf9" }}
        >
          <p className="text-sm font-bold text-[#111]">Your embed code</p>
          {bots.length > 1 && (
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="rounded-xl border px-3 py-1.5 text-sm text-[#333] focus:outline-none focus:ring-2 focus:ring-green-500/30 cursor-pointer"
              style={{ borderColor: "#e5e5e5", backgroundColor: "#fff" }}
            >
              {bots.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {loading ? (
          <div className="px-5 py-10 text-center text-[#bbb] text-sm">Loading bots…</div>
        ) : bots.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-[#999] text-sm">
              You need to create a bot first before you can embed it.
            </p>
            <a
              href="/dashboard/bots/new"
              className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-white px-5 py-2.5 rounded-xl transition-all hover:opacity-90"
              style={{ backgroundColor: "#111" }}
            >
              Create a bot
            </a>
          </div>
        ) : (
          <>
            {/* Inactive warning */}
            {selectedBot && !selectedBot.isActive && (
              <div
                className="mx-5 mt-4 flex items-center gap-2 rounded-xl px-4 py-3 text-xs"
                style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a", color: "#92400e" }}
              >
                <Zap className="w-3.5 h-3.5 flex-shrink-0" />
                <span><strong>{selectedBot.name}</strong> is inactive. The widget will not respond until you activate the bot.</span>
              </div>
            )}

            {/* Code block */}
            <div className="relative m-5">
              <pre
                className="rounded-xl p-4 text-xs font-mono overflow-x-auto leading-relaxed whitespace-pre"
                style={{ backgroundColor: "#111", color: "#d4d4d4", border: "1px solid #222" }}
              >
                {snippet}
              </pre>
              <button
                onClick={copySnippet}
                className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
                style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "#d4d4d4", border: "1px solid rgba(255,255,255,0.15)" }}
              >
                {copied ? (
                  <><Check className="w-3.5 h-3.5 text-green-400" /> Copied!</>
                ) : (
                  <><Copy className="w-3.5 h-3.5" /> Copy</>
                )}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Installation guide */}
      <div
        className="rounded-2xl border p-6 space-y-4"
        style={{ backgroundColor: "#fff", borderColor: "#eeebe6" }}
      >
        <h2 className="text-sm font-bold text-[#111]">Installation guide</h2>
        <div className="space-y-3 text-sm text-[#666]">
          {[
            { label: "HTML sites", detail: "Paste the snippet just before the closing </body> tag." },
            { label: "WordPress", detail: "Use a plugin like Insert Headers and Footers, paste into the footer section." },
            { label: "Shopify", detail: "Theme editor → Edit code → theme.liquid → paste before </body>." },
            { label: "Webflow", detail: "Project Settings → Custom Code → Footer Code." },
            { label: "Next.js / React", detail: 'Add a <Script> component in your root layout with strategy="lazyOnload".' },
          ].map((item) => (
            <div key={item.label} className="flex gap-3">
              <span className="font-semibold text-green-600 w-28 flex-shrink-0">{item.label}</span>
              <span className="text-[#777]">{item.detail}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Next.js example */}
      <div
        className="rounded-2xl border p-6 space-y-3"
        style={{ backgroundColor: "#fff", borderColor: "#eeebe6" }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#111]">Next.js example</h2>
          <a
            href="https://nextjs.org/docs/app/api-reference/components/script"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-[#aaa] hover:text-green-600 transition-colors cursor-pointer"
          >
            Docs <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <pre
          className="rounded-xl p-4 text-xs font-mono overflow-x-auto leading-relaxed"
          style={{ backgroundColor: "#111", color: "#d4d4d4", border: "1px solid #222" }}
        >{`import Script from 'next/script'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Script
          src="${appUrl}/widget.js"
          data-bot-id="${selectedId || 'YOUR_BOT_ID'}"
          data-host="${appUrl}"
          strategy="lazyOnload"
        />
      </body>
    </html>
  )
}`}</pre>
      </div>
    </div>
  );
}
