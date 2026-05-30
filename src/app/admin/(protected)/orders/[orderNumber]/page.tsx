"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ChevronLeft, ExternalLink, Package, CheckCircle2, Truck, Home, XCircle,
  Clock, ShoppingBag, Save, AlertCircle, ChevronDown, ChevronUp, TestTube2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Order, OrderItem, ShippingAddress, StatusHistoryEntry } from "@/types";

const STATUS_ORDER = ["pending", "confirmed", "accepted", "packed", "shipped", "delivered"] as const;

const STATUS_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending:   { label: "Pending",   color: "text-[#F59E0B]  border-[#F59E0B]/40  bg-[#F59E0B]/10",  icon: Clock },
  confirmed: { label: "Confirmed", color: "text-[#3B82F6]  border-[#3B82F6]/40  bg-[#3B82F6]/10",  icon: CheckCircle2 },
  accepted:  { label: "Accepted",  color: "text-[#8B5CF6]  border-[#8B5CF6]/40  bg-[#8B5CF6]/10",  icon: ShoppingBag },
  packed:    { label: "Packed",    color: "text-[#F97316]  border-[#F97316]/40  bg-[#F97316]/10",  icon: Package },
  shipped:   { label: "Shipped",   color: "text-[#06B6D4]  border-[#06B6D4]/40  bg-[#06B6D4]/10",  icon: Truck },
  delivered: { label: "Delivered", color: "text-[#22C55E]  border-[#22C55E]/40  bg-[#22C55E]/10",  icon: Home },
  cancelled: { label: "Cancelled", color: "text-[#EF4444]  border-[#EF4444]/40  bg-[#EF4444]/10",  icon: XCircle },
};

const NEXT_STATUS: Record<string, string> = {
  confirmed: "accepted",
  accepted:  "packed",
  packed:    "shipped",
  shipped:   "delivered",
};

function inr(n: number | null | undefined) {
  return `₹${Number(n ?? 0).toLocaleString("en-IN")}`;
}

