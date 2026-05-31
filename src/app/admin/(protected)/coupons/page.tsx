"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Tag, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percentage" | "flat";
  discount_value: number;
  max_discount_amount: number | null;
  min_order_value: number | null;
  usage_limit: number | null;
  per_user_limit: number | null;
  usage_count: number;
  is_active: boolean;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
}

const BLANK: Omit<Coupon, "id" | "usage_count" | "created_at"> = {
  code: "",
  description: "",
  discount_type: "percentage",
  discount_value: 10,
  max_discount_amount: null,
  min_order_value: 0,
  usage_limit: null,
  per_user_limit: 1,
  is_active: true,
  starts_at: null,
  expires_at: null,
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<typeof BLANK>({ ...BLANK });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/coupons");
    const data = await res.json();
    if (res.ok) setCoupons(data.coupons ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function setF(key: keyof typeof BLANK, val: unknown) {
    setForm(p => ({ ...p, [key]: val }));
  }

  async function createCoupon() {
    setError(""); setSaving(true);
    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        code: form.code.trim().toUpperCase(),
        discount_value: Number(form.discount_value),
        min_order_value: form.min_order_value ? Number(form.min_order_value) : null,
        max_discount_amount: form.max_discount_amount ? Number(form.max_discount_amount) : null,
        usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
        per_user_limit: form.per_user_limit ? Number(form.per_user_limit) : null,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setShowForm(false);
      setForm({ ...BLANK });
      setSuccess("Coupon created.");
      setTimeout(() => setSuccess(""), 3000);
      load();
    } else {
      setError(data.error || "Failed to create coupon.");
    }
  }

  async function toggleActive(c: Coupon) {
    await fetch(`/api/admin/coupons/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !c.is_active }),
    });
    setCoupons(prev => prev.map(x => x.id === c.id ? { ...x, is_active: !x.is_active } : x));
  }

  async function deleteCoupon(id: string) {
    if (!confirm("Delete this coupon?")) return;
    await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    setCoupons(prev => prev.filter(x => x.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-mono text-[#F5F5F5]">Coupons</h1>
          <p className="text-sm text-[#525252] mt-0.5">{coupons.length} coupon{coupons.length !== 1 ? "s" : ""}</p>
        </div>
        <Button size="sm" onClick={() => { setShowForm(v => !v); setError(""); }}>
          <Plus className="w-4 h-4" /> New Coupon
        </Button>
      </div>

      {success && <div className="rounded-lg border border-[#22C55E]/30 bg-[#22C55E]/10 px-4 py-3 text-sm text-[#22C55E]">{success}</div>}

      {/* Create form */}
      {showForm && (
        <div className="rounded-lg border border-[#262626] bg-[#161616] p-5 space-y-4">
          <p className="text-sm font-semibold text-[#F5F5F5]">New Coupon</p>
          {error && <p className="text-sm text-[#EF4444]">{error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input label="Code *" value={form.code} onChange={e => setF("code", e.target.value.toUpperCase())} placeholder="SUMMER20" />
            </div>
            <Input label="Description" value={form.description ?? ""} onChange={e => setF("description", e.target.value)} placeholder="Summer sale 20% off" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-[#A3A3A3] mb-1.5 font-mono uppercase tracking-wider">Type</label>
              <select value={form.discount_type} onChange={e => setF("discount_type", e.target.value)}
                className="w-full bg-[#111111] border border-[#262626] rounded-lg px-3 py-2.5 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#F97316]">
                <option value="percentage">Percentage %</option>
                <option value="flat">Flat ₹</option>
              </select>
            </div>
            <Input label={form.discount_type === "percentage" ? "Discount %" : "Discount ₹"} type="number" value={form.discount_value} onChange={e => setF("discount_value", e.target.value)} />
            {form.discount_type === "percentage" && (
              <Input label="Max Discount ₹" type="number" value={form.max_discount_amount ?? ""} onChange={e => setF("max_discount_amount", e.target.value || null)} placeholder="No limit" />
            )}
            <Input label="Min Order ₹" type="number" value={form.min_order_value ?? ""} onChange={e => setF("min_order_value", e.target.value || null)} placeholder="0" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Input label="Total Uses Limit" type="number" value={form.usage_limit ?? ""} onChange={e => setF("usage_limit", e.target.value || null)} placeholder="Unlimited" />
            <Input label="Per-User Limit" type="number" value={form.per_user_limit ?? ""} onChange={e => setF("per_user_limit", e.target.value || null)} placeholder="1" />
            <div>
              <label className="block text-xs text-[#A3A3A3] mb-1.5 font-mono uppercase tracking-wider">Valid From</label>
              <input type="date" value={form.starts_at?.split("T")[0] ?? ""} onChange={e => setF("starts_at", e.target.value || null)}
                className="w-full bg-[#111111] border border-[#262626] rounded-lg px-3 py-2.5 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#F97316]" />
            </div>
            <div>
              <label className="block text-xs text-[#A3A3A3] mb-1.5 font-mono uppercase tracking-wider">Expires</label>
              <input type="date" value={form.expires_at?.split("T")[0] ?? ""} onChange={e => setF("expires_at", e.target.value || null)}
                className="w-full bg-[#111111] border border-[#262626] rounded-lg px-3 py-2.5 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#F97316]" />
            </div>
          </div>
          <div className="flex gap-3">
            <Button loading={saving} onClick={createCoupon}>Create Coupon</Button>
            <Button variant="ghost" onClick={() => { setShowForm(false); setError(""); }}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-[#262626] bg-[#161616] overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-sm text-[#525252]">Loading…</div>
        ) : coupons.length === 0 ? (
          <div className="py-12 text-center">
            <Tag className="h-8 w-8 text-[#525252] mx-auto mb-2" />
            <p className="text-sm text-[#525252]">No coupons yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#262626] text-left text-xs uppercase tracking-wider text-[#525252]">
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Discount</th>
                  <th className="px-4 py-3">Min Order</th>
                  <th className="px-4 py-3">Uses</th>
                  <th className="px-4 py-3">Expires</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A]">
                {coupons.map(c => {
                  const isExpired = c.expires_at && new Date(c.expires_at) < new Date();
                  return (
                    <tr key={c.id} className="hover:bg-[#1A1A1A]">
                      <td className="px-4 py-3">
                        <p className="font-mono font-bold text-[#F97316]">{c.code}</p>
                        {c.description && <p className="text-xs text-[#525252]">{c.description}</p>}
                      </td>
                      <td className="px-4 py-3 font-mono text-[#F5F5F5]">
                        {c.discount_type === "percentage"
                          ? `${c.discount_value}%${c.max_discount_amount ? ` (max ₹${c.max_discount_amount})` : ""}`
                          : `₹${c.discount_value}`}
                      </td>
                      <td className="px-4 py-3 text-[#A3A3A3]">{c.min_order_value ? `₹${c.min_order_value}` : "—"}</td>
                      <td className="px-4 py-3 text-[#A3A3A3]">
                        {c.usage_count}{c.usage_limit ? ` / ${c.usage_limit}` : ""}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#A3A3A3]">
                        {c.expires_at
                          ? <span className={isExpired ? "text-[#EF4444]" : ""}>{new Date(c.expires_at).toLocaleDateString("en-IN")}</span>
                          : "Never"}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleActive(c)}
                          className={`inline-flex items-center gap-1 text-xs ${c.is_active && !isExpired ? "text-[#22C55E]" : "text-[#525252]"}`}>
                          {c.is_active && !isExpired
                            ? <><CheckCircle className="h-3.5 w-3.5" /> Active</>
                            : <><XCircle className="h-3.5 w-3.5" /> {isExpired ? "Expired" : "Inactive"}</>}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => deleteCoupon(c.id)}
                          className="p-1.5 text-[#525252] hover:text-[#EF4444] hover:bg-[#EF4444]/10 rounded transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
