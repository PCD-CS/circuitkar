"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Tabs";
import { OTPInput } from "@/components/ui/OTPInput";

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/account";

  const [tab, setTab] = useState("password");

  // Password flow
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // OTP flow
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function mergeCart() {
    try {
      const sessionId = localStorage.getItem("ck_cart_session");
      if (sessionId) {
        await fetch("/api/auth/merge-cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
      }
    } catch {
      // non-fatal
    }
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }
    await mergeCart();
    router.push(returnTo);
    router.refresh();
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    if (otpError) {
      setError(otpError.message);
      setLoading(false);
      return;
    }
    setOtpSent(true);
    setLoading(false);
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });
    if (verifyError) {
      setError(verifyError.message);
      setLoading(false);
      return;
    }
    await mergeCart();
    router.push(returnTo);
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="mb-1 text-center text-2xl font-bold text-[#F5F5F5]">
        Welcome back
      </h1>
      <p className="mb-6 text-center text-sm text-[#A3A3A3]">
        Sign in to your Circuitkar account
      </p>

      <div className="rounded-lg border border-[#262626] bg-[#161616] p-6">
        <Tabs
          tabs={[
            { id: "password", label: "Password" },
            { id: "otp", label: "Email OTP" },
          ]}
          activeTab={tab}
          onChange={(id) => {
            setTab(id);
            setError("");
            setOtpSent(false);
          }}
          className="mb-6"
        />

        {error && (
          <div className="mb-4 rounded-lg border border-[#EF4444]/30 bg-[#EF444415] px-4 py-3 text-sm text-[#EF4444]">
            {error}
          </div>
        )}

        {tab === "password" ? (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
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
            <div className="text-right">
              <Link
                href="/auth/forgot-password"
                className="text-xs text-[#F97316] hover:text-[#EA6C0A]"
              >
                Forgot password?
              </Link>
            </div>
            <Button type="submit" loading={loading} className="w-full">
              Sign In
            </Button>
          </form>
        ) : !otpSent ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
              hint="We'll email you a 6-digit code"
            />
            <Button type="submit" loading={loading} className="w-full">
              Send Code
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <p className="text-sm text-[#A3A3A3]">
              Enter the 6-digit code sent to{" "}
              <span className="text-[#F5F5F5]">{email}</span>
            </p>
            <div className="flex justify-center">
              <OTPInput value={otp} onChange={setOtp} />
            </div>
            <Button
              type="submit"
              loading={loading}
              disabled={otp.length < 6}
              className="w-full"
            >
              Verify &amp; Sign In
            </Button>
            <button
              type="button"
              onClick={() => {
                setOtpSent(false);
                setOtp("");
              }}
              className="w-full text-center text-xs text-[#A3A3A3] hover:text-[#F5F5F5]"
            >
              Use a different email
            </button>
          </form>
        )}
      </div>

      <p className="mt-6 text-center text-sm text-[#A3A3A3]">
        Don&apos;t have an account?{" "}
        <Link
          href={`/auth/signup${returnTo !== "/account" ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`}
          className="text-[#F97316] hover:text-[#EA6C0A]"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto min-h-[70vh] max-w-md px-4 py-12" />
      }
    >
      <LoginInner />
    </Suspense>
  );
}
