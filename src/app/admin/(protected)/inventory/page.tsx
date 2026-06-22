"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Search, X, Package, AlertTriangle, CheckCircle, XCircle,
  RefreshCw, TrendingDown, TrendingUp, Minus,
  ChevronUp, ChevronDown, ChevronsUpDown, ChevronRight,
} from "lucide-react";

interface ProductInventory {
  id: string;
  name: string;
  sku: string | null;
  slug: string;
  stock_count: number;
  in_stock: boolean;
  price: number;
}

interface InventoryEvent {
  id: string;
  product_id: string;
  event_type: string;
  quantity_change: number;
  reference_id: string | null;
  notes: string | null;
  created_at: string;
  products: { name: string; id: string } | null;
}

type FilterType = "all" | "low" | "out";
type SortField = "name" | "stock_count" | "price";
type SortDir = "asc" | "desc";

interface AdjustModal {
  product: ProductInventory;
  action: "add" | "remove" | "set";
  quantity: string;
  note: string;
}

const PAGE_SIZES = [10, 25, 50] as const;

const EVENT_ICON: Record<string, React.ElementType> = {
  sale: TrendingDown, cancel: TrendingUp, restock: TrendingUp, adjustment: Minus,
};
const EVENT_COLOR: Record<string, string> = {
  sale: "text-[#EF4444]", cancel: "text-[#22C55E]", restock: "text-[#22C55E]", adjustment: "text-[#F59E0B]",
};
const EVENT_LABEL: Record<string, string> = {
  sale: "Sale", cancel: "Cancelled", restock: "Restock", adjustment: "Adjustment",
};

function inr(n: number) { return `₹${Number(n ?? 0).toLocaleString("en-IN")}`; }
function fmt(ts: string) {
  return new Date(ts).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}
function stockStatus(stock: number, threshold: number): "ok" | "low" | "out" {
  if (stock <= 0) return "out";
  if (stock <= threshold) return "low";
  return "ok";
}

function SortIcon({ field, sortBy, sortDir }: { field: SortField; sortBy: SortField; sortDir: SortDir }) {
  if (sortBy !== field) return <ChevronsUpDown className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-opacity" />;
  return sortDir === "asc" ? <ChevronUp className="w-3 h-3 text-[#F97316]" /> : <ChevronDown className="w-3 h-3 text-[#F97316]" />;
}

