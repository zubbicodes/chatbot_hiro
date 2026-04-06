"use client";

import { useState } from "react";
import { Globe, FileText, AlignLeft, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteKnowledge } from "@/lib/actions/knowledge.actions";

type SourceType = "URL" | "PDF" | "TEXT";

interface KnowledgeItemProps {
  id: string;
  sourceType: SourceType;
  sourceRef: string | null;
  tokenCount: number;
  createdAt: Date;
  content: string;
  botName?: string;
  botColor?: string;
  showBot?: boolean;
}

const SOURCE_META: Record<SourceType, { icon: React.ElementType; label: string; color: string; bg: string; textColor: string }> = {
  URL: { icon: Globe, label: "URL", color: "#0ea5e9", bg: "#f0f9ff", textColor: "#0369a1" },
  PDF: { icon: FileText, label: "PDF", color: "#ef4444", bg: "#fef2f2", textColor: "#dc2626" },
  TEXT: { icon: AlignLeft, label: "Text", color: "#22c55e", bg: "#f0fdf4", textColor: "#16a34a" },
};

function formatTokens(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function KnowledgeItem({
  id,
  sourceType,
  sourceRef,
  tokenCount,
  createdAt,
  content,
  botName,
  botColor,
  showBot = false,
}: KnowledgeItemProps) {
  const [deleting, setDeleting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const { icon: Icon, label, color, bg, textColor } = SOURCE_META[sourceType];

  const displayTitle =
    sourceType === "URL"
      ? (() => {
          try {
            return new URL(sourceRef!).hostname;
          } catch {
            return sourceRef ?? "URL source";
          }
        })()
      : sourceType === "PDF"
      ? sourceRef ?? "Document"
      : "Pasted text";

  const fullTitle =
    sourceType === "URL" ? sourceRef ?? displayTitle : displayTitle;

  async function handleDelete() {
    if (!confirm("Remove this knowledge source?")) return;
    setDeleting(true);
    await deleteKnowledge(id);
  }

  return (
    <div
      className="group rounded-xl border overflow-hidden transition-all duration-200 hover:shadow-sm"
      style={{ backgroundColor: "#fff", borderColor: "#eeebe6" }}
    >
      <div className="flex items-center gap-3 px-4 py-3.5">
        {/* Icon */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: bg }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-[#111] truncate max-w-xs" title={fullTitle}>
              {displayTitle}
            </span>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
              style={{ backgroundColor: bg, color: textColor }}
            >
              {label}
            </span>
            {showBot && botName && (
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-medium border"
                style={{
                  backgroundColor: `${botColor}12`,
                  color: botColor,
                  borderColor: `${botColor}25`,
                }}
              >
                {botName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-[#bbb]">
              {formatTokens(tokenCount)} tokens
            </span>
            <span className="text-[#ddd] text-xs">·</span>
            <span className="text-xs text-[#bbb]">
              {new Date(createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="flex items-center justify-center w-7 h-7 rounded-lg text-[#bbb] hover:text-[#555] hover:bg-[#f5f5f5] transition-colors cursor-pointer"
            title={expanded ? "Collapse" : "Preview content"}
          >
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
          <Button
            variant="ghost"
            size="icon"
            disabled={deleting}
            onClick={handleDelete}
            className="w-7 h-7 text-[#bbb] hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Content preview */}
      {expanded && (
        <div className="border-t px-4 py-3" style={{ borderColor: "#f0ede8" }}>
          <p
            className="text-xs text-[#888] leading-relaxed font-mono whitespace-pre-wrap line-clamp-10"
            style={{ backgroundColor: "#fafaf9", borderRadius: "8px", padding: "8px 12px" }}
          >
            {content.slice(0, 800)}{content.length > 800 ? "…" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
