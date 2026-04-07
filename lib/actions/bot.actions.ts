"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { BotSchema } from "@/lib/validations/bot";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type BotActionState = {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
};

export async function createBot(
  _prev: BotActionState,
  formData: FormData
): Promise<BotActionState> {
  const session = await auth();
  if (!session?.user?.id) return { message: "Unauthorized" };

  const rawSuggestions = formData.get("suggestions") as string;
  const suggestions = rawSuggestions
    ? JSON.parse(rawSuggestions).filter(Boolean)
    : [];

  const rawLeadFields = formData.get("leadFields") as string;
  const leadFields = rawLeadFields ? JSON.parse(rawLeadFields) : [];

  const parsed = BotSchema.safeParse({
    name: formData.get("name"),
    primaryColor: formData.get("primaryColor") || "#6366f1",
    secondaryColor: formData.get("secondaryColor") || "#ffffff",
    greeting:
      formData.get("greeting") || "Hi there! How can I help you today?",
    avatarUrl: formData.get("avatarUrl") || "",
    systemPromptExtra: formData.get("systemPromptExtra") || "",
    isActive: formData.get("isActive") === "true",
    suggestions,
    leadEnabled: formData.get("leadEnabled") === "true",
    leadTrigger: formData.get("leadTrigger") || "after_first_reply",
    leadFields,
    bookingEnabled: formData.get("bookingEnabled") === "true",
    bookingUrl: formData.get("bookingUrl") || "",
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const {
    avatarUrl, systemPromptExtra,
    suggestions: parsedSuggestions,
    leadFields: parsedLeadFields,
    bookingUrl,
    ...rest
  } = parsed.data;

  const bot = await db.bot.create({
    data: {
      ...rest,
      avatarUrl: avatarUrl || null,
      systemPromptExtra: systemPromptExtra || null,
      suggestions: parsedSuggestions?.length ? JSON.stringify(parsedSuggestions) : null,
      leadFields: parsedLeadFields?.length ? JSON.stringify(parsedLeadFields) : null,
      bookingUrl: bookingUrl || null,
      userId: session.user.id,
    },
  });

  revalidatePath("/dashboard/bots");
  redirect(`/dashboard/bots/${bot.id}`);
}

export async function updateBot(
  botId: string,
  _prev: BotActionState,
  formData: FormData
): Promise<BotActionState> {
  const session = await auth();
  if (!session?.user?.id) return { message: "Unauthorized" };

  const bot = await db.bot.findFirst({
    where: { id: botId, userId: session.user.id },
  });
  if (!bot) return { message: "Bot not found" };

  const rawSuggestions = formData.get("suggestions") as string;
  const suggestions = rawSuggestions
    ? JSON.parse(rawSuggestions).filter(Boolean)
    : [];

  const rawLeadFields = formData.get("leadFields") as string;
  const leadFields = rawLeadFields ? JSON.parse(rawLeadFields) : [];

  const parsed = BotSchema.safeParse({
    name: formData.get("name"),
    primaryColor: formData.get("primaryColor") || "#6366f1",
    secondaryColor: formData.get("secondaryColor") || "#ffffff",
    greeting:
      formData.get("greeting") || "Hi there! How can I help you today?",
    avatarUrl: formData.get("avatarUrl") || "",
    systemPromptExtra: formData.get("systemPromptExtra") || "",
    isActive: formData.get("isActive") === "true",
    suggestions,
    leadEnabled: formData.get("leadEnabled") === "true",
    leadTrigger: formData.get("leadTrigger") || "after_first_reply",
    leadFields,
    bookingEnabled: formData.get("bookingEnabled") === "true",
    bookingUrl: formData.get("bookingUrl") || "",
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const {
    avatarUrl, systemPromptExtra,
    suggestions: parsedSuggestions,
    leadFields: parsedLeadFields,
    bookingUrl,
    ...rest
  } = parsed.data;

  await db.bot.update({
    where: { id: botId },
    data: {
      ...rest,
      avatarUrl: avatarUrl || null,
      systemPromptExtra: systemPromptExtra || null,
      suggestions: parsedSuggestions?.length ? JSON.stringify(parsedSuggestions) : null,
      leadFields: parsedLeadFields?.length ? JSON.stringify(parsedLeadFields) : null,
      bookingUrl: bookingUrl || null,
    },
  });

  revalidatePath("/dashboard/bots");
  revalidatePath(`/dashboard/bots/${botId}`);

  return { success: true, message: "Bot updated successfully" };
}

export async function deleteBot(botId: string): Promise<BotActionState> {
  const session = await auth();
  if (!session?.user?.id) return { message: "Unauthorized" };

  const bot = await db.bot.findFirst({
    where: { id: botId, userId: session.user.id },
  });
  if (!bot) return { message: "Bot not found" };

  await db.bot.delete({ where: { id: botId } });

  revalidatePath("/dashboard/bots");
  return { success: true };
}

export async function getBots() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return db.bot.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { conversations: true } },
    },
  });
}

export async function getBot(botId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  return db.bot.findFirst({
    where: { id: botId, userId: session.user.id },
  });
}
