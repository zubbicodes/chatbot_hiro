import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Bot, Zap, Shield, Code2, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "Train on your content",
    description: "Upload PDFs, paste URLs, or add text. Your bot learns your business instantly.",
    accent: "#22c55e",
    bg: "bg-green-50",
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    icon: Zap,
    title: "One-line embed",
    description: "Drop a single script tag on any site — WordPress, Shopify, Wix, or custom HTML.",
    accent: "#f59e0b",
    bg: "bg-amber-50",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  {
    icon: Shield,
    title: "Strict AI guardrails",
    description: "The bot stays on topic. No hallucinations, no off-brand responses.",
    accent: "#3b82f6",
    bg: "bg-blue-50",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    icon: Code2,
    title: "Fully customisable",
    description: "Match your brand colours, name your bot, and set the perfect greeting.",
    accent: "#8b5cf6",
    bg: "bg-violet-50",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
  },
];

const highlights = [
  "No credit card required",
  "Setup in under 5 minutes",
  "Works on any website",
];

export default function HomePage() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#f8f7f4", fontFamily: "'Poppins', sans-serif" }}
    >
      {/* Nav */}
      <header className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md"
            style={{ backgroundColor: "#111" }}
          >
            <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <span className="font-700 text-[#111] text-xl tracking-tight" style={{ fontWeight: 700 }}>Hiro</span>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/login" className="text-sm font-medium text-[#555] hover:text-[#111] transition-colors">
            Sign in
          </Link>
          <Link
            href="/register"
            className="flex items-center gap-1.5 text-sm font-semibold text-white px-5 py-2.5 rounded-xl transition-all hover:opacity-90 hover:shadow-lg"
            style={{ backgroundColor: "#111", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
          >
            Get started free
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </nav>
        <div className="md:hidden flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-[#555]">Sign in</Link>
          <Link
            href="/register"
            className="text-sm font-semibold text-white px-4 py-2 rounded-xl"
            style={{ backgroundColor: "#111" }}
          >
            Start free
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-16 pb-12 max-w-5xl mx-auto w-full">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-8 tracking-wide"
          style={{ backgroundColor: "#e8f5e9", color: "#2d8a3e", border: "1px solid #c8e6c9" }}
        >
          <Sparkles className="w-3 h-3" />
          AI-powered support, built for your business
        </div>

        {/* Headline */}
        <h1
          className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight mb-6"
          style={{ color: "#111", fontFamily: "'Poppins', sans-serif" }}
        >
          Your AI support agent,{" "}
          <span
            className="relative inline-block"
            style={{
              background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            trained in minutes
          </span>
        </h1>

        <p className="text-lg text-[#666] max-w-2xl mb-4 leading-relaxed" style={{ fontFamily: "'Poppins', sans-serif" }}>
          Build a custom chatbot that knows your business inside out. Embed it on any website with a single line of code. No developers needed.
        </p>

        {/* Highlights */}
        <div className="flex flex-wrap items-center justify-center gap-5 mb-10">
          {highlights.map((h) => (
            <div key={h} className="flex items-center gap-1.5 text-sm text-[#555]">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span>{h}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/register"
            className="flex items-center justify-center gap-2 text-base font-semibold text-white px-8 py-3.5 rounded-xl transition-all hover:opacity-90 hover:shadow-xl"
            style={{ backgroundColor: "#111", boxShadow: "0 4px 20px rgba(0,0,0,0.18)" }}
          >
            Start for free
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="flex items-center justify-center text-base font-medium text-[#444] px-8 py-3.5 rounded-xl border transition-all hover:bg-white hover:shadow-md"
            style={{ borderColor: "#ddd", backgroundColor: "rgba(255,255,255,0.6)" }}
          >
            Sign in
          </Link>
        </div>

        {/* Dashboard preview mockup */}
        <div
          className="mt-16 w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl border"
          style={{ borderColor: "#e5e5e5", backgroundColor: "#fff" }}
        >
          <div className="flex items-center gap-1.5 px-4 py-3 border-b" style={{ borderColor: "#f0f0f0", backgroundColor: "#fafafa" }}>
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
            <div className="flex-1 mx-4">
              <div className="h-4 w-40 mx-auto rounded-full" style={{ backgroundColor: "#f0f0f0" }} />
            </div>
          </div>
          <div className="p-6 space-y-3">
            <div className="flex gap-3">
              <div className="w-32 h-16 rounded-xl" style={{ backgroundColor: "#f8f7f4" }} />
              <div className="w-32 h-16 rounded-xl" style={{ backgroundColor: "#f8f7f4" }} />
              <div className="w-32 h-16 rounded-xl" style={{ backgroundColor: "#f8f7f4" }} />
            </div>
            <div className="h-20 rounded-xl" style={{ backgroundColor: "#f0fdf4", border: "1px solid #dcfce7" }} />
            <div className="space-y-2">
              <div className="h-10 rounded-lg" style={{ backgroundColor: "#f8f7f4" }} />
              <div className="h-10 rounded-lg" style={{ backgroundColor: "#f8f7f4" }} />
              <div className="h-10 rounded-lg" style={{ backgroundColor: "#f8f7f4" }} />
            </div>
          </div>
        </div>
      </main>

      {/* Features */}
      <section className="px-6 pb-24 max-w-6xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#111] mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Everything you need
          </h2>
          <p className="text-[#777] max-w-xl mx-auto" style={{ fontFamily: "'Poppins', sans-serif" }}>
            From training to deployment, Hiro handles it all in one clean platform.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl p-6 border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg cursor-default"
              style={{ backgroundColor: "#fff", borderColor: "#eee" }}
            >
              <div className={`w-11 h-11 rounded-xl ${f.iconBg} flex items-center justify-center mb-4`}>
                <f.icon className={`w-5 h-5 ${f.iconColor}`} />
              </div>
              <h3 className="font-semibold text-[#111] mb-2 text-sm" style={{ fontFamily: "'Poppins', sans-serif" }}>
                {f.title}
              </h3>
              <p className="text-[#888] text-sm leading-relaxed" style={{ fontFamily: "'Poppins', sans-serif" }}>
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="px-6 pb-20 max-w-4xl mx-auto w-full">
        <div
          className="rounded-3xl p-10 text-center"
          style={{ background: "linear-gradient(135deg, #111 0%, #222 100%)" }}
        >
          <h2 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Ready to get started?
          </h2>
          <p className="text-[rgba(255,255,255,0.65)] mb-8" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Create your first bot in minutes. Free forever plan available.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 text-[#111] font-semibold px-8 py-3.5 rounded-xl transition-all hover:shadow-lg hover:scale-[1.02]"
            style={{ backgroundColor: "#fff" }}
          >
            Start for free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-6" style={{ borderColor: "#e5e5e5" }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#111" }}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-[#333]">Hiro</span>
          </div>
          <p className="text-sm text-[#999]">© 2025 Hiro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
