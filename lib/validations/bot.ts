import { z } from "zod";

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
});

export type BotInput = z.infer<typeof BotSchema>;
