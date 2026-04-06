"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, Users, BarChart2, MessageSquare, LogOut, ChevronRight, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { label: "Overview",      href: "/admin",               icon: LayoutDashboard },
  { label: "Users",         href: "/admin/users",         icon: Users },
  { label: "Conversations", href: "/admin/conversations", icon: MessageSquare },
  { label: "Analytics",     href: "/admin/analytics",     icon: BarChart2 },
];

interface AdminSidebarProps {
  user: { name?: string | null; email?: string | null; image?: string | null };
}

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();
  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "A";

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-slate-950 border-r border-white/5">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="w-8 h-8 rounded-lg bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/30 flex-shrink-0">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold tracking-tight">Hiro</span>
          <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/20 text-[10px] px-1.5 py-0">
            Admin
          </Badge>
        </div>
      </div>

      <Separator className="bg-white/5" />

      <ScrollArea className="flex-1 py-4">
        <nav className="px-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                  isActive ? "bg-rose-500/15 text-rose-300" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                )}
              >
                <item.icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-rose-400" : "text-slate-500 group-hover:text-slate-300")} />
                {item.label}
                {isActive && <ChevronRight className="w-3 h-3 ml-auto text-rose-400/60" />}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator className="bg-white/5" />

      <div className="p-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarImage src={user.image ?? undefined} />
            <AvatarFallback className="bg-rose-600 text-white text-xs font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user.name ?? "Admin"}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
          <Button variant="ghost" size="icon" className="w-7 h-7 text-slate-500 hover:text-red-400 hover:bg-red-400/10 flex-shrink-0"
            onClick={() => signOut({ callbackUrl: "/login" })} title="Sign out">
            <LogOut className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
