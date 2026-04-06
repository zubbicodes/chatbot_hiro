"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Code2,
  Copy,
  ExternalLink,
  Globe,
  Zap,
  FileCode2,
  Atom,
  LayoutTemplate,
  ShoppingBag,
  Blocks
} from "lucide-react";

interface Bot {
  id: string;
  name: string;
  primaryColor: string;
  isActive: boolean;
}

const platforms = [
  { id: "html", name: "HTML / Vanilla", icon: FileCode2, color: "#e34f26" },
  { id: "wordpress", name: "WordPress", icon: LayoutTemplate, color: "#21759b" },
  { id: "shopify", name: "Shopify", icon: ShoppingBag, color: "#95bf47" },
  { id: "webflow", name: "Webflow", icon: Blocks, color: "#4353ff" },
  { id: "react", name: "React / Next.js", icon: Atom, color: "#61dafb" },
];

const platformSteps: Record<string, { title: string; desc: string; showCode?: boolean }[]> = {
  html: [
    { title: "Copy the script", desc: "Copy your unique embed script from the section above." },
    { title: "Open your HTML file", desc: "Open your index.html or the main layout file of your website in your code editor." },
    { title: "Paste the snippet", desc: "Locate the closing </body> tag and paste the script directly above it." },
    { title: "Save and deploy", desc: "Save your file and upload it to your web server. The chatbot will appear instantly on your website." },
  ],
  wordpress: [
    { title: "Install a code snippet plugin", desc: "Log in to your WordPress dashboard. Go to Plugins > Add New and search for 'WPCode – Insert Headers and Footers'. Install and activate it." },
    { title: "Navigate to Header & Footer", desc: "On the left sidebar, navigate to Code Snippets > Header & Footer." },
    { title: "Paste your widget code", desc: "Scroll down to the 'Footer' section and paste the embed script you copied from the section above." },
    { title: "Save Changes", desc: "Click the 'Save Changes' button at the top right. Your bot is now live across your WordPress site!" },
  ],
  shopify: [
    { title: "Go to Themes", desc: "In your Shopify admin dashboard, navigate to Online Store > Themes." },
    { title: "Edit theme code", desc: "Click the ... (three dots) menu next to your active theme and select 'Edit code'." },
    { title: "Open theme.liquid", desc: "Under the 'Layout' folder in the left sidebar, click on 'theme.liquid' to open the main layout file." },
    { title: "Paste before closing body tag", desc: "Scroll to the very bottom of the file, paste your snippet right above the closing </body> tag, and click Save." },
  ],
  webflow: [
    { title: "Open Project Settings", desc: "Go to your Webflow dashboard, locate your project, and click into 'Project Settings'." },
    { title: "Navigate to Custom Code", desc: "From the top navigation tabs in Project Settings, select 'Custom Code'." },
    { title: "Add to Footer Code", desc: "Scroll down to the 'Footer Code' text area and paste your widget snippet there." },
    { title: "Save and Publish", desc: "Click 'Save Changes' and then publish your site (to desired domains) for the chatbot to appear." },
  ],
  react: [
    { title: "Open your Layout File", desc: "Open your Next.js project layout file, typically app/layout.tsx (App router) or pages/_document.js (Pages router)." },
    { title: "Add the Script component", desc: "Import the Script component from next/script and place it inside the body tag. Make sure you use strategy='lazyOnload' to avoid impacting page performance.", showCode: true },
    { title: "Deploy your app", desc: "Commit your changes and deploy. The chatbot will dynamically load across your application." },
  ]
};

