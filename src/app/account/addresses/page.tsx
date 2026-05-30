"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Pencil, Trash2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { INDIAN_STATES } from "@/lib/indian-states";
import { isValidPincode } from "@/lib/validation";
import type { CustomerAddress } from "@/types";

interface AddressForm {
  id?: string;
  label: string;
  full_name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}

const emptyForm: AddressForm = {
  label: "Home",
  full_name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  is_default: false,
};

export default function AddressesPage() {
  const { toast } = useToast();
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<AddressForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/account/addresses");
    const data = await res.json();
    if (res.ok) setAddresses(data.addresses ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function openNew() {
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(a: CustomerAddress) {
    setForm({
      id: a.id,
      label: a.label,
      full_name: a.full_name,
      phone: a.phone,
      line1: a.line1,
      line2: a.line2 ?? "",
      city: a.city,
      state: a.state,
      pincode: a.pincode,
      is_default: a.is_default,
    });
    setModalOpen(true);
  }

  async function lookupPincode(pin: string) {
    if (!isValidPincode(pin)) return;
    setPinLoading(true);
    try {
      const res = await fetch(`/api/pincode/${pin}`);
      const data = await res.json();
      if (res.ok) {
        setForm((f) => ({ ...f, city: data.city, state: data.state }));
      }
    } catch {
      // ignore
    }
    setPinLoading(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidPincode(form.pincode)) {
      toast("Enter a valid 6-digit pincode.", "error");
      return;
    }
    setSaving(true);
    const url = form.id
      ? `/api/account/addresses/${form.id}`
      : "/api/account/addresses";
    const method = form.id ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      toast("Address saved.");
      setModalOpen(false);
      load();
    } else {
      const data = await res.json();
      toast(data.error || "Could not save.", "error");
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/account/addresses/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast("Address removed.");
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } else {
      toast("Could not remove.", "error");
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#F5F5F5]">Saved Addresses</h2>
        <Button size="sm" onClick={openNew}>
          <Plus className="h-4 w-4" /> Add Address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="rounded-lg border border-[#262626] bg-[#161616] p-8 text-center">
          <MapPin className="mx-auto mb-2 h-7 w-7 text-[#525252]" />
          <p className="text-sm text-[#A3A3A3]">No saved addresses yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {addresses.map((a) => (
            <div
              key={a.id}
              className="rounded-lg border border-[#262626] bg-[#161616] p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-[#F5F5F5]">
                  {a.label}
                  {a.is_default && (
                    <span className="ml-2 rounded-md bg-[#F9731615] px-1.5 py-0.5 text-[10px] text-[#F97316]">
                      Default
                    </span>
                  )}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(a)}
                    aria-label="Edit"
                    className="flex h-7 w-7 items-center justify-center rounded-md text-[#525252] hover:text-[#F5F5F5]"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => remove(a.id)}
                    aria-label="Delete"
                    className="flex h-7 w-7 items-center justify-center rounded-md text-[#525252] hover:text-[#EF4444]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-[#A3A3A3]">{a.full_name}</p>
              <p className="text-sm text-[#A3A3A3]">
                {a.line1}
                {a.line2 ? `, ${a.line2}` : ""}
              </p>
              <p className="text-sm text-[#A3A3A3]">
                {a.city}, {a.state} — {a.pincode}
              </p>
              <p className="mt-1 text-xs text-[#525252]">{a.phone}</p>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id ? "Edit Address" : "Add Address"}
        className="max-w-lg"
      >
        <form onSubmit={save} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Label"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
            />
            <Input
              label="Phone"
              value={form.phone}
              onChange={(e) =>
                setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })
              }
              required
            />
          </div>
          <Input
            label="Full Name"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            required
          />
          <Input
            label="Address Line 1"
            value={form.line1}
            onChange={(e) => setForm({ ...form, line1: e.target.value })}
            required
          />
          <Input
            label="Address Line 2"
            value={form.line2}
            onChange={(e) => setForm({ ...form, line2: e.target.value })}
          />
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Pincode"
              value={form.pincode}
              onChange={(e) => {
                const pin = e.target.value.replace(/\D/g, "").slice(0, 6);
                setForm({ ...form, pincode: pin });
                if (pin.length === 6) lookupPincode(pin);
              }}
              required
              hint={pinLoading ? "Looking up…" : undefined}
            />
            <Input
              label="City"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              required
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#A3A3A3]">
                State
              </label>
              <select
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                required
                className="w-full rounded-lg border border-[#262626] bg-[#111111] px-3 py-2.5 text-sm text-[#F5F5F5] focus:border-[#F97316] focus:outline-none"
              >
                <option value="">Select</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-[#A3A3A3]">
            <input
              type="checkbox"
              checked={form.is_default}
              onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
              className="h-4 w-4 accent-[#F97316]"
            />
            Set as default address
          </label>
          <div className="flex gap-2 pt-2">
            <Button type="submit" loading={saving}>
              Save
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
