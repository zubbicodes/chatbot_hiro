"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, ArrowRight } from "lucide-react";

type FormState = {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
};

const initialState: FormState = {};

async function loginAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { message: "Email and password are required" };
  }

  const result = await signIn("credentials", {
    email,
    password,
    redirect: false,
  });

  if (result?.error) {
    return { message: "Invalid email or password" };
  }

  return { success: true };
}

export default function LoginPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState
  );

  useEffect(() => {
    if (state.success) {
      router.push("/dashboard");
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#111] mb-2">Welcome back</h1>
        <p className="text-[#888] text-sm">Sign in to your Hiro dashboard</p>
      </div>

      <form action={formAction} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-semibold text-[#444]">
            Email address
          </Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#bbb]" />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              className="pl-10 h-11 rounded-xl border-[#e5e5e5] bg-white text-[#111] placeholder:text-[#ccc] focus-visible:ring-1 focus-visible:ring-green-500 focus-visible:border-green-400"
            />
          </div>
          {state.errors?.email && (
            <p className="text-red-500 text-xs">{state.errors.email[0]}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-semibold text-[#444]">
              Password
            </Label>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#bbb]" />
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              className="pl-10 h-11 rounded-xl border-[#e5e5e5] bg-white text-[#111] placeholder:text-[#ccc] focus-visible:ring-1 focus-visible:ring-green-500 focus-visible:border-green-400"
            />
          </div>
          {state.errors?.password && (
            <p className="text-red-500 text-xs">{state.errors.password[0]}</p>
          )}
        </div>

        {state.message && (
          <div
            className="rounded-xl px-4 py-3 text-sm"
            style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}
          >
            {state.message}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-md disabled:opacity-60 mt-2"
          style={{ backgroundColor: "#111" }}
        >
          {isPending ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Signing in…
            </>
          ) : (
            <>
              Sign in
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div
        className="flex items-center gap-3 my-6"
      >
        <div className="flex-1 h-px" style={{ backgroundColor: "#eee" }} />
        <span className="text-xs text-[#bbb] font-medium">or</span>
        <div className="flex-1 h-px" style={{ backgroundColor: "#eee" }} />
      </div>

      <p className="text-center text-sm text-[#888]">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-semibold text-[#111] hover:text-green-700 transition-colors"
        >
          Create one free
        </Link>
      </p>
    </div>
  );
}
