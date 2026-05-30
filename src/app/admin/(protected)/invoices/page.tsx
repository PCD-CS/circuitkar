"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Download, Eye, Search, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Order, OrderStatus } from "@/types";

const ALL_STATUSES: OrderStatus[] = [
  "pending", "confirmed", "accepted", "packed", "shipped", "delivered", "cancelled",
];

const STATUS_STYLE: Record<string, string> = {
  pending:   "text-[#F59E0B]  border-[#F59E0B]/40  bg-[#F59E0B]/10",
  confirmed: "text-[#3B82F6]  border-[#3B82F6]/40  bg-[#3B82F6]/10",
  accepted:  "text-[#8B5CF6]  border-[#8B5CF6]/40  bg-[#8B5CF6]/10",
  packed:    "text-[#F97316]  border-[#F97316]/40  bg-[#F97316]/10",
  shipped:   "text-[#06B6D4]  border-[#06B6D4]/40  bg-[#06B6D4]/10",
  delivered: "text-[#22C55E]  border-[#22C55E]/40  bg-[#22C55E]/10",
  cancelled: "text-[#EF4444]  border-[#EF4444]/40  bg-[#EF4444]/10",
};

function inr(n: number | null) {
  return `₹${Number(n ?? 0).toLocaleString("en-IN")}`;
}

export default function InvoicesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const pageSize = 25;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const load = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams({ page: String(page) });
    if (status) qs.set("status", status);
    if (search) qs.set("search", search);
    try {
      const res = await fetch(`/api/admin/orders?${qs}`);
      const data = await res.json();
      if (res.ok) { setOrders(data.orders ?? []); setTotal(data.total ?? 0); }
    } finally { setLoading(false); }
  }, [page, status, search]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  async function doExport(singleOrder?: Order) {
    setExporting(true);
    try {
      const qs = new URLSearchParams();
      if (singleOrder) {
        qs.set("search", singleOrder.order_number);
      } else {
        if (status) qs.set("status", status);
        if (search) qs.set("search", search);
        if (fromDate) qs.set("from", fromDate);
        if (toDate) qs.set("to", toDate);
      }
      const res = await fetch(`/api/admin/invoices/export?${qs}`);
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = singleOrder
        ? `invoice-${singleOrder.order_number}.csv`
        : `orders-${fromDate || "all"}-to-${toDate || new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally { setExporting(false); }
  }

  const totalRevenue = orders.reduce((s, o) => s + (o.total ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold font-mono text-[#F5F5F5]">Invoices &amp; Export</h1>
          <p className="text-sm text-[#525252] mt-1">{total} orders · {inr(totalRevenue)} shown</p>
        </div>
        <Button onClick={() => doExport()} loading={exporting}>
          <Download className="w-4 h-4" /> Export All to CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-[#161616] border border-[#262626] rounded-lg p-4 space-y-3">
        <p className="text-xs font-mono text-[#525252] uppercase tracking-wider">Filters &amp; Date Range</p>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#525252]" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Order number or email…"
              className="w-full bg-[#111111] border border-[#262626] rounded-lg pl-9 pr-9 py-2 text-sm text-[#F5F5F5] placeholder:text-[#525252] focus:outline-none focus:border-[#F97316]"
            />
            {searchInput && (
              <button onClick={() => setSearchInput("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#525252]">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="bg-[#111111] border border-[#262626] rounded-lg px-3 py-2 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#F97316]">
            <option value="">All statuses</option>
            {ALL_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <label className="text-xs text-[#525252]">From</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
              className="bg-[#111111] border border-[#262626] rounded-lg px-3 py-2 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#F97316]" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-[#525252]">To</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
              className="bg-[#111111] border border-[#262626] rounded-lg px-3 py-2 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#F97316]" />
          </div>
          {(fromDate || toDate) && (
            <button onClick={() => { setFromDate(""); setToDate(""); }}
              className="text-xs text-[#525252] hover:text-[#F97316]">Clear dates</button>
          )}
        </div>
        <p className="text-xs text-[#525252]">
          Date range applies to CSV export only. Table always shows latest 25 records.
        </p>
      </div>

      {/* Table */}
      <div className="bg-[#161616] border border-[#262626] rounded-lg overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-[#525252]">Loading…</div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="h-10 w-10 text-[#525252] mx-auto mb-3" />
            <p className="text-sm text-[#525252]">No invoices found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#262626] text-left text-xs uppercase tracking-wider text-[#525252]">
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">GST</th>
                  <th className="px-4 py-3 text-right">Export</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A]">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-[#1A1A1A] transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-[#F5F5F5]">{o.order_number}</td>
                    <td className="px-4 py-3 text-xs text-[#A3A3A3] whitespace-nowrap">
                      {new Date(o.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-[#F5F5F5]">{o.customer_name}</p>
                      <p className="text-xs text-[#525252]">{o.customer_email}</p>
                    </td>
                    <td className="px-4 py-3 text-[#A3A3A3]">
                      {(o.items ?? []).reduce((n, it) => n + (it.qty || 0), 0)} units
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[#F97316] font-medium">{inr(o.total)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-md border px-2 py-0.5 text-xs ${STATUS_STYLE[o.status] ?? ""}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#A3A3A3]">
                      {o.gstin ? <span className="text-[#22C55E]">Yes</span> : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => doExport(o)}
                          className="inline-flex items-center gap-1 rounded border border-[#262626] px-2 py-1 text-xs text-[#A3A3A3] hover:border-[#F97316] hover:text-[#F97316] transition-colors"
                        >
                          <Download className="h-3 w-3" /> CSV
                        </button>
                        <Link
                          href={`/admin/orders/${o.order_number}`}
                          className="inline-flex items-center gap-1 rounded border border-[#262626] px-2 py-1 text-xs text-[#A3A3A3] hover:border-[#F97316] hover:text-[#F97316] transition-colors"
                        >
                          <Eye className="h-3 w-3" /> View
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#525252]">{(page-1)*pageSize+1}–{Math.min(page*pageSize,total)} of {total}</span>
          <div className="flex gap-2">
            <button disabled={page<=1} onClick={() => setPage(p=>p-1)}
              className="rounded border border-[#262626] px-3 py-1.5 text-xs text-[#A3A3A3] hover:text-[#F5F5F5] disabled:opacity-40">← Prev</button>
            <button disabled={page>=totalPages} onClick={() => setPage(p=>p+1)}
              className="rounded border border-[#262626] px-3 py-1.5 text-xs text-[#A3A3A3] hover:text-[#F5F5F5] disabled:opacity-40">Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}
