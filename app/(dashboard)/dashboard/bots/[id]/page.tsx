import { notFound } from "next/navigation";
import { BotForm } from "@/components/dashboard/bot-form";
import { getBot } from "@/lib/actions/bot.actions";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditBotPage({ params }: Props) {
  const { id } = await params;
  const bot = await getBot(id);

  if (!bot) notFound();

  return (
    <div className="max-w-6xl">
      <BotForm
        bot={{
          id: bot.id,
          name: bot.name,
          primaryColor: bot.primaryColor,
          secondaryColor: bot.secondaryColor,
          greeting: bot.greeting,
          avatarUrl: bot.avatarUrl,
          systemPromptExtra: bot.systemPromptExtra,
          isActive: bot.isActive,
          suggestions: bot.suggestions ? JSON.parse(bot.suggestions) : [],
          leadEnabled: bot.leadEnabled,
          leadTrigger: (bot.leadTrigger as "immediately" | "after_first_reply") ?? "after_first_reply",
          leadFields: bot.leadFields ? JSON.parse(bot.leadFields) : [],
          bookingEnabled: bot.bookingEnabled,
          bookingUrl: bot.bookingUrl,
        }}
      />
    </div>
  );
}
