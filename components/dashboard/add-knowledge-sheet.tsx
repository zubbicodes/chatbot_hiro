"use client";

import { useActionState, useState, useRef, useEffect } from "react";
import { Plus, Globe, FileText, AlignLeft, Loader2, Check, X, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  addKnowledgeText,
  addKnowledgeUrl,
  addKnowledgePdf,
  type KnowledgeActionState,
} from "@/lib/actions/knowledge.actions";

interface Bot {
  id: string;
  name: string;
  primaryColor: string;
}

type SourceTab = "text" | "url" | "pdf";

const TABS: { id: SourceTab; label: string; icon: React.ElementType }[] = [
  { id: "text", label: "Text", icon: AlignLeft },
  { id: "url", label: "URL", icon: Globe },
  { id: "pdf", label: "PDF", icon: FileText },
];

interface AddKnowledgeSheetProps {
  bots: Bot[];
  defaultBotId?: string;
}

export function AddKnowledgeSheet({ bots, defaultBotId }: AddKnowledgeSheetProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<SourceTab>("text");
  const [selectedBotId, setSelectedBotId] = useState(defaultBotId ?? bots[0]?.id ?? "");
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [textState, textAction, textPending] = useActionState<KnowledgeActionState, FormData>(
    addKnowledgeText, {}
  );
  const [urlState, urlAction, urlPending] = useActionState<KnowledgeActionState, FormData>(
    addKnowledgeUrl, {}
  );
  const [pdfState, pdfAction, pdfPending] = useActionState<KnowledgeActionState, FormData>(
    addKnowledgePdf, {}
  );

  const currentState = tab === "text" ? textState : tab === "url" ? urlState : pdfState;

  // Close sheet on success
  useEffect(() => {
    if (currentState.success) {
      const t = setTimeout(() => setOpen(false), 1200);
      return () => clearTimeout(t);
    }
  }, [currentState.success]);

  function handleTabChange(newTab: SourceTab) {
    setTab(newTab);
    setFileName(null);
  }

  if (bots.length === 0) {
    return (
      <button
        disabled
        className="flex items-center gap-2 text-sm font-semibold text-[#999] px-5 py-2.5 rounded-xl border cursor-not-allowed"
        style={{ borderColor: "#e0e0e0", backgroundColor: "#f5f5f5" }}
      >
        <Plus className="w-4 h-4" />
        Add source
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm font-semibold text-white px-5 py-2.5 rounded-xl transition-all hover:opacity-90 hover:shadow-md cursor-pointer"
        style={{ backgroundColor: "#111" }}
      >
        <Plus className="w-4 h-4" />
        Add source
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-lg flex flex-col gap-0 p-0 border-l"
          style={{ backgroundColor: "#fff", borderColor: "#eeebe6" }}
        >
          <SheetHeader className="px-6 pt-6 pb-4 border-b" style={{ borderColor: "#eeebe6" }}>
            <SheetTitle className="text-[#111] text-lg font-bold">
              Add knowledge source
            </SheetTitle>
            <SheetDescription className="text-[#999] text-sm">
              Train your bot with text, a webpage, or a PDF document.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Bot selector */}
            {bots.length > 1 && (
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-[#555]">Select Bot</Label>
                <select
                  value={selectedBotId}
                  onChange={(e) => setSelectedBotId(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm text-[#111] focus:outline-none focus:ring-2 focus:ring-green-500/30 cursor-pointer"
                  style={{ borderColor: "#e5e5e5", backgroundColor: "#fff" }}
                >
                  {bots.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {bots.length === 1 && (
              <div
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border"
                style={{ borderColor: "#eeebe6", backgroundColor: "#fafaf9" }}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: bots[0].primaryColor }}
                />
                <span className="text-sm font-medium text-[#333]">{bots[0].name}</span>
              </div>
            )}

            {/* Source type tabs */}
            <div className="flex gap-2">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleTabChange(id)}
                  className={`flex-1 flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    tab === id
                      ? "border-green-300 text-green-700"
                      : "text-[#aaa] hover:text-[#555] hover:border-[#ddd]"
                  }`}
                  style={
                    tab === id
                      ? { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" }
                      : { borderColor: "#eee", backgroundColor: "#fafaf9" }
                  }
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* Status messages */}
            {currentState.message && !currentState.success && (
              <div
                className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
                style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}
              >
                <X className="w-4 h-4 flex-shrink-0" />
                {currentState.message}
              </div>
            )}
            {currentState.success && (
              <div
                className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
                style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a" }}
              >
                <Check className="w-4 h-4 flex-shrink-0" />
                {currentState.message}
              </div>
            )}

            {/* TEXT tab */}
            {tab === "text" && (
              <form action={textAction} className="space-y-4">
                <input type="hidden" name="botId" value={selectedBotId} />
                <div className="space-y-1.5">
                  <Label htmlFor="content" className="text-sm font-semibold text-[#555]">
                    Content <span className="text-red-400">*</span>
                  </Label>
                  <Textarea
                    id="content"
                    name="content"
                    placeholder="Paste your text, FAQ, product documentation, support articles…"
                    rows={10}
                    className="text-[#111] placeholder:text-[#ccc] text-sm rounded-xl border-[#e5e5e5] focus-visible:ring-1 focus-visible:ring-green-500 focus-visible:border-green-400"
                  />
                  {textState.errors?.content && (
                    <p className="text-xs text-red-500">{textState.errors.content[0]}</p>
                  )}
                </div>
                <SubmitButton pending={textPending} success={!!textState.success} />
              </form>
            )}

            {/* URL tab */}
            {tab === "url" && (
              <form action={urlAction} className="space-y-4">
                <input type="hidden" name="botId" value={selectedBotId} />
                <div className="space-y-1.5">
                  <Label htmlFor="url" className="text-sm font-semibold text-[#555]">
                    Webpage URL <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="url"
                    name="url"
                    type="url"
                    placeholder="https://yourwebsite.com/about"
                    className="h-11 rounded-xl border-[#e5e5e5] text-[#111] placeholder:text-[#ccc] focus-visible:ring-1 focus-visible:ring-green-500 focus-visible:border-green-400"
                  />
                  {urlState.errors?.url && (
                    <p className="text-xs text-red-500">{urlState.errors.url[0]}</p>
                  )}
                  <p className="text-xs text-[#aaa]">
                    We&apos;ll fetch and extract the visible text content from this page.
                  </p>
                </div>
                <SubmitButton pending={urlPending} success={!!urlState.success} label="Scrape & add" />
              </form>
            )}

            {/* PDF tab */}
            {tab === "pdf" && (
              <form action={pdfAction} className="space-y-4">
                <input type="hidden" name="botId" value={selectedBotId} />
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-[#555]">
                    PDF file <span className="text-red-400">*</span>
                  </Label>
                  <input
                    ref={fileInputRef}
                    id="file"
                    name="file"
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full flex flex-col items-center gap-3 rounded-xl border-2 border-dashed px-4 py-8 transition-all cursor-pointer ${
                      fileName ? "border-green-300" : "border-[#e0e0e0] hover:border-[#ccc]"
                    }`}
                    style={fileName ? { backgroundColor: "#f0fdf4" } : { backgroundColor: "#fafaf9" }}
                  >
                    {fileName ? (
                      <>
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: "#fee2e2" }}
                        >
                          <FileText className="w-5 h-5 text-red-500" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold text-[#111] truncate max-w-[250px]">
                            {fileName}
                          </p>
                          <p className="text-xs text-[#aaa] mt-0.5">Click to change</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: "#f5f5f5" }}
                        >
                          <Upload className="w-5 h-5 text-[#bbb]" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold text-[#555]">
                            Click to upload PDF
                          </p>
                          <p className="text-xs text-[#aaa] mt-0.5">Max 10 MB</p>
                        </div>
                      </>
                    )}
                  </button>
                  {pdfState.errors?.file && (
                    <p className="text-xs text-red-500">{pdfState.errors.file[0]}</p>
                  )}
                </div>
                <SubmitButton pending={pdfPending} success={!!pdfState.success} label="Parse & add" />
              </form>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function SubmitButton({
  pending,
  success,
  label = "Add to knowledge base",
}: {
  pending: boolean;
  success: boolean;
  label?: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending || success}
      className="w-full flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
      style={{ backgroundColor: "#111" }}
    >
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Processing…
        </>
      ) : success ? (
        <>
          <Check className="w-4 h-4" />
          Added!
        </>
      ) : (
        label
      )}
    </button>
  );
}
