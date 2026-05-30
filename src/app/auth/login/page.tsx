"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Tabs";
import { OTPInput } from "@/components/ui/OTPInput";

function humaniseError(msg: string, email: string): { text: string; action?: { label: string; href: string } } {
  if (msg.includes("otp_disabled") || msg.includes("Email logins are disabled")) {
    return {
      text: "Email OTP is not enabled on this project yet.",
      action: { label: "Use password login instead", href: "#password" },
    };
  }
  if (msg.includes("User not found") || msg.includes("user_not_found") || msg.includes("signup_disabled")) {
    return {
      text: "No account found for that email.",
      action: { label: "Create an account →", href: `/auth/signup?email=${encodeURIComponent(email)}` },
    };
  }
  if (msg.includes("Invalid login credentials") || msg.includes("invalid_credentials")) {
    return { text: "Incorrect email or password. Try again or reset your password." };
  }
  if (msg.includes("Email not confirmed")) {
    return { text: "Please confirm your email first — check your inbox for the confirmation link." };
  }
  return { text: msg };
}

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/account";

  const [tab, setTab] = useState("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [errorAction, setErrorAction] = useState<{ label: string; href: string } | undefined>();
  const [loading, setLoading] = useState(false);

  function setErr(msg: string, emailVal = email) {
    const { text, action } = humaniseError(msg, emailVal);
    setError(text);
    setErrorAction(action);
  }

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
    } catch { /* non-fatal */ }
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setErrorAction(undefined); setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) { setErr(authError.message); setLoading(false); return; }
    await mergeCart();
    router.push(returnTo);
    router.refresh();
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setErrorAction(undefined); setLoading(true);
    const supabase = createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    if (otpError) {
      // If OTP is disabled in Supabase, offer to switch to password tab
      if (otpError.message.includes("otp_disabled") || otpError.message.includes("disabled")) {
        setError("Email OTP is not enabled. Please use password login.");
        setErrorAction({ label: "Switch to password →", href: "#password" });
        setLoading(false);
        return;
      }
      // If user doesn't exist, send them to signup with email pre-filled
      if (
        otpError.message.includes("not found") ||
        otpError.message.includes("user_not_found") ||
        otpError.message.includes("signup")
      ) {
        router.push(`/auth/signup?email=${encodeURIComponent(email)}`);
        return;
      }
      setErr(otpError.message); setLoading(false); return;
    }
    setOtpSent(true); setLoading(false);
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setErrorAction(undefined); setLoading(true);
    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });
    if (verifyError) { setErr(verifyError.message); setLoading(false); return; }
    await mergeCart();
    router.push(returnTo);
    router.refresh();
  }

  function handleTabChange(id: string) {
    if (id === "#password") { setTab("password"); setError(""); setErrorAction(undefined); return; }
    setTab(id); setError(""); setErrorAction(undefined); setOtpSent(false);
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="mb-1 text-center text-2xl font-bold text-[#F5F5F5]">Welcome back</h1>
      <p className="mb-6 text-center text-sm text-[#A3A3A3]">Sign in to your Circuitkar account</p>

      <div className="rounded-lg border border-[#262626] bg-[#161616] p-6">
        <Tabs
          tabs={[
            { id: "password", label: "Password" },
            { id: "otp", label: "Email OTP" },
          ]}
          activeTab={tab}
          onChange={handleTabChange}
          className="mb-6"
        />

        {error && (
          <div className="mb-4 rounded-lg border border-[#EF4444]/30 bg-[#EF444415] px-4 py-3 text-sm text-[#EF4444]">
            {error}
            {errorAction && (
              <div className="mt-2">
                {errorAction.href.startsWith("#") ? (
                  <button
                    onClick={() => handleTabChange(errorAction.href)}
                    className="text-xs text-[#F97316] hover:underline"
                  >
                    {errorAction.label}
                  </button>
                ) : (
                  <Link href={errorAction.href} className="text-xs text-[#F97316] hover:underline">
                    {errorAction.label}
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {tab === "password" ? (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" />
            <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" placeholder="••••••••" />
            <div className="text-right">
              <Link href="/auth/forgot-password" className="text-xs text-[#F97316] hover:text-[#EA6C0A]">Forgot password?</Link>
            </div>
            <Button type="submit" loading={loading} className="w-full">Sign In</Button>
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
            />
            <p className="text-xs text-[#525252]">We&apos;ll email you a 6-digit code. You must have an existing account.</p>
            <Button type="submit" loading={loading} className="w-full">Send Code</Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <p className="text-sm text-[#A3A3A3]">
              Enter the 6-digit code sent to <span className="text-[#F5F5F5]">{email}</span>
            </p>
            <div className="flex justify-center">
              <OTPInput value={otp} onChange={setOtp} />
            </div>
            <Button type="submit" loading={loading} disabled={otp.length < 6} className="w-full">
              Verify &amp; Sign In
            </Button>
            <button
              type="button"
              onClick={() => { setOtpSent(false); setOtp(""); setError(""); setErrorAction(undefined); }}
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
          href={`/auth/signup${email ? `?email=${encodeURIComponent(email)}` : ""}${returnTo !== "/account" ? `&returnTo=${encodeURIComponent(returnTo)}` : ""}`}
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
    <Suspense fallback={<div className="mx-auto min-h-[70vh] max-w-md px-4 py-12" />}>
      <LoginInner />
    </Suspense>
  );
}
