"use client";

import { Suspense, useEffect, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { loginAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const params = useSearchParams();

  const callbackError =
    params.get("error") === "auth_callback_failed"
      ? "Authentication failed. Please try again."
      : null;

  const error = state?.error ?? callbackError ?? "";

  return (
    <div className="w-full max-w-[420px] animate-fade-up">
      {/* Logo */}
      <div className="text-center mb-10">
        <div
          className="inline-block font-['Syne'] font-black text-[28px] text-[#FF5722]"
          style={{ letterSpacing: "4px" }}
        >
          FARfit
        </div>
        <p className="text-[13px] text-[rgba(255,255,255,0.35)] tracking-wide mt-1">
          Coach Platform
        </p>
      </div>

      {/* Card */}
      <div className="bg-[rgba(255,255,255,0.028)] border border-[rgba(255,255,255,0.07)] rounded-[16px] p-8">
        <h1 className="font-['Syne'] font-black text-[22px] uppercase tracking-[2px] mb-1">
          Sign In
        </h1>
        <p className="text-[13px] text-[rgba(255,255,255,0.35)] mb-8">
          Your dashboard waits on the other side.
        </p>

        <form action={formAction} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              disabled={isPending}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              disabled={isPending}
              required
            />
          </div>

          {error && (
            <p className="text-[13px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-[6px] px-4 py-3">
              {error}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-1"
            disabled={isPending}
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Signing in…
              </span>
            ) : (
              "Sign In →"
            )}
          </Button>
        </form>
      </div>

      <p className="text-center text-[12px] text-[rgba(255,255,255,0.2)] mt-6">
        Access is by invitation only. Contact your coach to get started.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-5"
      style={{
        background: `radial-gradient(ellipse 80% 60% at 50% -10%, rgba(255,87,34,0.08) 0%, transparent 60%), #050505`,
      }}
    >
      <Suspense
        fallback={
          <div className="text-[rgba(255,255,255,0.3)] text-[13px]">Loading…</div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
