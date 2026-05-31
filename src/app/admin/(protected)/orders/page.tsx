"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ShoppingCart, Search, X, Eye, ChevronLeft, ChevronRight, Download, TestTube2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/Input";
import type { Order, OrderStatus } from "@/types";

const ALL_STATUSES: OrderStatus[] = [
  "pending", "confirmed", "accepted", "packed", "shipped", "delivered", "cancelled",
];

const VALID_TRANSITIONS: Record<string, OrderStatus[]> = {
  pending:   ["confirmed", "cancelled"],
  confirmed: ["accepted", "cancelled"],
  accepted:  ["packed",    "cancelled"],
  packed:    ["shipped",   "cancelled"],
  shipped:   ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

const STATUS_STYLE: Record<string, string> = {
  pending:   "bg-[#F59E0B]/10 text-[#F59E0B]  border-[#F59E0B]/40",
  confirmed: "bg-[#3B82F6]/10 text-[#3B82F6]  border-[#3B82F6]/40",
  accepted:  "bg-[#8B5CF6]/10 text-[#8B5CF6]  border-[#8B5CF6]/40",
  packed:    "bg-[#F97316]/10 text-[#F97316]  border-[#F97316]/40",
  shipped:   "bg-[#06B6D4]/10 text-[#06B6D4]  border-[#06B6D4]/40",
  delivered: "bg-[#22C55E]/10 text-[#22C55E]  border-[#22C55E]/40",
  cancelled: "bg-[#EF4444]/10 text-[#EF4444]  border-[#EF4444]/40",
};

function inr(n: number | null) {
  return `₹${Number(n ?? 0).toLocaleString("en-IN")}`;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [exportingCsv, setExportingCsv] = useState(false);
  // Shipping modal for "packed → shipped" transition
  const [shippingModal, setShippingModal] = useState<{ order: Order } | null>(null);
  const [shippingCourier, setShippingCourier] = useState("");
  const [shippingAwb, setShippingAwb] = useState("");
  const [shippingUrl, setShippingUrl] = useState("");

  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const load = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams({ page: String(page) });
    if (status) qs.set("status", status);
    if (search) qs.set("search", search);
    try {
      const res = await fetch(`/api/admin/orders?${qs.toString()}`);
      const data = await res.json();
      if (res.ok) { setOrders(data.orders ?? []); setTotal(data.total ?? 0); }
    } finally { setLoading(false); }
  }, [page, status, search]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  async function updateStatus(order: Order, newStatus: string, extraPayload?: Record<string, string>) {
    // Require shipping details before marking as shipped
    if (newStatus === "shipped" && !extraPayload) {
      setShippingCourier(""); setShippingAwb(""); setShippingUrl("");
      setShippingModal({ order });
      return;
    }
    setUpdatingId(order.id);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, ...extraPayload }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => o.id === order.id ? { ...o, status: newStatus as OrderStatus } : o),
        );
      }
    } finally { setUpdatingId(null); }
  }

  async function confirmShipping() {
    if (!shippingModal || !shippingCourier.trim() || !shippingAwb.trim()) return;
    const extra: Record<string, string> = {
      courier_name: shippingCourier.trim(),
      tracking_number: shippingAwb.trim(),
    };
    if (shippingUrl.trim()) extra.tracking_url = shippingUrl.trim();
    await updateStatus(shippingModal.order, "shipped", extra);
    setShippingModal(null);
  }

  async function exportCsv() {
    setExportingCsv(true);
    try {
      const qs = new URLSearchParams({ format: "csv" });
      if (status) qs.set("status", status);
      if (search) qs.set("search", search);
      const res = await fetch(`/api/admin/invoices/export?${qs}`);
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orders-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally { setExportingCsv(false); }
  }

  return (
    <div className="space-y-6">
      {/* Shipping modal */}
      {shippingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShippingModal(null)} />
          <div className="relative bg-[#161616] border border-[#262626] rounded-lg p-6 w-full max-w-md space-y-4">
            <h3 className="text-base font-semibold text-[#F5F5F5]">Add Shipping Details</h3>
            <p className="text-sm text-[#A3A3A3]">Required before marking order as Shipped.</p>
            <div className="flex items-start gap-2 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 text-[#F59E0B] flex-shrink-0 mt-0.5" />
              <span className="text-xs text-[#F59E0B]">Order: <strong>{shippingModal.order.order_number}</strong></span>
            </div>
            <Input label="Courier Name *" value={shippingCourier} onChange={e => setShippingCourier(e.target.value)} placeholder="DTDC, Delhivery, BlueDart…" />
            <Input label="AWB / Tracking Number *" value={shippingAwb} onChange={e => setShippingAwb(e.target.value)} placeholder="123456789" />
            <Input label="Tracking URL (optional)" value={shippingUrl} onChange={e => setShippingUrl(e.target.value)} placeholder="https://track.courier.com/..." />
            <div className="flex gap-3 pt-2">
              <button
                disabled={!shippingCourier.trim() || !shippingAwb.trim() || !!updatingId}
                onClick={confirmShipping}
                className="flex-1 bg-[#F97316] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#EA6C0A] disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                {updatingId ? "Saving…" : "Mark as Shipped"}
              </button>
              <button onClick={() => setShippingModal(null)} className="border border-[#262626] text-[#A3A3A3] rounded-lg px-4 py-2.5 text-sm hover:text-[#F5F5F5] transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold font-mono text-[#F5F5F5]">Orders</h1>
          <p className="text-sm text-[#525252] mt-1">{total} order{total === 1 ? "" : "s"} total</p>
        </div>
        <button
          onClick={exportCsv}
          disabled={exportingCsv}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#262626] px-3 py-2 text-xs text-[#A3A3A3] hover:border-[#F97316] hover:text-[#F97316] transition-colors disabled:opacity-50"
        >
          <Download className="h-3.5 w-3.5" />
          {exportingCsv ? "Exporting…" : "Export CSV"}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#525252]" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by order number, email or name…"
            className="w-full bg-[#111111] border border-[#262626] rounded-lg pl-9 pr-9 py-2.5 text-sm text-[#F5F5F5] placeholder:text-[#525252] focus:outline-none focus:border-[#F97316]"
          />
          {searchInput && (
            <button onClick={() => setSearchInput("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#525252] hover:text-[#F5F5F5]">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="bg-[#111111] border border-[#262626] rounded-lg px-3 py-2.5 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#F97316]"
        >
          <option value="">All statuses</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#161616] border border-[#262626] rounded-lg overflow-hidden">
        {loading ? (
          <div className="py-24 text-center text-sm text-[#525252]">Loading…</div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-[#1E1E1E] flex items-center justify-center mb-4">
              <ShoppingCart className="w-8 h-8 text-[#525252]" />
            </div>
            <p className="text-sm text-[#525252]">No orders found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#262626] text-left text-xs uppercase tracking-wider text-[#525252]">
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Items</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A]">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-[#1A1A1A] transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-mono text-[#F5F5F5] text-xs">{o.order_number}</p>
                      {o.is_test_order && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-[#F59E0B] font-mono mt-0.5">
                          <TestTube2 className="h-2.5 w-2.5" /> TEST
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[#F5F5F5]">{o.customer_name}</p>
                      <p className="text-xs text-[#525252]">{o.customer_email}</p>
                    </td>
                    <td className="px-4 py-3 text-[#A3A3A3] whitespace-nowrap text-xs">
                      {new Date(o.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-[#A3A3A3]">
                      {(o.items ?? []).reduce((n, it) => n + (it.qty || 0), 0)}
                    </td>
                    <td className="px-4 py-3 text-[#F97316] font-medium font-mono">
                      {inr(o.total)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-md border px-2 py-0.5 text-xs ${STATUS_STYLE[o.status] ?? "bg-[#262626] text-[#A3A3A3] border-[#262626]"}`}>
                        {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <select
                          value={o.status}
                          disabled={updatingId === o.id || (VALID_TRANSITIONS[o.status]?.length === 0)}
                          onChange={(e) => updateStatus(o, e.target.value)}
                          className="bg-[#111111] border border-[#262626] rounded-md px-2 py-1.5 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#F97316] disabled:opacity-50"
                        >
                          <option value={o.status}>{o.status.charAt(0).toUpperCase() + o.status.slice(1)} (current)</option>
                          {(VALID_TRANSITIONS[o.status] ?? []).map((s) => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                          ))}
                        </select>
                        <Link
                          href={`/admin/orders/${o.order_number}`}
                          className="inline-flex items-center gap-1 rounded-md border border-[#262626] px-2.5 py-1.5 text-xs text-[#A3A3A3] hover:border-[#F97316] hover:text-[#F97316] transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#525252]">
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total} orders
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-[#262626] px-3 py-1.5 text-xs text-[#A3A3A3] hover:text-[#F5F5F5] disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-[#262626] px-3 py-1.5 text-xs text-[#A3A3A3] hover:text-[#F5F5F5] disabled:opacity-40"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
