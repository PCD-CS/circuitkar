"use client";

import { useState, useEffect, useCallback } from "react";
import { Save, Eye, EyeOff, CheckCircle, XCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Tabs";

type LaunchMode = "prelaunch" | "live" | "maintenance";

interface AllSettings {
  // Store & Launch
  launch_mode: LaunchMode;
  maintenance_message: string;
  announcement_text: string;
  announcement_enabled: string;
  site_name: string;
  store_email: string;
  whatsapp_number: string;
  free_shipping_threshold: string;
  admin_email: string;
  // Payments
  razorpay_key_id_test: string;
  razorpay_key_secret_test: string;
  razorpay_key_id_live: string;
  razorpay_key_secret_live: string;
  razorpay_use_live: string;
  // Shipping
  shiprocket_email: string;
  shiprocket_password: string;
  shiprocket_pickup_location: string;
  shiprocket_auto_create: string;
  // Email
  resend_api_key: string;
  resend_from_email: string;
  resend_from_name: string;
  send_order_emails: string;
  send_notifyme_emails: string;
  // SEO
  ga_measurement_id: string;
  fb_pixel_id: string;
  // Admin
  session_timeout_hours: string;
}

const DEFAULTS: AllSettings = {
  launch_mode: "prelaunch", maintenance_message: "", announcement_text: "", announcement_enabled: "true",
  site_name: "Circuitkar", store_email: "", whatsapp_number: "", free_shipping_threshold: "499", admin_email: "",
  razorpay_key_id_test: "", razorpay_key_secret_test: "", razorpay_key_id_live: "", razorpay_key_secret_live: "", razorpay_use_live: "false",
  shiprocket_email: "", shiprocket_password: "", shiprocket_pickup_location: "Primary", shiprocket_auto_create: "false",
  resend_api_key: "", resend_from_email: "orders@circuitkar.in", resend_from_name: "Circuitkar", send_order_emails: "true", send_notifyme_emails: "true",
  ga_measurement_id: "", fb_pixel_id: "",
  session_timeout_hours: "24",
};

const TAB_IDS = ["store", "payments", "shipping", "email", "seo", "admin"];
const TAB_LABELS = ["Store & Launch", "Payments", "Shipping", "Email", "SEO", "Admin Account"];

export default function SettingsPage() {
  const [settings, setSettings] = useState<AllSettings>(DEFAULTS);
  const [saved, setSaved] = useState<AllSettings>(DEFAULTS);
  const [activeTab, setActiveTab] = useState("store");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [shown, setShown] = useState<Record<string, boolean>>({});
  const [testResult, setTestResult] = useState<Record<string, "ok" | "fail" | null>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  // New password for admin account tab
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/settings");
    const data = await res.json();
    if (data.settings) {
      const merged = { ...DEFAULTS, ...data.settings };
      setSettings(merged);
      setSaved(merged);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function set(key: keyof AllSettings, value: string) {
    setSettings(p => ({ ...p, [key]: value }));
  }

  function isDirty(tab: string): boolean {
    const keys: Record<string, (keyof AllSettings)[]> = {
      store: ["launch_mode", "maintenance_message", "announcement_text", "announcement_enabled", "site_name", "store_email", "whatsapp_number", "free_shipping_threshold", "admin_email"],
      payments: ["razorpay_key_id_test", "razorpay_key_secret_test", "razorpay_key_id_live", "razorpay_key_secret_live", "razorpay_use_live"],
      shipping: ["shiprocket_email", "shiprocket_password", "shiprocket_pickup_location", "shiprocket_auto_create"],
      email: ["resend_api_key", "resend_from_email", "resend_from_name", "send_order_emails", "send_notifyme_emails"],
      seo: ["ga_measurement_id", "fb_pixel_id"],
      admin: ["admin_email", "session_timeout_hours"],
    };
    return (keys[tab] || []).some(k => settings[k] !== saved[k]);
  }

  async function saveTab() {
    setError(""); setSuccess(""); setSaving(true);
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    if (res.ok) {
      setSaved({ ...settings });
      setSuccess("Settings saved.");
      setTimeout(() => setSuccess(""), 3000);
    } else {
      const data = await res.json();
      setError(data.error || "Failed to save.");
    }
    setSaving(false);
  }

  async function testConnection(type: "razorpay" | "shiprocket" | "email") {
    setTesting(p => ({ ...p, [type]: true }));
    setTestResult(p => ({ ...p, [type]: null }));
    try {
      // Simple connectivity test
      if (type === "email") {
        const res = await fetch("/api/admin/settings/test-email", { method: "POST" });
        setTestResult(p => ({ ...p, [type]: res.ok ? "ok" : "fail" }));
      } else {
        // For Razorpay/Shiprocket — just check keys are present
        const hasKeys = type === "razorpay"
          ? (settings.razorpay_key_id_test || settings.razorpay_key_id_live)
          : settings.shiprocket_email;
        setTestResult(p => ({ ...p, [type]: hasKeys ? "ok" : "fail" }));
      }
    } catch { setTestResult(p => ({ ...p, [type]: "fail" })); }
    setTesting(p => ({ ...p, [type]: false }));
  }

  async function handlePasswordChange() {
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }
    if (newPassword.length < 8) { setError("Password must be at least 8 characters."); return; }
    // Update via Supabase auth (done client-side)
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { error: authError } = await supabase.auth.updateUser({ password: newPassword });
    if (authError) { setError(authError.message); return; }
    setSuccess("Password updated."); setNewPassword(""); setConfirmPassword("");
    setTimeout(() => setSuccess(""), 3000);
  }

  const Toggle = ({ k, label, description }: { k: keyof AllSettings; label: string; description?: string }) => {
    const checked = settings[k] === "true";
    return (
      <div className="flex items-start justify-between gap-4 py-3 border-b border-[#1A1A1A] last:border-0">
        <div>
          <p className="text-sm text-[#F5F5F5]">{label}</p>
          {description && <p className="text-xs text-[#525252] mt-0.5">{description}</p>}
        </div>
        <button type="button" onClick={() => set(k, checked ? "false" : "true")}
          className={`relative flex-shrink-0 w-10 h-5 rounded-full transition-colors ${checked ? "bg-[#F97316]" : "bg-[#262626]"}`}>
          <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
        </button>
      </div>
    );
  };

  const MaskedInput = ({ k, label, placeholder }: { k: keyof AllSettings; label: string; placeholder?: string }) => (
    <div className="relative">
      <label className="block text-xs text-[#A3A3A3] mb-1.5 font-mono uppercase tracking-wider">{label}</label>
      <div className="relative">
        <input type={shown[k] ? "text" : "password"} value={settings[k]} onChange={e => set(k, e.target.value)}
          placeholder={placeholder}
          className="w-full bg-[#111111] border border-[#262626] rounded-lg px-3 py-2.5 pr-10 text-sm text-[#F5F5F5] font-mono placeholder:text-[#525252] focus:outline-none focus:border-[#F97316]" />
        <button type="button" onClick={() => setShown(p => ({ ...p, [k]: !p[k] }))}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#525252] hover:text-[#A3A3A3]">
          {shown[k] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  const TestBtn = ({ type }: { type: "razorpay" | "shiprocket" | "email" }) => (
    <div className="flex items-center gap-3 mt-2">
      <Button type="button" variant="secondary" size="sm" loading={testing[type]} onClick={() => testConnection(type)}>
        {type === "email" ? <Send className="w-3.5 h-3.5" /> : null} Test Connection
      </Button>
      {testResult[type] === "ok" && <span className="flex items-center gap-1 text-xs text-[#22C55E]"><CheckCircle className="w-3.5 h-3.5" /> Connected</span>}
      {testResult[type] === "fail" && <span className="flex items-center gap-1 text-xs text-[#EF4444]"><XCircle className="w-3.5 h-3.5" /> Failed — check keys</span>}
    </div>
  );

  const tabs = TAB_IDS.map((id, i) => ({ id, label: TAB_LABELS[i], badge: isDirty(id) ? "•" : undefined }));

  if (loading) return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-12 bg-[#161616] rounded-lg animate-pulse" />)}
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold font-mono text-[#F5F5F5]">Settings</h1>
        <p className="text-sm text-[#525252] mt-1">All store configuration in one place.</p>
      </div>

      {success && <div className="bg-[#22C55E15] border border-[#22C55E]/30 rounded-lg px-4 py-3 text-sm text-[#22C55E]">{success}</div>}
      {error && <div className="bg-[#EF444415] border border-[#EF4444]/30 rounded-lg px-4 py-3 text-sm text-[#EF4444]">{error}</div>}

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="bg-[#161616] border border-[#262626] rounded-lg p-6">
        {/* Tab 1: Store & Launch */}
        {activeTab === "store" && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs text-[#A3A3A3] mb-2 font-mono uppercase tracking-wider">Launch Mode</label>
              <div className="flex gap-3">
                {(["prelaunch", "live", "maintenance"] as LaunchMode[]).map(mode => (
                  <button key={mode} type="button" onClick={() => set("launch_mode", mode)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors capitalize ${
                      settings.launch_mode === mode ? "bg-[#F97316] border-[#F97316] text-white" : "border-[#262626] text-[#A3A3A3] hover:border-[#F97316]/50"
                    }`}>{mode}</button>
                ))}
              </div>
              <p className="text-xs text-[#525252] mt-2">
                {settings.launch_mode === "prelaunch" && "Cart works, checkout shows 'Coming Soon'."}
                {settings.launch_mode === "live" && "Full checkout and payments enabled."}
                {settings.launch_mode === "maintenance" && "Maintenance banner shown, checkout disabled."}
              </p>
            </div>
            {settings.launch_mode === "maintenance" && (
              <div>
                <label className="block text-xs text-[#A3A3A3] mb-1.5 font-mono uppercase tracking-wider">Maintenance Message</label>
                <textarea value={settings.maintenance_message} onChange={e => set("maintenance_message", e.target.value)} rows={2}
                  className="w-full bg-[#111111] border border-[#262626] rounded-lg px-3 py-2.5 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#F97316]" />
              </div>
            )}
            <Input label="Site Name" value={settings.site_name} onChange={e => set("site_name", e.target.value)} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Store Email" type="email" value={settings.store_email} onChange={e => set("store_email", e.target.value)} placeholder="hello@circuitkar.in" />
              <Input label="Admin Email (notifications)" type="email" value={settings.admin_email} onChange={e => set("admin_email", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="WhatsApp Number" value={settings.whatsapp_number} onChange={e => set("whatsapp_number", e.target.value)} placeholder="919XXXXXXXXX" />
              <Input label="Free Shipping Threshold (₹)" type="number" value={settings.free_shipping_threshold} onChange={e => set("free_shipping_threshold", e.target.value)} />
            </div>
            <div className="border border-[#262626] rounded-lg p-4">
              <p className="text-xs font-mono text-[#525252] uppercase tracking-wider mb-3">Announcement Bar</p>
              <Toggle k="announcement_enabled" label="Show Announcement Bar" />
              <div className="mt-3">
                <Input label="Announcement Text" value={settings.announcement_text} onChange={e => set("announcement_text", e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Payments */}
        {activeTab === "payments" && (
          <div className="space-y-5">
            <Toggle k="razorpay_use_live" label="Use Live Keys" description="Switch from test to live Razorpay keys. Only enable when ready." />
            <div className="space-y-4 border border-[#262626] rounded-lg p-4">
              <p className="text-xs font-mono text-[#525252] uppercase tracking-wider">Test Keys</p>
              <MaskedInput k="razorpay_key_id_test" label="Key ID (Test)" placeholder="rzp_test_..." />
              <MaskedInput k="razorpay_key_secret_test" label="Key Secret (Test)" placeholder="••••••••••" />
            </div>
            <div className="space-y-4 border border-[#262626] rounded-lg p-4">
              <p className="text-xs font-mono text-[#525252] uppercase tracking-wider">Live Keys</p>
              <MaskedInput k="razorpay_key_id_live" label="Key ID (Live)" placeholder="rzp_live_..." />
              <MaskedInput k="razorpay_key_secret_live" label="Key Secret (Live)" placeholder="••••••••••" />
            </div>
            <TestBtn type="razorpay" />
          </div>
        )}

        {/* Tab 3: Shipping */}
        {activeTab === "shipping" && (
          <div className="space-y-5">
            <Input label="Shiprocket Email" type="email" value={settings.shiprocket_email} onChange={e => set("shiprocket_email", e.target.value)} />
            <MaskedInput k="shiprocket_password" label="Shiprocket Password" />
            <Input label="Default Pickup Location" value={settings.shiprocket_pickup_location} onChange={e => set("shiprocket_pickup_location", e.target.value)} placeholder="Primary" />
            <Toggle k="shiprocket_auto_create" label="Auto-create Shiprocket orders" description="Automatically create shipment when order is confirmed." />
            <TestBtn type="shiprocket" />
          </div>
        )}

        {/* Tab 4: Email */}
        {activeTab === "email" && (
          <div className="space-y-5">
            <MaskedInput k="resend_api_key" label="Resend API Key" placeholder="re_..." />
            <div className="grid grid-cols-2 gap-4">
              <Input label="From Email" value={settings.resend_from_email} onChange={e => set("resend_from_email", e.target.value)} placeholder="orders@circuitkar.in" />
              <Input label="From Name" value={settings.resend_from_name} onChange={e => set("resend_from_name", e.target.value)} placeholder="Circuitkar" />
            </div>
            <div className="border border-[#262626] rounded-lg p-4 space-y-0">
              <Toggle k="send_order_emails" label="Send order confirmation emails" />
              <Toggle k="send_notifyme_emails" label="Send notify-me confirmation emails" />
            </div>
            <TestBtn type="email" />
          </div>
        )}

        {/* Tab 5: SEO */}
        {activeTab === "seo" && (
          <div className="space-y-5">
            <Input label="Google Analytics ID" value={settings.ga_measurement_id} onChange={e => set("ga_measurement_id", e.target.value)} placeholder="G-XXXXXXXXXX" />
            <Input label="Facebook Pixel ID" value={settings.fb_pixel_id} onChange={e => set("fb_pixel_id", e.target.value)} placeholder="1234567890" />
          </div>
        )}

        {/* Tab 6: Admin Account */}
        {activeTab === "admin" && (
          <div className="space-y-5">
            <Input label="Admin Email" type="email" value={settings.admin_email} onChange={e => set("admin_email", e.target.value)} />
            <Input label="Session Timeout (hours)" type="number" value={settings.session_timeout_hours} onChange={e => set("session_timeout_hours", e.target.value)} />
            <div className="border border-[#262626] rounded-lg p-4 space-y-4">
              <p className="text-xs font-mono text-[#525252] uppercase tracking-wider">Change Password</p>
              <div className="relative">
                <label className="block text-xs text-[#A3A3A3] mb-1.5 font-mono uppercase tracking-wider">New Password</label>
                <input type={shown.newpw ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={8}
                  className="w-full bg-[#111111] border border-[#262626] rounded-lg px-3 py-2.5 pr-10 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#F97316]" />
                <button type="button" onClick={() => setShown(p => ({ ...p, newpw: !p.newpw }))} className="absolute right-3 top-[calc(50%+10px)] -translate-y-1/2 text-[#525252]">
                  {shown.newpw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div>
                <label className="block text-xs text-[#A3A3A3] mb-1.5 font-mono uppercase tracking-wider">Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#111111] border border-[#262626] rounded-lg px-3 py-2.5 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#F97316]" />
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={handlePasswordChange}>Update Password</Button>
            </div>
          </div>
        )}

        <div className="mt-6 pt-5 border-t border-[#262626]">
          <Button onClick={saveTab} loading={saving}>
            <Save className="w-4 h-4" /> Save {TAB_LABELS[TAB_IDS.indexOf(activeTab)]}
          </Button>
        </div>
      </div>
    </div>
  );
}
