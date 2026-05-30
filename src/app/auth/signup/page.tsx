"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  isValidGSTIN,
  passwordStrength,
  type PasswordStrength,
} from "@/lib/validation";
import { cn } from "@/lib/utils";
import type { AccountType } from "@/types";

const strengthMeta: Record<PasswordStrength, { label: string; color: string; width: string }> = {
  weak: { label: "Weak", color: "bg-[#EF4444]", width: "w-1/3" },
  medium: { label: "Medium", color: "bg-[#F59E0B]", width: "w-2/3" },
  strong: { label: "Strong", color: "bg-[#22C55E]", width: "w-full" },
};

function SignupInner() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/account";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("personal");
  const [businessName, setBusinessName] = useState("");
  const [gstin, setGstin] = useState("");
  const [pan, setPan] = useState("");
  const [agreed, setAgreed] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const strength = password ? passwordStrength(password) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (phone && !/^[0-9]{10}$/.test(phone)) {
      setError("Phone must be 10 digits.");
      return;
    }
    if (accountType === "business" && !businessName.trim()) {
      setError("Business name is required for business accounts.");
      return;
    }
    if (gstin && !isValidGSTIN(gstin)) {
      setError("GSTIN must be a valid 15-character GSTIN.");
      return;
    }
    if (!agreed) {
      setError("Please agree to the terms to continue.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Store extended profile data (phone/business). The trigger creates the
    // profile row; we update it via an API route using the service role.
    if (data.user) {
      try {
        await fetch("/api/account/profile/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: data.user.id,
            full_name: fullName,
            phone: phone || null,
            account_type: accountType,
            business_name: accountType === "business" ? businessName : null,
            gstin: gstin || null,
            pan: pan || null,
          }),
        });
      } catch {
        // non-fatal — profile can be completed later in account settings
      }
    }

    setDone(true);
    setLoading(false);
  }

  if (done) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 py-12 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F9731615]">
          <MailCheck className="h-7 w-7 text-[#F97316]" />
        </div>
        <h1 className="text-2xl font-bold text-[#F5F5F5]">Check your email</h1>
        <p className="mt-2 text-sm text-[#A3A3A3]">
          We sent a confirmation link to{" "}
          <span className="text-[#F5F5F5]">{email}</span>. Click it to activate
          your account, then sign in.
        </p>
        <Link href="/auth/login" className="mt-6">
          <Button variant="secondary">Go to Login</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="mb-1 text-center text-2xl font-bold text-[#F5F5F5]">
        Create your account
      </h1>
      <p className="mb-6 text-center text-sm text-[#A3A3A3]">
        Join Circuitkar to track orders and checkout faster
      </p>

      <div className="rounded-lg border border-[#262626] bg-[#161616] p-6">
        {error && (
          <div className="mb-4 rounded-lg border border-[#EF4444]/30 bg-[#EF444415] px-4 py-3 text-sm text-[#EF4444]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name *"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoComplete="name"
          />
          <Input
            label="Email *"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <div>
            <Input
              label="Password *"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              hint="At least 8 characters"
            />
            {strength && (
              <div className="mt-2">
                <div className="h-1 w-full overflow-hidden rounded-full bg-[#262626]">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      strengthMeta[strength].color,
                      strengthMeta[strength].width,
                    )}
                  />
                </div>
                <p className="mt-1 text-xs text-[#525252]">
                  {strengthMeta[strength].label} password
                </p>
              </div>
            )}
          </div>
          <Input
            label="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            inputMode="numeric"
            autoComplete="tel"
            hint="For order updates — optional"
          />

          <div>
            <span className="mb-1.5 block text-sm font-medium text-[#A3A3A3]">
              Account Type
            </span>
            <div className="flex gap-3">
              {(["personal", "business"] as AccountType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setAccountType(t)}
                  className={cn(
                    "flex-1 rounded-lg border px-4 py-2.5 text-sm capitalize transition-colors",
                    accountType === t
                      ? "border-[#F97316] bg-[#F9731615] text-[#F97316]"
                      : "border-[#262626] text-[#A3A3A3] hover:text-[#F5F5F5]",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {accountType === "business" && (
            <div className="space-y-4 rounded-lg border border-[#262626] bg-[#111111] p-4">
              <Input
                label="Business Name *"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
              />
              <Input
                label="GSTIN"
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                hint="Optional — 15-character GSTIN"
                maxLength={15}
              />
              <Input
                label="PAN"
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase())}
                hint="Optional"
                maxLength={10}
              />
            </div>
          )}

          <label className="flex items-start gap-2 text-sm text-[#A3A3A3]">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#F97316]"
            />
            <span>
              I agree to the Terms of Service and Privacy Policy.
            </span>
          </label>

          <Button type="submit" loading={loading} className="w-full">
            Create Account
          </Button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-[#A3A3A3]">
        Already have an account?{" "}
        <Link
          href={`/auth/login${returnTo !== "/account" ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`}
          className="text-[#F97316] hover:text-[#EA6C0A]"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh]" />}>
      <SignupInner />
    </Suspense>
  );
}
