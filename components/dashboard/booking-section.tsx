"use client";

import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";

interface BookingSectionProps {
  bookingEnabled: boolean;
  bookingUrl: string;
  onEnabledChange: (v: boolean) => void;
  onUrlChange: (v: string) => void;
}

export function BookingSection({
  bookingEnabled,
  bookingUrl,
  onEnabledChange,
  onUrlChange,
}: BookingSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-bold text-[#111] flex items-center gap-2">
          <span
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "#fef3c7" }}
          >
            <Calendar className="w-3.5 h-3.5 text-amber-500" />
          </span>
          Meeting Booking
        </h2>
        <p className="text-xs text-[#aaa] mt-1 ml-8">
          Let users book meetings directly in the chat via Cal.com.
        </p>
      </div>

      <div
        className="flex items-center justify-between p-3.5 rounded-xl"
        style={{ backgroundColor: "#f8f7f4" }}
      >
        <div>
          <p className="text-sm font-semibold text-[#333]">Enable booking</p>
          <p className="text-xs text-[#aaa] mt-0.5">
            Bot will offer a calendar when users ask to schedule
          </p>
        </div>
        <Switch checked={bookingEnabled} onCheckedChange={onEnabledChange} />
      </div>

      {bookingEnabled && (
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold text-[#555]">
            Cal.com booking link <span className="text-red-400">*</span>
          </Label>
          <Input
            value={bookingUrl}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder="https://cal.com/yourname/30min"
            className="h-11 rounded-xl border-[#e5e5e5] text-[#111] placeholder:text-[#ccc] focus-visible:ring-1 focus-visible:ring-green-500"
          />
          <p className="text-xs text-[#bbb]">
            Create a free account at{" "}
            <a
              href="https://cal.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-500 hover:underline"
            >
              cal.com
            </a>{" "}
            and connect your Google or Apple Calendar there.
          </p>
        </div>
      )}
    </div>
  );
}
