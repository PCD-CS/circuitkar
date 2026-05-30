"use client";

import { useState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo: `${siteUrl}/auth/reset-password` },
    );
    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }
    setSent(true);
    setLoading(false);
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="mb-1 text-center text-2xl font-bold text-[#F5F5F5]">
        Reset password
      </h1>
      <p className="mb-6 text-center text-sm text-[#A3A3A3]">
        We&apos;ll email you a reset link
      </p>

      <div className="rounded-lg border border-[#262626] bg-[#161616] p-6">
        {sent ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#F9731615]">
              <MailCheck className="h-6 w-6 text-[#F97316]" />
            </div>
            <p className="text-sm text-[#A3A3A3]">
              If an account exists for{" "}
              <span className="text-[#F5F5F5]">{email}</span>, a reset link is
              on its way.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-[#EF4444]/30 bg-[#EF444415] px-4 py-3 text-sm text-[#EF4444]">
                {error}
              </div>
            )}
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
            <Button type="submit" loading={loading} className="w-full">
              Send Reset Link
            </Button>
          </form>
        )}
      </div>

      <p className="mt-6 text-center text-sm text-[#A3A3A3]">
        <Link href="/auth/login" className="text-[#F97316] hover:text-[#EA6C0A]">
          Back to login
        </Link>
      </p>
    </div>
  );
}
