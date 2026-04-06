import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Next.js 16+ uses proxy.ts (renamed from middleware.ts).
const { auth } = NextAuth(authConfig);

export const proxy = auth;

export const config = {
  matcher: [
    // Skip static files, Next.js internals, and the widget API
    "/((?!_next/static|_next/image|favicon.ico|api/widget).*)",
  ],
};
