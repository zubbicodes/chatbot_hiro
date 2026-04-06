export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: "#f8f7f4", fontFamily: "'Poppins', sans-serif" }}
    >
      {/* Left decorative panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden"
        style={{ backgroundColor: "#111" }}
      >
        {/* Background subtle pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, #22c55e 0%, transparent 50%), 
                              radial-gradient(circle at 80% 20%, #4ade80 0%, transparent 40%)`,
          }}
        />
        
        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">Hiro</span>
        </div>

        {/* Quote / Features */}
        <div className="relative space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-white leading-tight mb-4">
              Build your AI support agent in minutes
            </h2>
            <p className="text-[rgba(255,255,255,0.55)] leading-relaxed">
              Train on your content, embed anywhere, and handle customer questions on autopilot.
            </p>
          </div>
          <div className="space-y-3">
            {[
              "Train on PDFs, URLs, or plain text",
              "One-line embed on any website",
              "Full brand customization",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "#22c55e" }}
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm text-[rgba(255,255,255,0.75)]">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom note */}
        <div className="relative">
          <p className="text-xs text-[rgba(255,255,255,0.35)]">© 2025 Hiro. All rights reserved.</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "#111" }}
              >
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <span className="font-bold text-[#111] text-xl">Hiro</span>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