function EventDetailModal({ event, onClose }: { event: InventoryEvent; onClose: () => void }) {
  const Icon = EVENT_ICON[event.event_type] ?? Minus;
  const color = EVENT_COLOR[event.event_type] ?? "text-[#A3A3A3]";
  const label = EVENT_LABEL[event.event_type] ?? event.event_type;
  const productId = event.products?.id ?? event.product_id;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-[#161616] border border-[#262626] rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#262626]">
          <div className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${color}`} />
            <h3 className="text-sm font-semibold text-[#F5F5F5]">{label}</h3>
          </div>
          <button onClick={onClose} className="text-[#525252] hover:text-[#F5F5F5]"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          {event.products?.name && (
            <div>
              <p className="text-xs text-[#525252] font-mono uppercase mb-1">Product</p>
              <Link href={`/admin/products/${productId}?tab=ledger`} onClick={onClose} className="text-sm text-[#F97316] hover:underline">
                {event.products.name} →
              </Link>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[#525252] font-mono uppercase">Qty Change</p>
              <p className={`text-2xl font-mono font-bold mt-1 ${color}`}>
                {event.quantity_change > 0 ? "+" : ""}{event.quantity_change}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#525252] font-mono uppercase">Date & Time</p>
              <p className="text-sm text-[#F5F5F5] mt-1">{fmt(event.created_at)}</p>
            </div>
          </div>
          {event.reference_id && (
            <div>
              <p className="text-xs text-[#525252] font-mono uppercase mb-1">Reference</p>
              {event.event_type === "sale" || event.event_type === "cancel" ? (
                <Link href={`/admin/orders/${event.reference_id}`} className="text-sm font-mono text-[#F97316] hover:underline" onClick={onClose}>
                  {event.reference_id} →
                </Link>
              ) : (
                <p className="text-sm font-mono text-[#F5F5F5]">{event.reference_id}</p>
              )}
            </div>
          )}
          {event.notes && (
            <div>
              <p className="text-xs text-[#525252] font-mono uppercase mb-1">Notes</p>
              <p className="text-sm text-[#A3A3A3]">{event.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<ProductInventory[]>([]);
  const [events, setEvents] = useState<InventoryEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({ low: 0, out: 0 });
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<typeof PAGE_SIZES[number]>(25);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [inlineEdit, setInlineEdit] = useState<{ id: string; value: string } | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [modal, setModal] = useState<AdjustModal | null>(null);
  const [modalSaving, setModalSaving] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<InventoryEvent | null>(null);
  const [eventsOpen, setEventsOpen] = useState(false);
  const inlineRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  const totalPages = Math.ceil(total / pageSize);

  const load = useCallback(async (
    p: number, ps: number, q: string, f: FilterType, sb: SortField, sd: SortDir,
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(p), pageSize: String(ps),
        sortBy: sb, sortDir: sd,
      });
      if (q) params.set("search", q);
      if (f !== "all") params.set("filter", f);
      const res = await fetch(`/api/admin/inventory?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products ?? []);
        setTotal(data.total ?? 0);
        setSummary(data.summary ?? { low: 0, out: 0 });
        setLowStockThreshold(data.lowStockThreshold ?? 5);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadEvents = useCallback(async () => {
    const res = await fetch("/api/admin/inventory/events");
    if (res.ok) {
      const data = await res.json();
      setEvents(data.events ?? []);
    }
  }, []);

  useEffect(() => {
    load(page, pageSize, search, filter, sortBy, sortDir);
  }, [load, page, pageSize, search, filter, sortBy, sortDir]);

  useEffect(() => {
    if (eventsOpen && events.length === 0) loadEvents();
  }, [eventsOpen, events.length, loadEvents]);

  useEffect(() => {
    if (inlineEdit && inlineRef.current) inlineRef.current.focus();
  }, [inlineEdit]);

  function handleSearchInput(val: string) {
    setSearchInput(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      setSearch(val.trim());
    }, 300);
  }

  function handleSort(field: SortField) {
    if (sortBy === field) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDir(field === "stock_count" ? "asc" : "asc");
    }
    setPage(1);
  }

  function handleFilterChange(f: FilterType) {
    setFilter(f);
    setPage(1);
  }

  async function saveInline(productId: string, newStock: number) {
    setSavingId(productId);
    try {
      const res = await fetch("/api/admin/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, action: "set", quantity: newStock, note: "Inline edit" }),
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(prev => prev.map(p => p.id === productId
          ? { ...p, stock_count: data.stock_count, in_stock: data.stock_count > 0 } : p));
        setEvents([]); // reset so events reload when expanded next time
      }
    } finally {
      setSavingId(null);
      setInlineEdit(null);
    }
  }

  async function handleModalSave() {
    if (!modal) return;
    const qty = parseInt(modal.quantity);
    if (isNaN(qty) || qty < 0) return;
    setModalSaving(true);
    try {
      const res = await fetch("/api/admin/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: modal.product.id, action: modal.action, quantity: qty, note: modal.note || undefined }),
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(prev => prev.map(p => p.id === modal.product.id
          ? { ...p, stock_count: data.stock_count, in_stock: data.stock_count > 0 } : p));
        setModal(null);
        setEvents([]);
        // Refresh summary
        load(page, pageSize, search, filter, sortBy, sortDir);
      }
    } finally {
      setModalSaving(false);
    }
  }

  const SortableHeader = ({ field, label, className }: { field: SortField; label: string; className?: string }) => (
    <th
      className={`px-4 py-3 text-xs font-mono text-[#525252] uppercase tracking-wider whitespace-nowrap cursor-pointer select-none group ${className ?? "text-left"}`}
      onClick={() => handleSort(field)}
    >
      <div className={`flex items-center gap-1 ${className?.includes("text-right") ? "justify-end" : className?.includes("text-center") ? "justify-center" : ""}`}>
        {label} <SortIcon field={field} sortBy={sortBy} sortDir={sortDir} />
      </div>
    </th>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold font-mono text-[#F5F5F5]">Inventory</h1>
          <p className="text-sm text-[#525252] mt-0.5">{total} products</p>
        </div>
        <button
          onClick={() => load(page, pageSize, search, filter, sortBy, sortDir)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#262626] px-3 py-2 text-xs text-[#A3A3A3] hover:border-[#F97316] hover:text-[#F97316] transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => handleFilterChange("all")}
          className={`rounded-lg border p-4 text-left transition-colors ${filter === "all" ? "border-[#F97316] bg-[#F97316]/10" : "border-[#262626] bg-[#161616] hover:border-[#F97316]/50"}`}
        >
          <p className="text-xs text-[#525252] font-mono uppercase">Total</p>
          <p className="text-2xl font-bold font-mono text-[#F5F5F5] mt-1">{total}</p>
          <p className="text-xs text-[#525252] mt-0.5">products</p>
        </button>
        <button
          onClick={() => handleFilterChange("low")}
          className={`rounded-lg border p-4 text-left transition-colors ${filter === "low" ? "border-[#F59E0B] bg-[#F59E0B]/10" : "border-[#262626] bg-[#161616] hover:border-[#F59E0B]/50"}`}
        >
          <p className="text-xs text-[#525252] font-mono uppercase">Low Stock</p>
          <p className="text-2xl font-bold font-mono text-[#F59E0B] mt-1">{summary.low}</p>
          <p className="text-xs text-[#525252] mt-0.5">≤ {lowStockThreshold} units</p>
        </button>
        <button
          onClick={() => handleFilterChange("out")}
          className={`rounded-lg border p-4 text-left transition-colors ${filter === "out" ? "border-[#EF4444] bg-[#EF4444]/10" : "border-[#262626] bg-[#161616] hover:border-[#EF4444]/50"}`}
        >
          <p className="text-xs text-[#525252] font-mono uppercase">Out of Stock</p>
          <p className="text-2xl font-bold font-mono text-[#EF4444] mt-1">{summary.out}</p>
          <p className="text-xs text-[#525252] mt-0.5">0 units</p>
        </button>
      </div>

      {/* Search + page size */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#525252]" />
          <input
            value={searchInput}
            onChange={e => handleSearchInput(e.target.value)}
            placeholder="Search by name or SKU…"
            className="w-full bg-[#161616] border border-[#262626] rounded-lg pl-9 pr-9 py-2.5 text-sm text-[#F5F5F5] placeholder:text-[#525252] focus:outline-none focus:border-[#F97316]"
          />
          {searchInput && (
            <button onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#525252] hover:text-[#F5F5F5]">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-[#525252]">
          <span className="text-xs">Rows:</span>
          <select
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value) as typeof PAGE_SIZES[number]); setPage(1); }}
            className="bg-[#161616] border border-[#262626] rounded-lg px-2 py-1.5 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#F97316]"
          >
            {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Products table */}
      <div className="bg-[#161616] border border-[#262626] rounded-lg overflow-hidden">
        {loading ? (
          <div className="divide-y divide-[#1A1A1A]">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="px-4 py-3 flex items-center gap-4">
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-[#262626] rounded w-56 animate-pulse" />
                  <div className="h-3 bg-[#1A1A1A] rounded w-24 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Package className="w-10 h-10 text-[#525252] mb-3" />
            <p className="text-sm text-[#525252]">No products match the current filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-[#262626] bg-[#111111]">
                  <SortableHeader field="name" label="Product" />
                  <th className="px-4 py-3 text-left text-xs font-mono text-[#525252] uppercase tracking-wider whitespace-nowrap">SKU</th>
                  <SortableHeader field="stock_count" label="Stock" className="text-center" />
                  <SortableHeader field="price" label="Price" className="text-right" />
                  <th className="px-4 py-3 text-center text-xs font-mono text-[#525252] uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-mono text-[#525252] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A]">
                {products.map(p => {
                  const status = stockStatus(p.stock_count, lowStockThreshold);
                  return (
                    <tr
                      key={p.id}
                      className={`transition-colors hover:bg-[#1A1A1A] ${status === "out" ? "bg-[#EF4444]/5" : status === "low" ? "bg-[#F59E0B]/5" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <Link href={`/admin/products/${p.id}`} className="font-medium text-[#F5F5F5] hover:text-[#F97316] transition-colors">
                          {p.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-[#525252] font-mono text-xs">{p.sku ?? "—"}</td>
                      <td className="px-4 py-3 text-center">
                        {inlineEdit?.id === p.id ? (
                          <div className="flex items-center justify-center gap-1">
                            <input
                              ref={inlineRef}
                              type="number" min={0}
                              value={inlineEdit.value}
                              onChange={e => setInlineEdit({ id: p.id, value: e.target.value })}
                              onKeyDown={e => {
                                if (e.key === "Enter") { const n = parseInt(inlineEdit.value); if (!isNaN(n) && n >= 0) saveInline(p.id, n); }
                                if (e.key === "Escape") setInlineEdit(null);
                              }}
                              className="w-16 bg-[#0A0A0A] border border-[#F97316] rounded px-2 py-1 text-sm text-[#F5F5F5] text-center focus:outline-none"
                            />
                            <button onClick={() => { const n = parseInt(inlineEdit.value); if (!isNaN(n) && n >= 0) saveInline(p.id, n); }} disabled={savingId === p.id} className="text-[#22C55E] hover:text-[#16A34A] text-xs disabled:opacity-50">
                              {savingId === p.id ? "…" : "✓"}
                            </button>
                            <button onClick={() => setInlineEdit(null)} className="text-[#525252] hover:text-[#F5F5F5] text-xs">✕</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setInlineEdit({ id: p.id, value: String(p.stock_count) })}
                            className="font-mono font-bold text-[#F5F5F5] hover:text-[#F97316] transition-colors hover:underline underline-offset-2"
                            title="Click to edit inline"
                          >
                            {p.stock_count}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-[#A3A3A3] font-mono text-xs">{inr(p.price)}</td>
                      <td className="px-4 py-3 text-center">
                        {status === "out" ? (
                          <span className="inline-flex items-center gap-1 text-xs text-[#EF4444]"><XCircle className="w-3.5 h-3.5" /> Out</span>
                        ) : status === "low" ? (
                          <span className="inline-flex items-center gap-1 text-xs text-[#F59E0B]"><AlertTriangle className="w-3.5 h-3.5" /> Low</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-[#22C55E]"><CheckCircle className="w-3.5 h-3.5" /> OK</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setModal({ product: p, action: "add", quantity: "", note: "" })}
                            className="rounded-md border border-[#262626] px-2.5 py-1.5 text-xs text-[#A3A3A3] hover:border-[#F97316] hover:text-[#F97316] transition-colors"
                          >
                            Adjust
                          </button>
                          <Link
                            href={`/admin/products/${p.id}#ledger`}
                            className="rounded-md border border-[#262626] px-2.5 py-1.5 text-xs text-[#A3A3A3] hover:border-[#F97316] hover:text-[#F97316] transition-colors"
                          >
                            Ledger
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-[#525252]">
            {total === 0 ? "No products" : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}`}
          </p>
          {totalPages > 1 && (
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-xs rounded-lg border border-[#262626] text-[#A3A3A3] hover:border-[#F97316] hover:text-[#F97316] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Prev
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const n = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                return n <= totalPages ? (
                  <button key={n} onClick={() => setPage(n)}
                    className={`w-8 h-8 rounded-lg text-xs font-mono transition-colors ${n === page ? "bg-[#F97316] text-white" : "text-[#A3A3A3] hover:bg-[#1E1E1E] border border-[#262626]"}`}
                  >{n}</button>
                ) : null;
              })}
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-xs rounded-lg border border-[#262626] text-[#A3A3A3] hover:border-[#F97316] hover:text-[#F97316] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Recent Inventory Events — collapsible */}
      <div className="bg-[#161616] border border-[#262626] rounded-lg overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#1A1A1A] transition-colors"
          onClick={() => setEventsOpen(o => !o)}
        >
          <div>
            <h2 className="text-sm font-semibold text-[#F5F5F5] text-left">Recent Inventory Events</h2>
            <p className="text-xs text-[#525252] mt-0.5 text-left">Click to {eventsOpen ? "collapse" : "expand"}</p>
          </div>
          <ChevronRight className={`w-4 h-4 text-[#525252] transition-transform ${eventsOpen ? "rotate-90" : ""}`} />
        </button>

        {eventsOpen && (
          events.length === 0 ? (
            <div className="border-t border-[#262626] py-10 text-center text-sm text-[#525252]">No inventory events yet.</div>
          ) : (
            <div className="border-t border-[#262626] overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1A1A1A] text-left text-xs uppercase tracking-wider text-[#525252]">
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium text-right">Qty</th>
                    <th className="px-4 py-3 font-medium">Reference</th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1A]">
                  {events.map(ev => {
                    const Icon = EVENT_ICON[ev.event_type] ?? Minus;
                    const color = EVENT_COLOR[ev.event_type] ?? "text-[#A3A3A3]";
                    return (
                      <tr key={ev.id} onClick={() => setSelectedEvent(ev)} className="hover:bg-[#1A1A1A] transition-colors cursor-pointer">
                        <td className="px-4 py-3">
                          {ev.products ? (
                            <Link href={`/admin/products/${ev.product_id}`} onClick={e => e.stopPropagation()} className="text-[#F5F5F5] hover:text-[#F97316] transition-colors text-sm">
                              {ev.products.name}
                            </Link>
                          ) : (
                            <span className="text-[#525252] font-mono text-xs">{ev.product_id}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Icon className={`w-3.5 h-3.5 ${color}`} />
                            <span className={`text-xs font-mono ${color}`}>{EVENT_LABEL[ev.event_type] ?? ev.event_type}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold">
                          <span className={ev.quantity_change >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"}>
                            {ev.quantity_change >= 0 ? "+" : ""}{ev.quantity_change}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#525252] font-mono text-xs">{ev.reference_id ?? "—"}</td>
                        <td className="px-4 py-3 text-[#525252] text-xs whitespace-nowrap">{fmt(ev.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Adjust Stock Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setModal(null)} />
          <div className="relative bg-[#161616] border border-[#262626] rounded-xl p-6 w-full max-w-md space-y-5 shadow-2xl">
            <div>
              <h3 className="text-base font-semibold text-[#F5F5F5]">Adjust Stock</h3>
              <p className="text-sm text-[#525252] mt-0.5 truncate">{modal.product.name}</p>
              <p className="text-xs text-[#525252] mt-0.5">
                Current: <span className="text-[#F97316] font-mono font-bold">{modal.product.stock_count}</span> units
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[#A3A3A3] font-mono uppercase tracking-wider">Action</label>
              <div className="flex gap-2">
                {(["add", "remove", "set"] as const).map(a => (
                  <button key={a} onClick={() => setModal(m => m ? { ...m, action: a } : m)}
                    className={`flex-1 rounded-lg border py-2 text-xs transition-colors ${modal.action === a ? "border-[#F97316] text-[#F97316] bg-[#F97316]/10" : "border-[#262626] text-[#A3A3A3] hover:border-[#F97316]"}`}
                  >
                    {a === "add" ? "Add" : a === "remove" ? "Remove" : "Set to"}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[#A3A3A3] font-mono uppercase tracking-wider">
                {modal.action === "set" ? "New Stock Count" : "Quantity"}
              </label>
              <input
                type="number" min={0}
                value={modal.quantity}
                onChange={e => setModal(m => m ? { ...m, quantity: e.target.value } : m)}
                placeholder="0"
                className="w-full bg-[#111111] border border-[#262626] rounded-lg px-3 py-2.5 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#F97316]"
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[#A3A3A3] font-mono uppercase tracking-wider">Note (optional)</label>
              <input
                type="text"
                value={modal.note}
                onChange={e => setModal(m => m ? { ...m, note: e.target.value } : m)}
                placeholder="e.g. Received new batch"
                className="w-full bg-[#111111] border border-[#262626] rounded-lg px-3 py-2.5 text-sm text-[#F5F5F5] placeholder:text-[#525252] focus:outline-none focus:border-[#F97316]"
              />
            </div>
            {modal.action !== "set" && modal.quantity && !isNaN(parseInt(modal.quantity)) && (
              <p className="text-xs text-[#525252]">
                New stock:{" "}
                <span className="text-[#F97316] font-mono font-bold">
                  {modal.action === "add"
                    ? modal.product.stock_count + parseInt(modal.quantity)
                    : Math.max(0, modal.product.stock_count - parseInt(modal.quantity))}
                </span>
              </p>
            )}
            <div className="flex gap-3 pt-1">
              <button onClick={() => setModal(null)} className="flex-1 rounded-lg border border-[#262626] py-2.5 text-sm text-[#A3A3A3] hover:text-[#F5F5F5] transition-colors">
                Cancel
              </button>
              <button
                onClick={handleModalSave}
                disabled={modalSaving || !modal.quantity || isNaN(parseInt(modal.quantity)) || parseInt(modal.quantity) < 0}
                className="flex-1 rounded-lg bg-[#F97316] hover:bg-[#EA6C0A] py-2.5 text-sm text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {modalSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedEvent && <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
    </div>
  );
}
