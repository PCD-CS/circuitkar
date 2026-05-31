"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, X, Package, AlertTriangle, CheckCircle, XCircle, RefreshCw } from "lucide-react";

interface ProductInventory {
  id: string;
  name: string;
  sku: string | null;
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
  products: { name: string } | null;
}

type FilterType = "all" | "low" | "out";

interface AdjustModal {
  product: ProductInventory;
  direction: "add" | "remove" | "set";
  quantity: string;
  note: string;
}

function inr(n: number) {
  return `₹${Number(n ?? 0).toLocaleString("en-IN")}`;
}

function stockStatus(stock: number, threshold: number): "ok" | "low" | "out" {
  if (stock <= 0) return "out";
  if (stock <= threshold) return "low";
  return "ok";
}

const EVENT_TYPE_LABEL: Record<string, string> = {
  sale: "Sale",
  cancel: "Cancelled",
  restock: "Restock",
  adjustment: "Adjustment",
};

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<ProductInventory[]>([]);
  const [events, setEvents] = useState<InventoryEvent[]>([]);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [inlineEdit, setInlineEdit] = useState<{ id: string; value: string } | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [modal, setModal] = useState<AdjustModal | null>(null);
  const [modalSaving, setModalSaving] = useState(false);
  const inlineRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/inventory");
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products ?? []);
        setEvents(data.events ?? []);
        setLowStockThreshold(data.lowStockThreshold ?? 5);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput.trim()); }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (inlineEdit && inlineRef.current) inlineRef.current.focus();
  }, [inlineEdit]);

  const filtered = products.filter((p) => {
    if (search) {
      const q = search.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !(p.sku ?? "").toLowerCase().includes(q)) return false;
    }
    const status = stockStatus(p.stock_count, lowStockThreshold);
    if (filter === "low" && status !== "low") return false;
    if (filter === "out" && status !== "out") return false;
    return true;
  });

  async function saveInline(productId: string, newStock: number) {
    setSavingId(productId);
    try {
      const res = await fetch("/api/admin/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, direction: "set", stock_count: newStock, note: "Inline edit" }),
      });
      if (res.ok) {
        const data = await res.json();
        setProducts((prev) => prev.map((p) => p.id === productId ? { ...p, ...data.product } : p));
      }
    } finally {
      setSavingId(null);
      setInlineEdit(null);
    }
  }

  async function toggleInStock(product: ProductInventory) {
    setSavingId(product.id);
    try {
      const res = await fetch("/api/admin/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, in_stock: !product.in_stock }),
      });
      if (res.ok) {
        const data = await res.json();
        setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, ...data.product } : p));
      }
    } finally {
      setSavingId(null);
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
        body: JSON.stringify({
          productId: modal.product.id,
          direction: modal.direction,
          stock_count: qty,
          note: modal.note || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setProducts((prev) => prev.map((p) => p.id === modal.product.id ? { ...p, ...data.product } : p));
        setModal(null);
        // Reload events
        load();
      }
    } finally {
      setModalSaving(false);
    }
  }

  const lowCount = products.filter((p) => stockStatus(p.stock_count, lowStockThreshold) === "low").length;
  const outCount = products.filter((p) => p.stock_count <= 0).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold font-mono text-[#F5F5F5]">Inventory</h1>
          <p className="text-sm text-[#525252] mt-1">
            {products.length} products &middot;{" "}
            <span className="text-[#F59E0B]">{lowCount} low stock</span>{" "}
            &middot;{" "}
            <span className="text-[#EF4444]">{outCount} out of stock</span>
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#262626] px-3 py-2 text-xs text-[#A3A3A3] hover:border-[#F97316] hover:text-[#F97316] transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#525252]" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by product name or SKU…"
            className="w-full bg-[#111111] border border-[#262626] rounded-lg pl-9 pr-9 py-2.5 text-sm text-[#F5F5F5] placeholder:text-[#525252] focus:outline-none focus:border-[#F97316]"
          />
          {searchInput && (
            <button onClick={() => setSearchInput("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#525252] hover:text-[#F5F5F5]">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {(["all", "low", "out"] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg border px-3 py-2 text-xs transition-colors ${
                filter === f
                  ? "border-[#F97316] text-[#F97316] bg-[#F97316]/10"
                  : "border-[#262626] text-[#A3A3A3] hover:border-[#F97316] hover:text-[#F97316]"
              }`}
            >
              {f === "all" ? "All" : f === "low" ? "Low Stock" : "Out of Stock"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#161616] border border-[#262626] rounded-lg overflow-hidden">
        {loading ? (
          <div className="py-24 text-center text-sm text-[#525252]">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-[#1E1E1E] flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-[#525252]" />
            </div>
            <p className="text-sm text-[#525252]">No products match the filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#262626] text-left text-xs uppercase tracking-wider text-[#525252]">
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">SKU</th>
                  <th className="px-4 py-3 font-medium text-center">Stock</th>
                  <th className="px-4 py-3 font-medium text-center">In Stock</th>
                  <th className="px-4 py-3 font-medium text-right">Price</th>
                  <th className="px-4 py-3 font-medium text-center">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A]">
                {filtered.map((p) => {
                  const status = stockStatus(p.stock_count, lowStockThreshold);
                  const rowClass =
                    status === "out"
                      ? "hover:bg-[#1A1A1A] bg-[#EF4444]/5 transition-colors"
                      : status === "low"
                      ? "hover:bg-[#1A1A1A] bg-[#F59E0B]/5 transition-colors"
                      : "hover:bg-[#1A1A1A] transition-colors";

                  return (
                    <tr key={p.id} className={rowClass}>
                      <td className="px-4 py-3">
                        <p className="text-[#F5F5F5] font-medium">{p.name}</p>
                      </td>
                      <td className="px-4 py-3 text-[#525252] font-mono text-xs">
                        {p.sku ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {inlineEdit?.id === p.id ? (
                          <div className="flex items-center justify-center gap-1">
                            <input
                              ref={inlineRef}
                              type="number"
                              min={0}
                              value={inlineEdit.value}
                              onChange={(e) => setInlineEdit({ id: p.id, value: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  const n = parseInt(inlineEdit.value);
                                  if (!isNaN(n) && n >= 0) saveInline(p.id, n);
                                }
                                if (e.key === "Escape") setInlineEdit(null);
                              }}
                              className="w-16 bg-[#0A0A0A] border border-[#F97316] rounded px-2 py-1 text-sm text-[#F5F5F5] text-center focus:outline-none"
                            />
                            <button
                              onClick={() => {
                                const n = parseInt(inlineEdit.value);
                                if (!isNaN(n) && n >= 0) saveInline(p.id, n);
                              }}
                              disabled={savingId === p.id}
                              className="text-[#22C55E] hover:text-[#16A34A] text-xs disabled:opacity-50"
                            >
                              {savingId === p.id ? "…" : "Save"}
                            </button>
                            <button onClick={() => setInlineEdit(null)} className="text-[#525252] hover:text-[#F5F5F5] text-xs">
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setInlineEdit({ id: p.id, value: String(p.stock_count) })}
                            className="font-mono font-bold text-[#F5F5F5] hover:text-[#F97316] transition-colors underline-offset-2 hover:underline"
                          >
                            {p.stock_count}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleInStock(p)}
                          disabled={savingId === p.id}
                          className={`w-10 h-5 rounded-full relative transition-colors disabled:opacity-50 ${
                            p.in_stock ? "bg-[#22C55E]" : "bg-[#262626]"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                              p.in_stock ? "translate-x-5" : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right text-[#A3A3A3] font-mono">
                        {inr(p.price)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {status === "out" ? (
                          <span className="inline-flex items-center gap-1 text-xs text-[#EF4444]">
                            <XCircle className="w-3.5 h-3.5" /> Out of stock
                          </span>
                        ) : status === "low" ? (
                          <span className="inline-flex items-center gap-1 text-xs text-[#F59E0B]">
                            <AlertTriangle className="w-3.5 h-3.5" /> Low stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-[#22C55E]">
                            <CheckCircle className="w-3.5 h-3.5" /> OK
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() =>
                            setModal({ product: p, direction: "add", quantity: "", note: "" })
                          }
                          className="inline-flex items-center gap-1 rounded-md border border-[#262626] px-2.5 py-1.5 text-xs text-[#A3A3A3] hover:border-[#F97316] hover:text-[#F97316] transition-colors"
                        >
                          Adjust Stock
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

      {/* Inventory Events Log */}
      <div className="bg-[#161616] border border-[#262626] rounded-lg">
        <div className="px-6 py-4 border-b border-[#262626]">
          <h2 className="text-sm font-semibold text-[#F5F5F5]">Recent Inventory Events</h2>
          <p className="text-xs text-[#525252] mt-0.5">Last 20 events</p>
        </div>
        {events.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#525252]">No inventory events yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1A1A1A] text-left text-xs uppercase tracking-wider text-[#525252]">
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium text-right">Qty Change</th>
                  <th className="px-4 py-3 font-medium">Reference</th>
                  <th className="px-4 py-3 font-medium">Notes</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A]">
                {events.map((ev) => (
                  <tr key={ev.id} className="hover:bg-[#1A1A1A] transition-colors">
                    <td className="px-4 py-3 text-[#F5F5F5]">
                      {ev.products?.name ?? ev.product_id}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-[#A3A3A3] font-mono">
                        {EVENT_TYPE_LABEL[ev.event_type] ?? ev.event_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold">
                      <span className={ev.quantity_change >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"}>
                        {ev.quantity_change >= 0 ? "+" : ""}{ev.quantity_change}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#525252] font-mono text-xs">
                      {ev.reference_id ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-[#A3A3A3] text-xs max-w-[200px] truncate">
                      {ev.notes ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-[#525252] text-xs whitespace-nowrap">
                      {new Date(ev.created_at).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                Current stock: <span className="text-[#F97316] font-mono font-bold">{modal.product.stock_count}</span>
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-[#A3A3A3] font-mono uppercase tracking-wider">Direction</label>
              <div className="flex gap-2">
                {(["add", "remove", "set"] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setModal((m) => m ? { ...m, direction: d } : m)}
                    className={`flex-1 rounded-lg border py-2 text-xs transition-colors ${
                      modal.direction === d
                        ? "border-[#F97316] text-[#F97316] bg-[#F97316]/10"
                        : "border-[#262626] text-[#A3A3A3] hover:border-[#F97316]"
                    }`}
                  >
                    {d === "add" ? "Add" : d === "remove" ? "Remove" : "Set to"}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-[#A3A3A3] font-mono uppercase tracking-wider">
                {modal.direction === "set" ? "New Stock Count" : "Quantity"}
              </label>
              <input
                type="number"
                min={0}
                value={modal.quantity}
                onChange={(e) => setModal((m) => m ? { ...m, quantity: e.target.value } : m)}
                placeholder="0"
                className="w-full bg-[#111111] border border-[#262626] rounded-lg px-3 py-2.5 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#F97316]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-[#A3A3A3] font-mono uppercase tracking-wider">Note (optional)</label>
              <input
                type="text"
                value={modal.note}
                onChange={(e) => setModal((m) => m ? { ...m, note: e.target.value } : m)}
                placeholder="e.g. Received new batch"
                className="w-full bg-[#111111] border border-[#262626] rounded-lg px-3 py-2.5 text-sm text-[#F5F5F5] placeholder:text-[#525252] focus:outline-none focus:border-[#F97316]"
              />
            </div>

            {modal.direction !== "set" && modal.quantity && !isNaN(parseInt(modal.quantity)) && (
              <p className="text-xs text-[#525252]">
                New stock will be:{" "}
                <span className="text-[#F97316] font-mono font-bold">
                  {modal.direction === "add"
                    ? modal.product.stock_count + parseInt(modal.quantity)
                    : Math.max(0, modal.product.stock_count - parseInt(modal.quantity))}
                </span>
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setModal(null)}
                className="flex-1 rounded-lg border border-[#262626] py-2.5 text-sm text-[#A3A3A3] hover:text-[#F5F5F5] transition-colors"
              >
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
    </div>
  );
}