export default function EmbedPage() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("html");

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

  const nextJsSnippet = `import Script from 'next/script'

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
}`;

  async function copySnippet() {
    if (!snippet) return;
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const selectedBot = bots.find((b) => b.id === selectedId);

  return (
    <div className="space-y-8 max-w-4xl pb-16" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#111]">Embed Widget</h1>
        <p className="text-[#999] mt-1 text-sm">
          Add your AI chatbot to any website effortlessly.
        </p>
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
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-[#666]" />
            <p className="text-sm font-bold text-[#111]">Your embed code</p>
          </div>
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
              <Zap className="w-4 h-4" />
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
                <span><strong>{selectedBot.name}</strong> is currently inactive. The widget will not display until you activate it.</span>
              </div>
            )}

            {/* Code block */}
            <div className="relative m-5">
              <pre
                className="rounded-xl p-5 text-xs font-mono overflow-x-auto leading-relaxed whitespace-pre"
                style={{ backgroundColor: "#111", color: "#d4d4d4", border: "1px solid #222" }}
              >
                {snippet}
              </pre>
              <button
                onClick={copySnippet}
                className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer hover:bg-white/20"
                style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)" }}
              >
                {copied ? (
                  <><Check className="w-3.5 h-3.5 text-green-400" /> Copied!</>
                ) : (
                  <><Copy className="w-3.5 h-3.5" /> Copy Code</>
                )}
              </button>
            </div>

            <div className="px-5 pb-5 text-xs text-[#888] flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              This script tag loads the chatbot into your website safely without affecting page speed.
            </div>
          </>
        )}
      </div>

      {/* Platform Selector section */}
      <div>
        <h2 className="text-xl font-bold text-[#111] mb-2">Installation Guide</h2>
        <p className="text-sm text-[#666] mb-6">Select your website platform to see detailed setup instructions.</p>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          {platforms.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPlatform(p.id)}
              className={"flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200"}
              style={{
                backgroundColor: selectedPlatform === p.id ? '#fff' : '#fafaf9',
                borderColor: selectedPlatform === p.id ? '#111' : '#eeebe6',
                boxShadow: selectedPlatform === p.id ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                transform: selectedPlatform === p.id ? 'translateY(-2px)' : 'none'
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-colors"
                style={{
                  backgroundColor: selectedPlatform === p.id ? `${p.color}15` : '#f0f0f0',
                }}
              >
                <p.icon
                  className="w-5 h-5 transition-colors"
                  style={{ color: selectedPlatform === p.id ? p.color : '#888' }}
                />
              </div>
              <span
                className="text-xs font-semibold text-center transition-colors"
                style={{ color: selectedPlatform === p.id ? '#111' : '#666' }}
              >
                {p.name}
              </span>
            </button>
          ))}
        </div>

        {/* Dynamic Steps based on platform */}
        <div className="rounded-2xl border bg-white p-6 md:p-8 shadow-sm" style={{ borderColor: "#eeebe6" }}>
          <h3 className="text-lg font-bold text-[#111] mb-8 flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100/50 text-green-600 border border-green-200">
              <Zap className="w-4 h-4 fill-green-600/20" />
            </span>
            How to install on {platforms.find(p => p.id === selectedPlatform)?.name}
          </h3>

          <div className="space-y-0">
            {platformSteps[selectedPlatform].map((step, idx) => {
              const isLast = idx === platformSteps[selectedPlatform].length - 1;
              return (
                <div key={idx} className="flex gap-5">
                  {/* Step Line/Number Indicator */}
                  <div className="flex flex-col items-center">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 z-10"
                      style={{ backgroundColor: '#111', color: '#fff' }}
                    >
                      {idx + 1}
                    </div>
                    {!isLast && (
                      <div className="w-px h-full my-1" style={{ backgroundColor: '#e5e5e5' }} />
                    )}
                  </div>

                  {/* Step Content */}
                  <div className={"pb-10"}>
                    <h4 className="text-[15px] font-bold text-[#111] mb-2 tracking-tight">{step.title}</h4>
                    <p className="text-sm text-[#555] leading-relaxed max-w-2xl">{step.desc}</p>

                    {/* Render Next.js snippet specially if required */}
                    {step.showCode && selectedPlatform === 'react' && (
                      <div className="mt-4 max-w-2xl border rounded-xl overflow-hidden" style={{ borderColor: "#eeebe6" }}>
                        <div className="flex justify-between items-center px-4 py-2 bg-[#fafaf9] border-b" style={{ borderColor: "#eeebe6" }}>
                          <span className="text-xs font-semibold text-[#555]">app/layout.tsx</span>
                          <a
                            href="https://nextjs.org/docs/app/api-reference/components/script"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-[#888] hover:text-green-600 transition-colors"
                          >
                            Docs <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <pre
                          className="p-4 text-xs font-mono overflow-x-auto leading-relaxed"
                          style={{ backgroundColor: "#111", color: "#d4d4d4" }}
                        >
                          {nextJsSnippet}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