function fmt(ts: string | null | undefined) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? STATUS_META.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium ${m.color}`}>
      <m.icon className="h-3.5 w-3.5" />
      {m.label}
    </span>
  );
}

export default function AdminOrderDetailPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Status & shipping form
  const [note, setNote] = useState("");
  const [courier, setCourier] = useState("");
  const [trackingNum, setTrackingNum] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [showShippingForm, setShowShippingForm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/orders/${orderNumber}`);
    const data = await res.json();
    if (res.ok) {
      setOrder(data.order);
      // Pre-fill shipping fields from existing data
      if (data.order.courier_name) setCourier(data.order.courier_name);
      if (data.order.tracking_number) setTrackingNum(data.order.tracking_number);
      if (data.order.tracking_url) setTrackingUrl(data.order.tracking_url);
    }
    setLoading(false);
  }, [orderNumber]);

  useEffect(() => { load(); }, [load]);

  async function patch(payload: Record<string, unknown>) {
    setSaving(true); setError(""); setSuccess("");
    const res = await fetch(`/api/admin/orders/${order!.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setOrder(data.order);
      setSuccess("Order updated.");
      setNote("");
      setShowCancelConfirm(false);
      setTimeout(() => setSuccess(""), 3000);
    } else {
      setError(data.error || "Failed to update order.");
    }
  }

  async function advanceStatus() {
    if (!order) return;
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    const payload: Record<string, unknown> = { status: next, note };
    // Include shipping details when marking as shipped
    if (next === "shipped") {
      if (!courier || !trackingNum) { setError("Please fill courier name and tracking number before marking as shipped."); return; }
      payload.courier_name = courier;
      payload.tracking_number = trackingNum;
      payload.tracking_url = trackingUrl || undefined;
    }
    await patch(payload);
  }

  async function saveShipping() {
    await patch({ courier_name: courier, tracking_number: trackingNum, tracking_url: trackingUrl || undefined });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F97316] border-t-transparent" />
      </div>
    );
  }

  if (!order) {
    return <div className="text-center py-24 text-[#525252]">Order not found.</div>;
  }

  const items = (order.items ?? []) as OrderItem[];
  const addr = order.shipping_address as ShippingAddress;
  const history: StatusHistoryEntry[] = Array.isArray(order.status_history) ? order.status_history : [];
  const nextStatus = NEXT_STATUS[order.status];
  const nextMeta = nextStatus ? STATUS_META[nextStatus] : null;
  const isCancelled = order.status === "cancelled";
  const isDelivered = order.status === "delivered";
  const canAdvance = !isCancelled && !isDelivered && !!nextStatus;

  return (
    <div className="space-y-6 max-w-5xl">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1 text-sm text-[#A3A3A3] hover:text-[#F5F5F5]"
      >
        <ChevronLeft className="h-4 w-4" /> Back to orders
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-mono text-lg font-bold text-[#F5F5F5]">#{order.order_number}</h1>
            <StatusBadge status={order.status} />
            {order.is_test_order && (
              <span className="inline-flex items-center gap-1 rounded-md border border-[#F59E0B]/50 bg-[#F59E0B]/10 px-2 py-0.5 text-xs text-[#F59E0B] font-mono">
                <TestTube2 className="h-3 w-3" /> TEST ORDER — Not a real payment
              </span>
            )}
          </div>
          <p className="text-xs text-[#525252] mt-1">Placed on {fmt(order.created_at)}</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-3 text-sm text-[#EF4444]">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-[#22C55E]/30 bg-[#22C55E]/10 px-4 py-3 text-sm text-[#22C55E]">{success}</div>
      )}

      {/* Status Action Panel */}
      {!isCancelled && !isDelivered && (
        <div className="rounded-lg border border-[#262626] bg-[#161616] p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[#F5F5F5]">Order Actions</h3>

          {/* Notes field */}
          <div>
            <label className="block text-xs text-[#A3A3A3] mb-1.5 font-mono uppercase tracking-wider">
              Note (optional — visible in timeline)
            </label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Customer called, priority dispatch"
              className="w-full bg-[#111111] border border-[#262626] rounded-lg px-3 py-2 text-sm text-[#F5F5F5] placeholder:text-[#525252] focus:outline-none focus:border-[#F97316]"
            />
          </div>

          {/* Shipping form — show when moving to shipped, or expandable at any time */}
          {(nextStatus === "shipped" || showShippingForm) && (
            <div className="border border-[#262626] rounded-lg p-4 space-y-3 bg-[#111111]">
              <p className="text-xs font-mono text-[#525252] uppercase tracking-wider">Shipping Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Courier Name *"
                  value={courier}
                  onChange={(e) => setCourier(e.target.value)}
                  placeholder="DTDC, Delhivery, BlueDart…"
                />
                <Input
                  label="AWB / Tracking Number *"
                  value={trackingNum}
                  onChange={(e) => setTrackingNum(e.target.value)}
                  placeholder="123456789"
                />
              </div>
              <Input
                label="Tracking URL"
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                placeholder="https://track.courier.com/..."
              />
              {nextStatus !== "shipped" && (
                <Button variant="secondary" size="sm" loading={saving} onClick={saveShipping}>
                  <Save className="w-3.5 h-3.5" /> Save Shipping Details
                </Button>
              )}
            </div>
          )}

          {nextStatus !== "shipped" && !showShippingForm && (
            <button
              type="button"
              onClick={() => setShowShippingForm(v => !v)}
              className="text-xs text-[#525252] hover:text-[#F97316] flex items-center gap-1"
            >
              {showShippingForm ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {showShippingForm ? "Hide" : "Add / Edit"} shipping details
            </button>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-3 flex-wrap pt-1">
            {canAdvance && nextMeta && (
              <Button onClick={advanceStatus} loading={saving}>
                <nextMeta.icon className="h-4 w-4" />
                Mark as {nextMeta.label}
              </Button>
            )}
            {!showCancelConfirm ? (
              <Button variant="ghost" onClick={() => setShowCancelConfirm(true)} className="text-[#EF4444] hover:text-[#EF4444] hover:border-[#EF4444]/50">
                Cancel Order
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#EF4444]">Sure?</span>
                <Button variant="ghost" size="sm" loading={saving}
                  className="border-[#EF4444]/50 text-[#EF4444]"
                  onClick={() => patch({ status: "cancelled", note: note || "Cancelled by admin" })}>
                  Yes, cancel
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowCancelConfirm(false)}>No</Button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left: items + totals + timeline */}
        <div className="lg:col-span-2 space-y-4">
          {/* Items */}
          <div className="rounded-lg border border-[#262626] bg-[#161616] p-5">
            <h3 className="mb-3 text-sm font-semibold text-[#F5F5F5]">Items ({items.reduce((s, it) => s + it.qty, 0)} units)</h3>
            <div className="divide-y divide-[#262626]">
              {items.map((it, i) => (
                <div key={i} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="text-[#F5F5F5]">{it.name}</p>
                    <p className="text-xs text-[#525252]">Qty {it.qty} × {inr(it.price)}</p>
                  </div>
                  <span className="text-[#A3A3A3] font-mono">{inr(it.price * it.qty)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-1.5 border-t border-[#262626] pt-3 text-sm">
              <div className="flex justify-between text-[#A3A3A3]">
                <span>Subtotal</span><span>{inr(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-[#A3A3A3]">
                <span>Shipping</span>
                <span>{Number(order.shipping_charge) === 0 ? "Free" : inr(order.shipping_charge)}</span>
              </div>
              <div className="flex justify-between pt-1 text-base font-semibold">
                <span className="text-[#F5F5F5]">Total</span>
                <span className="text-[#F97316] font-mono">{inr(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Status Timeline */}
          <div className="rounded-lg border border-[#262626] bg-[#161616] p-5">
            <h3 className="mb-4 text-sm font-semibold text-[#F5F5F5]">Status Timeline</h3>
            {history.length === 0 ? (
              <p className="text-sm text-[#525252]">No history yet.</p>
            ) : (
              <div className="space-y-0">
                {[...history].reverse().map((h, i) => {
                  const meta = STATUS_META[h.status] ?? STATUS_META.pending;
                  return (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`flex h-7 w-7 items-center justify-center rounded-full border ${meta.color}`}>
                          <meta.icon className="h-3.5 w-3.5" />
                        </div>
                        {i < history.length - 1 && <div className="w-px flex-1 bg-[#262626] my-1" />}
                      </div>
                      <div className="pb-4">
                        <p className="text-sm font-medium text-[#F5F5F5]">{meta.label}</p>
                        <p className="text-xs text-[#525252]">{fmt(h.timestamp)}</p>
                        {h.note && <p className="text-xs text-[#A3A3A3] mt-0.5 italic">"{h.note}"</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: customer, address, payment, shipping */}
        <div className="space-y-4">
          <div className="rounded-lg border border-[#262626] bg-[#161616] p-5">
            <h3 className="mb-2 text-sm font-semibold text-[#F5F5F5]">Customer</h3>
            <p className="text-sm text-[#A3A3A3]">{order.customer_name}</p>
            <p className="text-sm text-[#A3A3A3]">{order.customer_email}</p>
            {order.customer_phone && <p className="text-sm text-[#A3A3A3]">{order.customer_phone}</p>}
          </div>

          <div className="rounded-lg border border-[#262626] bg-[#161616] p-5">
            <h3 className="mb-2 text-sm font-semibold text-[#F5F5F5]">Shipping Address</h3>
            <p className="text-sm text-[#A3A3A3]">{addr?.full_name}</p>
            <p className="text-sm text-[#A3A3A3]">{addr?.line1}{addr?.line2 ? `, ${addr.line2}` : ""}</p>
            <p className="text-sm text-[#A3A3A3]">{addr?.city}, {addr?.state} — {addr?.pincode}</p>
            {addr?.phone && <p className="text-sm text-[#A3A3A3]">{addr.phone}</p>}
          </div>

          <div className="rounded-lg border border-[#262626] bg-[#161616] p-5 space-y-2">
            <h3 className="mb-2 text-sm font-semibold text-[#F5F5F5]">Payment</h3>
            <p className="text-xs text-[#A3A3A3]">Status: <span className="text-[#22C55E]">{order.payment_status}</span></p>
            {order.razorpay_payment_id && (
              <p className="text-xs text-[#525252] font-mono break-all">Pay ID: {order.razorpay_payment_id}</p>
            )}
            {order.razorpay_order_id && (
              <p className="text-xs text-[#525252] font-mono break-all">Order ID: {order.razorpay_order_id}</p>
            )}
            {order.gstin && (
              <div className="pt-1 border-t border-[#262626]">
                <p className="text-xs text-[#A3A3A3]">GSTIN: <span className="font-mono">{order.gstin}</span></p>
                {order.business_name && <p className="text-xs text-[#A3A3A3]">{order.business_name}</p>}
              </div>
            )}
          </div>

          {/* Tracking info */}
          {(order.courier_name || order.tracking_number) && (
            <div className="rounded-lg border border-[#262626] bg-[#161616] p-5 space-y-2">
              <h3 className="mb-2 text-sm font-semibold text-[#F5F5F5]">Shipment</h3>
              {order.courier_name && <p className="text-sm text-[#A3A3A3]">{order.courier_name}</p>}
              {order.tracking_number && (
                <p className="text-sm font-mono text-[#F97316]">AWB: {order.tracking_number}</p>
              )}
              {order.tracking_url && (
                <a href={order.tracking_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-[#F97316] hover:underline">
                  Track Shipment <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
              {order.shipped_at && (
                <p className="text-xs text-[#525252]">Shipped: {fmt(order.shipped_at)}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
