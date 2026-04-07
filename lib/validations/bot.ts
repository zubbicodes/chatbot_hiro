import { z } from "zod";
import { LeadFieldSchema } from "./lead";

export const BotSchema = z.object({
  name: z
    .string()
    .min(1, "Bot name is required")
    .max(50, "Name must be 50 characters or less"),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color")
    .default("#6366f1"),
  secondaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color")
    .default("#ffffff"),
  greeting: z
    .string()
    .min(1, "Greeting message is required")
    .max(300, "Greeting must be 300 characters or less"),
  avatarUrl: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
  systemPromptExtra: z
    .string()
    .max(2000, "System prompt must be 2000 characters or less")
    .optional()
    .or(z.literal("")),
  isActive: z.boolean().default(true),
  suggestions: z
    .array(z.string().max(100, "Each suggestion must be 100 chars or less"))
    .max(6, "Maximum 6 suggestions")
    .optional()
    .default([]),
  leadEnabled: z.boolean().default(false),
  leadTrigger: z.enum(["immediately", "after_first_reply"]).default("after_first_reply"),
  leadFields: z.array(LeadFieldSchema).max(8).optional().default([]),
  bookingEnabled: z.boolean().default(false),
  bookingUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export type BotInput = z.infer<typeof BotSchema>;
