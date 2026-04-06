import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json([], { status: 401 });
  }

  const bots = await db.bot.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, primaryColor: true, isActive: true },
  });

  return Response.json(bots);
}
