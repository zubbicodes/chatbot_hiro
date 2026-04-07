import { z } from "zod";

export const LeadFieldSchema = z.object({
  key: z.string().min(1).max(50),
  label: z.string().min(1).max(100),
  type: z.enum(["text", "email", "tel"]),
  required: z.boolean(),
});

export const LeadFieldsSchema = z.array(LeadFieldSchema).max(8);

export type LeadField = z.infer<typeof LeadFieldSchema>;

export const LeadSubmissionSchema = z.object({
  botId: z.string().min(1),
  conversationId: z.string().min(1).optional(),
  fieldsData: z.record(z.string(), z.string()),
});
