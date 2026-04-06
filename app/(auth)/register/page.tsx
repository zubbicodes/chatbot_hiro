"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerUser } from "@/lib/actions/auth.actions";
import type { ActionState } from "@/lib/actions/auth.actions";
import { User, Mail, Lock, ArrowRight } from "lucide-react";

const initialState: ActionState = {};

export default function RegisterPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    registerUser,
    initialState
  );

  useEffect(() => {
    if (state.success) {
      router.push("/login?registered=true");
    }
  }, [state.success, router]);

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#111] mb-2">Create an account</h1>
        <p className="text-[#888] text-sm">Start building your AI support chatbot</p>
      </div>

      <form action={formAction} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-sm font-semibold text-[#444]">
            Full name
          </Label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#bbb]" />
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Jane Smith"
              autoComplete="name"
              required
              className="pl-10 h-11 rounded-xl border-[#e5e5e5] bg-white text-[#111] placeholder:text-[#ccc] focus-visible:ring-1 focus-visible:ring-green-500 focus-visible:border-green-400"
            />
          </div>
          {state.errors?.name && (
            <p className="text-red-500 text-xs">{state.errors.name[0]}</p>
          )}
        </div>

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
          <Label htmlFor="password" className="text-sm font-semibold text-[#444]">
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#bbb]" />
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Min. 8 characters"
              autoComplete="new-password"
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
              Creating account…
            </>
          ) : (
            <>
              Create account
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <p className="text-xs text-[#aaa] text-center">
          By creating an account you agree to our{" "}
          <span className="text-[#777] underline underline-offset-2 cursor-pointer hover:text-[#333]">
            Terms of Service
          </span>
          .
        </p>
      </form>

      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px" style={{ backgroundColor: "#eee" }} />
        <span className="text-xs text-[#bbb] font-medium">or</span>
        <div className="flex-1 h-px" style={{ backgroundColor: "#eee" }} />
      </div>

      <p className="text-center text-sm text-[#888]">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-[#111] hover:text-green-700 transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
