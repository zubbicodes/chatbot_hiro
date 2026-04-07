import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { LeadsTable } from "@/components/dashboard/leads-table";
import { Users } from "lucide-react";

export const metadata = { title: "Leads — Hiro" };

export default async function LeadsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [rawLeads, bots] = await Promise.all([
    db.lead.findMany({
      where: { bot: { userId: session.user.id } },
      orderBy: { createdAt: "desc" },
      take: 500,
      include: { bot: { select: { id: true, name: true, primaryColor: true } } },
    }),
    db.bot.findMany({
      where: { userId: session.user.id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const leads = rawLeads.map((l) => ({
    ...l,
    fieldsData: JSON.parse(l.fieldsData) as Record<string, string>,
  }));

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center gap-3 mb-8">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: "#eff6ff" }}
        >
          <Users className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#111]">Leads</h1>
          <p className="text-sm text-[#aaa] mt-0.5">
            Contacts collected through your chat widgets.
          </p>
        </div>
        <div className="ml-auto">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: "#eff6ff", color: "#2563eb" }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: "#2563eb" }}
            />
            {leads.length} total
          </span>
        </div>
      </div>

      <LeadsTable leads={leads} bots={bots} />
    </div>
  );
}
