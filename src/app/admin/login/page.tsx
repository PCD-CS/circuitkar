"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Cpu } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/admin/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(
        authError.message.includes("Invalid login credentials")
          ? "Incorrect email or password."
          : authError.message,
      );
      setLoading(false);
      return;
    }

    router.push(redirect);
    router.refresh();
  }

  async function handleForgotPassword() {
    if (!email) {
      setError("Enter your email above first, then click Forgot password.");
      return;
    }
    setResetLoading(true);
    setError("");
    const supabase = createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/reset-password?next=/admin/login`,
    });
    // Always show success — don't reveal if email exists
    setResetSent(true);
    setResetLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#F97316] flex items-center justify-center mb-4">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-mono font-bold text-xl text-[#F5F5F5]">
            CIRCUIT<span className="text-[#F97316]">KAR</span>
          </h1>
          <p className="text-sm text-[#525252] mt-1">Admin Panel</p>
        </div>

        <div className="bg-[#161616] border border-[#262626] rounded-lg p-6">
          <h2 className="text-sm font-semibold text-[#F5F5F5] mb-6">Sign in to continue</h2>

          {error && (
            <div className="bg-[#EF444415] border border-[#EF4444]/30 rounded-lg px-4 py-3 text-sm text-[#EF4444] mb-4">
              {error}
            </div>
          )}

          {resetSent && (
            <div className="bg-[#22C55E15] border border-[#22C55E]/30 rounded-lg px-4 py-3 text-sm text-[#22C55E] mb-4">
              Password reset email sent — check your inbox.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="admin@example.com"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={resetLoading}
                className="text-xs text-[#525252] hover:text-[#F97316] transition-colors"
              >
                {resetLoading ? "Sending…" : "Forgot password?"}
              </button>
            </div>
            <Button type="submit" loading={loading} className="w-full">
              Sign In
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-[#525252] mt-6">
          Circuitkar Admin · Restricted Access
        </p>
      </div>
    </div>
  );
}
