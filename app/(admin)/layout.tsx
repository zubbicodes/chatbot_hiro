import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminSidebar } from "@/components/admin/sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="flex min-h-screen bg-slate-900">
      <div className="hidden lg:flex">
        <AdminSidebar user={session.user} />
      </div>
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
