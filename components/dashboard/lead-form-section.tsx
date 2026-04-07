"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Plus, X, GripVertical } from "lucide-react";
import type { LeadField } from "@/lib/validations/lead";

interface LeadFormSectionProps {
  leadEnabled: boolean;
  leadTrigger: "immediately" | "after_first_reply";
  leadFields: LeadField[];
  onEnabledChange: (v: boolean) => void;
  onTriggerChange: (v: "immediately" | "after_first_reply") => void;
  onFieldsChange: (fields: LeadField[]) => void;
}

const FIELD_PRESETS: LeadField[] = [
  { key: "name", label: "Full Name", type: "text", required: true },
  { key: "email", label: "Email Address", type: "email", required: true },
  { key: "phone", label: "Phone Number", type: "tel", required: false },
  { key: "company", label: "Company", type: "text", required: false },
];

export function LeadFormSection({
  leadEnabled,
  leadTrigger,
  leadFields,
  onEnabledChange,
  onTriggerChange,
  onFieldsChange,
}: LeadFormSectionProps) {
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState<"text" | "email" | "tel">("text");
  const [newRequired, setNewRequired] = useState(false);

  function addPreset(preset: LeadField) {
    if (leadFields.some((f) => f.key === preset.key)) return;
    if (leadFields.length >= 8) return;
    onFieldsChange([...leadFields, preset]);
  }

  function addCustomField() {
    const label = newLabel.trim();
    if (!label || leadFields.length >= 8) return;
    const key = label.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    if (leadFields.some((f) => f.key === key)) return;
    onFieldsChange([...leadFields, { key, label, type: newType, required: newRequired }]);
    setNewLabel("");
    setNewType("text");
    setNewRequired(false);
  }

  function removeField(key: string) {
    onFieldsChange(leadFields.filter((f) => f.key !== key));
  }

  function toggleRequired(key: string) {
    onFieldsChange(leadFields.map((f) => f.key === key ? { ...f, required: !f.required } : f));
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-bold text-[#111] flex items-center gap-2">
          <span
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "#eff6ff" }}
          >
            <Users className="w-3.5 h-3.5 text-blue-500" />
          </span>
          Lead Collection
        </h2>
        <p className="text-xs text-[#aaa] mt-1 ml-8">
          Collect visitor info (name, email, phone) inside the chat.
        </p>
      </div>

      <div
        className="flex items-center justify-between p-3.5 rounded-xl"
        style={{ backgroundColor: "#f8f7f4" }}
      >
        <div>
          <p className="text-sm font-semibold text-[#333]">Enable lead collection</p>
          <p className="text-xs text-[#aaa] mt-0.5">Show a contact form in the chat</p>
        </div>
        <Switch checked={leadEnabled} onCheckedChange={onEnabledChange} />
      </div>

      {leadEnabled && (
        <>
          {/* Trigger */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-[#555]">When to show the form</Label>
            <div className="grid grid-cols-2 gap-2">
              {(["immediately", "after_first_reply"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onTriggerChange(t)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-medium border text-left transition-all cursor-pointer ${
                    leadTrigger === t ? "border-blue-400 text-blue-700" : "border-[#e5e5e5] text-[#666] hover:border-[#ccc]"
                  }`}
                  style={leadTrigger === t ? { backgroundColor: "#eff6ff" } : { backgroundColor: "#fff" }}
                >
                  <p className="font-semibold">
                    {t === "immediately" ? "Immediately" : "After first reply"}
                  </p>
                  <p className="text-[10px] mt-0.5 opacity-70">
                    {t === "immediately"
                      ? "Form appears right when chat opens"
                      : "Form appears after bot's first response"}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Quick-add presets */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-[#555]">Quick add fields</Label>
            <div className="flex flex-wrap gap-2">
              {FIELD_PRESETS.map((p) => {
                const added = leadFields.some((f) => f.key === p.key);
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => addPreset(p)}
                    disabled={added || leadFields.length >= 8}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      added
                        ? "border-green-300 text-green-700"
                        : "border-[#e5e5e5] text-[#555] hover:border-blue-300 hover:text-blue-600"
                    }`}
                    style={added ? { backgroundColor: "#f0fdf4" } : { backgroundColor: "#fff" }}
                  >
                    {added ? "✓ " : "+ "}{p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Configured fields */}
          {leadFields.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-[#555]">Configured fields</Label>
              <div className="space-y-1.5">
                {leadFields.map((f) => (
                  <div
                    key={f.key}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border"
                    style={{ borderColor: "#e5e5e5", backgroundColor: "#fafaf9" }}
                  >
                    <GripVertical className="w-3.5 h-3.5 text-[#ccc] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#333] truncate">{f.label}</p>
                      <p className="text-[10px] text-[#aaa]">{f.type} · key: {f.key}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleRequired(f.key)}
                      className={`text-[10px] px-2 py-0.5 rounded-full border cursor-pointer transition-colors ${
                        f.required
                          ? "border-red-200 text-red-600"
                          : "border-[#e5e5e5] text-[#aaa] hover:border-[#ccc]"
                      }`}
                      style={f.required ? { backgroundColor: "#fef2f2" } : { backgroundColor: "#fff" }}
                    >
                      {f.required ? "required" : "optional"}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeField(f.key)}
                      className="text-[#ccc] hover:text-red-500 transition-colors cursor-pointer flex-shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom field add */}
          {leadFields.length < 8 && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-[#555]">Add custom field</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomField(); } }}
                  placeholder='e.g. "Job Title"'
                  className="flex-1 h-9 rounded-xl border-[#e5e5e5] text-[#111] placeholder:text-[#ccc] text-sm focus-visible:ring-1 focus-visible:ring-blue-400"
                />
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as "text" | "email" | "tel")}
                  className="h-9 rounded-xl border text-xs text-[#555] px-2 outline-none focus:ring-1 focus:ring-blue-400"
                  style={{ borderColor: "#e5e5e5", backgroundColor: "#fff" }}
                >
                  <option value="text">Text</option>
                  <option value="email">Email</option>
                  <option value="tel">Phone</option>
                </select>
                <button
                  type="button"
                  onClick={addCustomField}
                  disabled={!newLabel.trim()}
                  className="w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#f5f5f5]"
                  style={{ borderColor: "#e5e5e5" }}
                >
                  <Plus className="w-4 h-4 text-[#555]" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
