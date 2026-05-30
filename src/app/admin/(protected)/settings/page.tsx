"use client";

import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface SettingsForm {
  site_name: string;
  announcement_text: string;
  announcement_enabled: string;
  free_shipping_threshold: string;
  razorpay_live: string;
  admin_email: string;
  whatsapp_number: string;
}

const defaults: SettingsForm = {
  site_name: "Circuitkar",
  announcement_text: "🚀 Launching Soon — Click 'Notify Me' on products you want!",
  announcement_enabled: "true",
  free_shipping_threshold: "499",
  razorpay_live: "false",
  admin_email: "",
  whatsapp_number: "91XXXXXXXXXX",
};

export default function AdminSettingsPage() {
  const [form, setForm] = useState<SettingsForm>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) {
          setForm((prev) => ({ ...prev, ...data.settings }));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function set(key: keyof SettingsForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setSaving(true);

    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      const data = await res.json();
      setError(data.error || "Failed to save.");
    }
    setSaving(false);
  }

  const Toggle = ({
    label,
    description,
    settingKey,
  }: {
    label: string;
    description?: string;
    settingKey: keyof SettingsForm;
  }) => {
    const checked = form[settingKey] === "true";
    return (
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-[#F5F5F5]">{label}</p>
          {description && <p className="text-xs text-[#525252] mt-0.5">{description}</p>}
        </div>
        <button
          type="button"
          onClick={() => set(settingKey, checked ? "false" : "true")}
          className={`relative flex-shrink-0 w-10 h-5 rounded-full transition-colors ${
            checked ? "bg-[#F97316]" : "bg-[#262626]"
          }`}
        >
          <div
            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
              checked ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 bg-[#161616] rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold font-mono text-[#F5F5F5]">Settings</h1>
        <p className="text-sm text-[#525252] mt-1">Site configuration</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-[#EF444415] border border-[#EF4444]/30 rounded-lg px-4 py-3 text-sm text-[#EF4444]">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-[#22C55E15] border border-[#22C55E]/30 rounded-lg px-4 py-3 text-sm text-[#22C55E]">
            Settings saved successfully.
          </div>
        )}

        <div className="bg-[#161616] border border-[#262626] rounded-lg p-6 space-y-5">
          <h2 className="text-xs font-mono text-[#525252] uppercase tracking-wider pb-2 border-b border-[#262626]">
            General
          </h2>
          <Input
            label="Site Name"
            value={form.site_name}
            onChange={(e) => set("site_name", e.target.value)}
          />
          <Input
            label="Admin Email"
            type="email"
            value={form.admin_email}
            onChange={(e) => set("admin_email", e.target.value)}
            placeholder="admin@circuitkar.in"
          />
          <Input
            label="WhatsApp Number"
            value={form.whatsapp_number}
            onChange={(e) => set("whatsapp_number", e.target.value)}
            placeholder="919XXXXXXXXX"
          />
          <Input
            label="Free Shipping Threshold (₹)"
            type="number"
            value={form.free_shipping_threshold}
            onChange={(e) => set("free_shipping_threshold", e.target.value)}
          />
        </div>

        <div className="bg-[#161616] border border-[#262626] rounded-lg p-6 space-y-5">
          <h2 className="text-xs font-mono text-[#525252] uppercase tracking-wider pb-2 border-b border-[#262626]">
            Announcement Bar
          </h2>
          <Toggle
            label="Show Announcement Bar"
            description="Displays a banner at the top of every page"
            settingKey="announcement_enabled"
          />
          <div>
            <label className="block text-xs text-[#A3A3A3] mb-1.5 font-mono uppercase tracking-wider">
              Announcement Text
            </label>
            <input
              value={form.announcement_text}
              onChange={(e) => set("announcement_text", e.target.value)}
              className="w-full bg-[#111111] border border-[#262626] rounded-lg px-3 py-2.5 text-sm text-[#F5F5F5] placeholder:text-[#525252] focus:outline-none focus:border-[#F97316]"
            />
          </div>
        </div>

        <div className="bg-[#161616] border border-[#262626] rounded-lg p-6 space-y-5">
          <h2 className="text-xs font-mono text-[#525252] uppercase tracking-wider pb-2 border-b border-[#262626]">
            Payments
          </h2>
          <Toggle
            label="Razorpay Live Mode"
            description="When disabled, checkout is globally turned off. Enable only when ready to accept payments."
            settingKey="razorpay_live"
          />
          <div className="bg-[#F9731615] border border-[#F97316]/20 rounded-lg px-4 py-3 text-xs text-[#A3A3A3]">
            Razorpay keys must be set in environment variables.
            This toggle only controls the UI visibility of checkout.
          </div>
        </div>

        <Button type="submit" loading={saving}>
          <Save className="w-4 h-4" />
          Save Settings
        </Button>
      </form>
    </div>
  );
}
