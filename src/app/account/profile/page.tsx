"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import { isValidGSTIN } from "@/lib/validation";
import { cn } from "@/lib/utils";
import type { AccountType, CustomerProfile } from "@/types";

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-[#F5F5F5]">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-5 w-10 shrink-0 rounded-full transition-colors",
          checked ? "bg-[#F97316]" : "bg-[#262626]",
        )}
      >
        <span
          className={cn(
            "absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
            checked ? "translate-x-5" : "translate-x-0",
          )}
        />
      </button>
    </div>
  );
}

export default function ProfilePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("personal");
  const [businessName, setBusinessName] = useState("");
  const [gstin, setGstin] = useState("");
  const [pan, setPan] = useState("");
  const [emailNotif, setEmailNotif] = useState(true);
  const [whatsappNotif, setWhatsappNotif] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/account/profile")
      .then((r) => r.json())
      .then((data) => {
        const p = data.profile as CustomerProfile | null;
        if (p) {
          setFullName(p.full_name ?? "");
          setPhone(p.phone ?? "");
          setAccountType((p.account_type as AccountType) ?? "personal");
          setBusinessName(p.business_name ?? "");
          setGstin(p.gstin ?? "");
          setPan(p.pan ?? "");
          setEmailNotif(p.email_notifications ?? true);
          setWhatsappNotif(p.whatsapp_notifications ?? false);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (gstin && !isValidGSTIN(gstin)) {
      toast("Invalid GSTIN.", "error");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/account/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: fullName,
        phone: phone || null,
        account_type: accountType,
        business_name: accountType === "business" ? businessName : null,
        gstin: gstin || null,
        pan: pan || null,
        email_notifications: emailNotif,
        whatsapp_notifications: whatsappNotif,
      }),
    });
    setSaving(false);
    if (res.ok) toast("Profile saved.");
    else toast("Could not save profile.", "error");
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast("Password must be at least 8 characters.", "error");
      return;
    }
    setChangingPw(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPw(false);
    if (error) toast(error.message, "error");
    else {
      toast("Password updated.");
      setNewPassword("");
    }
  }

  async function deleteAccount() {
    if (deleteConfirm !== "DELETE") return;
    setDeleting(true);
    const res = await fetch("/api/account/delete", { method: "POST" });
    if (res.ok) {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } else {
      toast("Could not delete account.", "error");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#F97316]" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <form
        onSubmit={saveProfile}
        className="space-y-5 rounded-lg border border-[#262626] bg-[#161616] p-6"
      >
        <h2 className="text-sm font-semibold text-[#F5F5F5]">Profile Details</h2>
        <Input
          label="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <Input
          label="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
          inputMode="numeric"
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
              label="Business Name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />
            <Input
              label="GSTIN"
              value={gstin}
              onChange={(e) => setGstin(e.target.value.toUpperCase())}
              maxLength={15}
            />
            <Input
              label="PAN"
              value={pan}
              onChange={(e) => setPan(e.target.value.toUpperCase())}
              maxLength={10}
            />
          </div>
        )}

        <div className="space-y-3 border-t border-[#262626] pt-4">
          <Toggle
            label="Email notifications"
            checked={emailNotif}
            onChange={setEmailNotif}
          />
          <Toggle
            label="WhatsApp notifications"
            checked={whatsappNotif}
            onChange={setWhatsappNotif}
          />
        </div>

        <Button type="submit" loading={saving}>
          Save Changes
        </Button>
      </form>

      <form
        onSubmit={changePassword}
        className="space-y-4 rounded-lg border border-[#262626] bg-[#161616] p-6"
      >
        <h2 className="text-sm font-semibold text-[#F5F5F5]">Change Password</h2>
        <Input
          label="New Password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
        />
        <Button type="submit" variant="secondary" loading={changingPw}>
          Update Password
        </Button>
      </form>

      <div className="space-y-4 rounded-lg border border-[#EF4444]/30 bg-[#EF444415] p-6">
        <h2 className="text-sm font-semibold text-[#EF4444]">Danger Zone</h2>
        <p className="text-sm text-[#A3A3A3]">
          Deleting your account is permanent. Type{" "}
          <span className="font-mono text-[#F5F5F5]">DELETE</span> to confirm.
        </p>
        <Input
          value={deleteConfirm}
          onChange={(e) => setDeleteConfirm(e.target.value)}
          placeholder="DELETE"
        />
        <Button
          type="button"
          variant="secondary"
          loading={deleting}
          disabled={deleteConfirm !== "DELETE"}
          onClick={deleteAccount}
          className="border-[#EF4444] text-[#EF4444] hover:bg-[#EF444415]"
        >
          Delete Account
        </Button>
      </div>
    </div>
  );
}
