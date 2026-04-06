"use client";

import { useState } from "react";

interface BarChartProps {
  data: { label: string; value: number; fullLabel?: string }[];
  color?: string;
  height?: number;
  unit?: string;
}

function formatValue(n: number, unit: string) {
  if (unit === "tokens") {
    if (n >= 1000) return (n / 1000).toFixed(1) + "k";
    return String(n);
  }
  return String(n);
}

export function BarChart({ data, color = "#22c55e", height = 120, unit = "tokens" }: BarChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="w-full select-none">
      <div className="relative" style={{ height }}>
        {/* Y-axis grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => (
          <div
            key={frac}
            className="absolute left-0 right-0 border-t"
            style={{ bottom: `${frac * 100}%`, borderColor: "#f0ede8" }}
          />
        ))}

        {/* Bars */}
        <div className="absolute inset-0 flex items-end gap-1">
          {data.map((d, i) => {
            const pct = max > 0 ? (d.value / max) * 100 : 0;
            const isHovered = hovered === i;
            return (
              <div
                key={i}
                className="flex-1 flex flex-col items-center justify-end h-full cursor-default relative"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Tooltip */}
                {isHovered && d.value > 0 && (
                  <div
                    className="absolute bottom-full mb-2 z-10 pointer-events-none"
                    style={{ left: "50%", transform: "translateX(-50%)" }}
                  >
                    <div
                      className="rounded-xl px-3 py-2 text-center shadow-lg whitespace-nowrap border"
                      style={{ backgroundColor: "#fff", borderColor: "#eeebe6" }}
                    >
                      <p className="text-[#111] text-xs font-bold">{formatValue(d.value, unit)} {unit}</p>
                      <p className="text-[#aaa] text-[10px] mt-0.5">{d.fullLabel ?? d.label}</p>
                    </div>
                    <div
                      className="w-2 h-2 rotate-45 mx-auto -mt-1 border-r border-b"
                      style={{ backgroundColor: "#fff", borderColor: "#eeebe6" }}
                    />
                  </div>
                )}

                {/* Bar */}
                <div
                  className="w-full rounded-t-md transition-all duration-150"
                  style={{
                    height: pct > 0 ? `${Math.max(pct, 3)}%` : "2px",
                    backgroundColor: pct > 0
                      ? isHovered
                        ? color
                        : `${color}88`
                      : "#f0ede8",
                    boxShadow: isHovered && pct > 0 ? `0 0 12px ${color}40` : "none",
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex gap-1 mt-1.5">
        {data.map((d, i) => (
          <div
            key={i}
            className="flex-1 text-center text-[9px] transition-colors"
            style={{ color: hovered === i ? "#555" : "#bbb" }}
          >
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}
