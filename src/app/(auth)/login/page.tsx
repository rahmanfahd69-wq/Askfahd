"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LoginForm() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const params = useSearchParams();
  const supabase  = createClient();

  useEffect(() => {
    if (params.get("error") === "auth_callback_failed") {
      setError("Authentication failed. Please try again.");
    }
  }, [params]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError("");

    // Safety net: unblock the button after 10s if something hangs
    const timeout = setTimeout(() => {
      setLoading(false);
      setError("Login is taking too long — please try again.");
    }, 10000);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      clearTimeout(timeout);

      if (authError) {
        setError(
          authError.message === "Invalid login credentials"
            ? "Incorrect email or password."
            : authError.message
        );
        setLoading(false);
        return;
      }

      // Full page navigation ensures auth cookies are committed before the
      // request hits middleware. router.push() can race with cookie writes.
      window.location.href = "/";
    } catch (err) {
      clearTimeout(timeout);
      console.error("[login] unexpected error:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

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

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
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
            disabled={loading || !email || !password}
          >
            {loading ? (
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
