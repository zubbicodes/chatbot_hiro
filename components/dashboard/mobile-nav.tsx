"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Menu, LayoutDashboard, Bot, BookOpen, BarChart2, Code2, LogOut, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Bots", href: "/dashboard/bots", icon: Bot },
  { label: "Knowledge Base", href: "/dashboard/knowledge", icon: BookOpen },
  { label: "Conversations", href: "/dashboard/conversations", icon: MessageSquare },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart2 },
  { label: "Embed", href: "/dashboard/embed", icon: Code2 },
];

interface MobileNavProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function MobileNav({ user }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="text-[#888] hover:text-[#111] hover:bg-[#f5f5f5]">
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-60 border-[#eeebe6] p-0" style={{ backgroundColor: "#fff" }}>
        <div className="flex items-center gap-2.5 px-5 h-16 border-b" style={{ borderColor: "#eeebe6" }}>
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "#111" }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <span className="font-bold text-[#111] tracking-tight">Hiro</span>
        </div>
        <nav className="px-3 py-4 space-y-0.5">
          <p className="text-[10px] font-semibold text-[#aaa] uppercase tracking-widest px-3 mb-2">
            Navigation
          </p>
          {navItems.map((item) => {
            const isActive = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  isActive ? "font-semibold" : "text-[#888] hover:text-[#333] hover:bg-[#f8f7f4]"
                )}
                style={isActive ? { backgroundColor: "#f0fdf4", color: "#166534" } : {}}
              >
                <item.icon className={cn("w-4 h-4", isActive ? "text-green-600" : "text-[#bbb]")} />
                {item.label}
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-green-500" />}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 absolute bottom-0 w-full border-t" style={{ borderColor: "#eeebe6" }}>
          <div
            className="flex items-center gap-3 px-2 py-2.5 rounded-xl"
            style={{ backgroundColor: "#f8f7f4" }}
          >
            <Avatar className="w-8 h-8">
              <AvatarImage src={user.image ?? undefined} />
              <AvatarFallback className="text-xs font-semibold text-white" style={{ backgroundColor: "#222" }}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#111] truncate">{user.name ?? "User"}</p>
              <p className="text-xs text-[#aaa] truncate">{user.email}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7 text-[#ccc] hover:text-red-500 hover:bg-red-50"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
