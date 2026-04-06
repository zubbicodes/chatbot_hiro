import type { NextAuthConfig } from "next-auth";

// Edge-safe config — no Node.js APIs (no Prisma, no bcrypt).
// Used by middleware.ts to protect routes without a DB call on every request.
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdminRoute = nextUrl.pathname.startsWith("/admin");
      const isDashboardRoute = nextUrl.pathname.startsWith("/dashboard");
      const isAuthRoute =
        nextUrl.pathname === "/login" || nextUrl.pathname === "/register";

      // Redirect logged-in users away from auth pages
      if (isLoggedIn && isAuthRoute) {
        const redirectTo =
          auth.user.role === "ADMIN" ? "/admin" : "/dashboard";
        return Response.redirect(new URL(redirectTo, nextUrl));
      }

      // Protect /admin — must be logged in + ADMIN role
      if (isAdminRoute) {
        if (!isLoggedIn) return false;
        if (auth.user.role !== "ADMIN") {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }

      // Protect /dashboard — must be logged in
      if (isDashboardRoute) {
        return isLoggedIn;
      }

      return true;
    },
  },
};
