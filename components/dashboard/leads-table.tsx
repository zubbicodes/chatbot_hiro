"use client";

import { useState, useMemo } from "react";
import { Download, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Lead {
  id: string;
  botId: string;
  conversationId: string | null;
  fieldsData: Record<string, string>;
  createdAt: Date;
  bot: { id: string; name: string; primaryColor: string };
}

interface Bot { id: string; name: string }

interface LeadsTableProps {
  leads: Lead[];
  bots: Bot[];
}

export function LeadsTable({ leads, bots }: LeadsTableProps) {
  const [botFilter, setBotFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (botFilter !== "all" && l.botId !== botFilter) return false;
      if (search) {
        const hay = JSON.stringify(l.fieldsData).toLowerCase();
        if (!hay.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [leads, botFilter, search]);

  // Collect all unique field keys across all leads for column headers
  const fieldKeys = useMemo(() => {
    const keys = new Set<string>();
    leads.forEach((l) => Object.keys(l.fieldsData).forEach((k) => keys.add(k)));
    return Array.from(keys);
  }, [leads]);

  function exportCSV() {
    const headers = ["Bot", ...fieldKeys, "Date", "Conversation ID"];
    const rows = filtered.map((l) => [
      l.bot.name,
      ...fieldKeys.map((k) => l.fieldsData[k] ?? ""),
      new Date(l.createdAt).toLocaleString(),
      l.conversationId ?? "",
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leads.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ccc]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads…"
            className="pl-9 h-10 rounded-xl border-[#e5e5e5] text-[#111] placeholder:text-[#ccc] focus-visible:ring-1 focus-visible:ring-green-500 text-sm"
          />
        </div>
        <select
          value={botFilter}
          onChange={(e) => setBotFilter(e.target.value)}
          className="h-10 rounded-xl border px-3 text-sm text-[#555] outline-none focus:ring-1 focus:ring-green-500"
          style={{ borderColor: "#e5e5e5", backgroundColor: "#fff" }}
        >
          <option value="all">All bots</option>
          {bots.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 h-10 rounded-xl border text-sm font-medium text-[#555] hover:bg-[#f5f5f5] transition-colors cursor-pointer"
          style={{ borderColor: "#e5e5e5" }}
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ borderColor: "#eeebe6" }}
      >
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
              style={{ backgroundColor: "#f8f7f4" }}
            >
              <Search className="w-5 h-5 text-[#ccc]" />
            </div>
            <p className="text-sm font-semibold text-[#555]">No leads yet</p>
            <p className="text-xs text-[#aaa] mt-1">
              {leads.length === 0
                ? "Enable lead collection on a bot to start capturing contacts."
                : "No results match your filters."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "#fafaf9", borderBottom: "1px solid #eeebe6" }}>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#888] whitespace-nowrap">Bot</th>
                  {fieldKeys.map((k) => (
                    <th key={k} className="text-left px-4 py-3 text-xs font-semibold text-[#888] whitespace-nowrap capitalize">
                      {k.replace(/_/g, " ")}
                    </th>
                  ))}
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#888] whitespace-nowrap">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr
                    key={l.id}
                    className="border-t hover:bg-[#fafaf9] transition-colors"
                    style={{ borderColor: "#f5f5f5" }}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: l.bot.primaryColor }}
                        />
                        <span className="text-sm font-medium text-[#333]">{l.bot.name}</span>
                      </div>
                    </td>
                    {fieldKeys.map((k) => (
                      <td key={k} className="px-4 py-3 text-[#555] whitespace-nowrap">
                        {l.fieldsData[k] ?? <span className="text-[#ccc]">—</span>}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-[#aaa] whitespace-nowrap text-xs">
                      {new Date(l.createdAt).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-[#bbb]">{filtered.length} of {leads.length} leads</p>
    </div>
  );
}
