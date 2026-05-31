"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import {
  ChevronLeft, Pencil, Package, TrendingDown, TrendingUp, Minus,
  ExternalLink, X, LayoutDashboard, ShoppingCart, BarChart3, Info,
} from "lucide-react";
import type { ProductWithCategory, OrderItem } from "@/types";

interface InventoryEvent {
  id: string;
  event_type: string;
  quantity_change: number;
  reference_id: string | null;
  notes: string | null;
  created_at: string;
}

interface OrderSummary {
  id: string;
  order_number: string;
  created_at: string;
  status: string;
  qty: number;
  revenue: number;
}

type Tab = "overview" | "orders" | "ledger" | "details";

function inr(n: number) { return `₹${Number(n).toLocaleString("en-IN")}`; }
function fmt(ts: string) {
  return new Date(ts).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtFull(ts: string) {
  return new Date(ts).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

const EVENT_ICON: Record<string, React.ElementType> = {
  sale: TrendingDown, cancel: TrendingUp, restock: TrendingUp, adjustment: Minus,
};
const EVENT_COLOR: Record<string, string> = {
  sale: "text-[#EF4444]", cancel: "text-[#22C55E]", restock: "text-[#22C55E]", adjustment: "text-[#F59E0B]",
};
const EVENT_LABEL: Record<string, string> = {
  sale: "Sale", cancel: "Cancelled Order", restock: "Restock", adjustment: "Adjustment",
};
const STATUS_COLOR: Record<string, string> = {
  pending:   "text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30",
  confirmed: "text-[#3B82F6] bg-[#3B82F6]/10 border-[#3B82F6]/30",
  accepted:  "text-[#8B5CF6] bg-[#8B5CF6]/10 border-[#8B5CF6]/30",
  packed:    "text-[#F97316] bg-[#F97316]/10 border-[#F97316]/30",
  shipped:   "text-[#06B6D4] bg-[#06B6D4]/10 border-[#06B6D4]/30",
  delivered: "text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/30",
  cancelled: "text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/30",
};

function EventDetailModal({ event, onClose }: { event: InventoryEvent; onClose: () => void }) {
  const Icon = EVENT_ICON[event.event_type] ?? Minus;
  const color = EVENT_COLOR[event.event_type] ?? "text-[#A3A3A3]";
  const label = EVENT_LABEL[event.event_type] ?? event.event_type;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-[#161616] border border-[#262626] rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#262626]">
          <div className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${color}`} />
            <h3 className="text-sm font-semibold text-[#F5F5F5]">{label}</h3>
          </div>
          <button onClick={onClose} className="text-[#525252] hover:text-[#F5F5F5]">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[#525252] font-mono uppercase">Qty Change</p>
              <p className={`text-2xl font-mono font-bold mt-1 ${color}`}>
                {event.quantity_change > 0 ? "+" : ""}{event.quantity_change}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#525252] font-mono uppercase">Date & Time</p>
              <p className="text-sm text-[#F5F5F5] mt-1">{fmtFull(event.created_at)}</p>
            </div>
          </div>
          {event.reference_id && (
            <div>
              <p className="text-xs text-[#525252] font-mono uppercase mb-1">Reference</p>
              {event.event_type === "sale" || event.event_type === "cancel" ? (
                <Link
                  href={`/admin/orders/${event.reference_id}`}
                  className="text-sm font-mono text-[#F97316] hover:underline"
                  onClick={onClose}
                >
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
          {!event.reference_id && !event.notes && (
            <p className="text-sm text-[#525252]">No additional details for this event.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>("overview");
  const [product, setProduct] = useState<ProductWithCategory | null>(null);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [events, setEvents] = useState<InventoryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<InventoryEvent | null>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");

  const load = useCallback(async () => {
    const [pRes, eRes, oRes] = await Promise.all([
      fetch(`/api/admin/products/${id}`),
      fetch(`/api/admin/inventory?productId=${id}`),
      fetch(`/api/admin/orders?search=&pageSize=200`),
    ]);
    if (pRes.ok) setProduct((await pRes.json()).product);
    if (eRes.ok) setEvents((await eRes.json()).events ?? []);
    if (oRes.ok) {
      const allOrders = (await oRes.json()).orders ?? [];
      const filtered: OrderSummary[] = allOrders
        .filter((o: { items: OrderItem[] }) => (o.items ?? []).some((it) => it.product_id === id))
        .map((o: { id: string; order_number: string; created_at: string; status: string; items: OrderItem[] }) => {
          const matching = (o.items ?? []).filter((it) => it.product_id === id);
          const qty = matching.reduce((s: number, it: OrderItem) => s + it.qty, 0);
          const revenue = matching.reduce((s: number, it: OrderItem) => s + it.price * it.qty, 0);
          return { id: o.id, order_number: o.order_number, created_at: o.created_at, status: o.status, qty, revenue };
        });
      setOrders(filtered);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F97316] border-t-transparent" />
    </div>
  );
  if (!product) return <div className="text-center py-24 text-[#525252]">Product not found.</div>;

  const activeOrders = orders.filter(o => o.status !== "cancelled");
  const totalRevenue = activeOrders.reduce((s, o) => s + o.revenue, 0);
  const totalUnitsSold = activeOrders.reduce((s, o) => s + o.qty, 0);

  const filteredOrders = orderStatusFilter === "all" ? orders : orders.filter(o => o.status === orderStatusFilter);
  const orderStatuses = ["all", ...Array.from(new Set(orders.map(o => o.status)))];

  const tabs: { key: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "orders", label: "Orders", icon: ShoppingCart, count: orders.length },
    { key: "ledger", label: "Stock Ledger", icon: BarChart3, count: events.length },
    { key: "details", label: "Details", icon: Info },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link href="/admin/products" className="inline-flex items-center gap-1 text-sm text-[#A3A3A3] hover:text-[#F5F5F5]">
          <ChevronLeft className="h-4 w-4" /> Products
        </Link>
        <span className="text-[#525252]">/</span>
        <span className="text-sm text-[#F5F5F5] truncate max-w-xs">{product.name}</span>
      </div>

      {/* Product header */}
      <div className="flex items-start gap-5 bg-[#161616] border border-[#262626] rounded-lg p-5">
        <div className="w-20 h-20 rounded-lg bg-[#1E1E1E] border border-[#262626] overflow-hidden flex-shrink-0">
          {product.images?.[0] ? (
            <Image src={product.images[0]} alt={product.name} width={80} height={80} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><Package className="w-8 h-8 text-[#525252]" /></div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-lg font-bold text-[#F5F5F5]">{product.name}</h1>
            <span className={`text-xs px-2 py-0.5 rounded border font-mono ${product.in_stock ? "text-[#22C55E] border-[#22C55E]/40 bg-[#22C55E]/10" : "text-[#EF4444] border-[#EF4444]/40 bg-[#EF4444]/10"}`}>
              {product.in_stock ? `In Stock (${product.stock_count} units)` : "Out of Stock"}
            </span>
            {!product.is_active && <span className="text-xs px-2 py-0.5 rounded border text-[#525252] border-[#262626]">Inactive</span>}
          </div>
          <p className="text-sm text-[#525252] mt-1">{product.sku ? `SKU: ${product.sku}` : ""}{product.category?.name ? ` · ${product.category.name}` : ""}</p>
          <p className="text-xl font-mono font-bold text-[#F97316] mt-2">{inr(product.price)}</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Link href={`/admin/products/${product.id}/edit`}>
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-[#262626] px-3 py-1.5 text-xs text-[#A3A3A3] hover:border-[#F97316] hover:text-[#F97316] transition-colors">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
          </Link>
          <Link href={`/products/${product.slug}`} target="_blank">
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-[#262626] px-3 py-1.5 text-xs text-[#A3A3A3] hover:border-[#F97316] hover:text-[#F97316] transition-colors">
              <ExternalLink className="h-3.5 w-3.5" /> View
            </button>
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Units Sold", value: totalUnitsSold.toLocaleString("en-IN"), sub: "excl. cancelled" },
          { label: "Total Revenue", value: inr(totalRevenue), sub: "excl. cancelled" },
          { label: "Orders", value: orders.length.toString(), sub: "all statuses" },
          { label: "Current Stock", value: product.stock_count.toString(), sub: product.in_stock ? "available" : "out of stock", accent: !product.in_stock },
        ].map(kpi => (
          <div key={kpi.label} className="bg-[#161616] border border-[#262626] rounded-lg p-4">
            <p className="text-xs text-[#525252] font-mono uppercase">{kpi.label}</p>
            <p className={`text-xl font-bold font-mono mt-1 ${kpi.accent ? "text-[#EF4444]" : "text-[#F5F5F5]"}`}>{kpi.value}</p>
            <p className="text-xs text-[#525252] mt-0.5">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Tab navigation */}
      <div className="border-b border-[#262626] flex gap-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.key ? "text-[#F97316]" : "text-[#A3A3A3] hover:text-[#F5F5F5]"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
            {t.count !== undefined && (
              <span className="text-xs bg-[#262626] text-[#A3A3A3] px-1.5 py-0.5 rounded font-mono">{t.count}</span>
            )}
            {tab === t.key && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#F97316]" />}
          </button>
        ))}
      </div>

      {/* ── Overview tab ── */}
      {tab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent orders */}
          <div className="bg-[#161616] border border-[#262626] rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#262626]">
              <h3 className="text-sm font-semibold text-[#F5F5F5]">Recent Orders</h3>
              {orders.length > 5 && (
                <button onClick={() => setTab("orders")} className="text-xs text-[#F97316] hover:underline">See all {orders.length} →</button>
              )}
            </div>
            {orders.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-[#525252]">No orders yet.</div>
            ) : (
              <div className="divide-y divide-[#1A1A1A]">
                {orders.slice(0, 5).map(o => (
                  <div key={o.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-[#1A1A1A] transition-colors">
                    <div>
                      <Link href={`/admin/orders/${o.order_number}`} className="text-sm font-mono text-[#F97316] hover:underline">{o.order_number}</Link>
                      <p className="text-xs text-[#525252] mt-0.5">{fmt(o.created_at)} · {o.qty} unit{o.qty !== 1 ? "s" : ""}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono text-[#F5F5F5]">{inr(o.revenue)}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded border ${STATUS_COLOR[o.status] ?? "text-[#A3A3A3] border-[#262626]"}`}>{o.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent stock events */}
          <div className="bg-[#161616] border border-[#262626] rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#262626]">
              <h3 className="text-sm font-semibold text-[#F5F5F5]">Recent Stock Events</h3>
              {events.length > 5 && (
                <button onClick={() => setTab("ledger")} className="text-xs text-[#F97316] hover:underline">See all {events.length} →</button>
              )}
            </div>
            {events.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-[#525252]">No inventory events yet.</div>
            ) : (
              <div className="divide-y divide-[#1A1A1A]">
                {events.slice(0, 5).map(ev => {
                  const Icon = EVENT_ICON[ev.event_type] ?? Minus;
                  const color = EVENT_COLOR[ev.event_type] ?? "text-[#A3A3A3]";
                  return (
                    <button
                      key={ev.id}
                      onClick={() => setSelectedEvent(ev)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#1A1A1A] transition-colors text-left"
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${color.replace("text-", "bg-").replace("]", "/15]")}`}>
                        <Icon className={`w-3.5 h-3.5 ${color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#F5F5F5] capitalize">{EVENT_LABEL[ev.event_type] ?? ev.event_type}</p>
                        {ev.reference_id && <p className="text-xs text-[#525252] font-mono truncate">{ev.reference_id}</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-sm font-mono font-bold ${color}`}>
                          {ev.quantity_change > 0 ? "+" : ""}{ev.quantity_change}
                        </p>
                        <p className="text-xs text-[#525252]">{fmt(ev.created_at)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Orders tab ── */}
      {tab === "orders" && (
        <div className="space-y-3">
          {/* Status filter */}
          <div className="flex flex-wrap gap-2">
            {orderStatuses.map(s => (
              <button
                key={s}
                onClick={() => setOrderStatusFilter(s)}
                className={`rounded-lg border px-3 py-1.5 text-xs capitalize transition-colors ${
                  orderStatusFilter === s
                    ? "border-[#F97316] text-[#F97316] bg-[#F97316]/10"
                    : "border-[#262626] text-[#A3A3A3] hover:border-[#F97316] hover:text-[#F97316]"
                }`}
              >
                {s === "all" ? `All (${orders.length})` : s}
              </button>
            ))}
          </div>

          <div className="bg-[#161616] border border-[#262626] rounded-lg overflow-hidden">
            {filteredOrders.length === 0 ? (
              <div className="py-16 text-center text-sm text-[#525252]">No orders match this filter.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#262626] text-left text-xs uppercase tracking-wider text-[#525252]">
                      <th className="px-4 py-3 font-medium">Order</th>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium text-center">Qty</th>
                      <th className="px-4 py-3 font-medium text-right">Revenue</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A1A1A]">
                    {filteredOrders.map(o => (
                      <tr key={o.id} className="hover:bg-[#1A1A1A] transition-colors">
                        <td className="px-4 py-3">
                          <Link href={`/admin/orders/${o.order_number}`} className="font-mono text-[#F97316] hover:underline text-sm">
                            {o.order_number}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#A3A3A3] whitespace-nowrap">{fmt(o.created_at)}</td>
                        <td className="px-4 py-3 text-center font-mono text-[#F5F5F5]">{o.qty}</td>
                        <td className="px-4 py-3 text-right font-mono text-[#F5F5F5]">{inr(o.revenue)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded border capitalize ${STATUS_COLOR[o.status] ?? "text-[#A3A3A3] border-[#262626]"}`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/admin/orders/${o.order_number}`}
                            className="text-xs text-[#A3A3A3] hover:text-[#F97316] hover:underline transition-colors"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Stock Ledger tab ── */}
      {tab === "ledger" && (
        <div className="bg-[#161616] border border-[#262626] rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-[#262626] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#F5F5F5]">Stock Ledger</h3>
              <p className="text-xs text-[#525252] mt-0.5">Click any row to see full event details</p>
            </div>
            <span className="text-xs font-mono text-[#525252]">{events.length} events</span>
          </div>
          {events.length === 0 ? (
            <div className="py-16 text-center text-sm text-[#525252]">No inventory events yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#262626] text-left text-xs uppercase tracking-wider text-[#525252]">
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium text-right">Qty Change</th>
                    <th className="px-4 py-3 font-medium">Reference</th>
                    <th className="px-4 py-3 font-medium">Notes</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1A]">
                  {events.map(ev => {
                    const Icon = EVENT_ICON[ev.event_type] ?? Minus;
                    const color = EVENT_COLOR[ev.event_type] ?? "text-[#A3A3A3]";
                    return (
                      <tr
                        key={ev.id}
                        onClick={() => setSelectedEvent(ev)}
                        className="hover:bg-[#1A1A1A] transition-colors cursor-pointer group"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 flex-shrink-0 ${color}`} />
                            <span className={`text-xs font-medium ${color}`}>{EVENT_LABEL[ev.event_type] ?? ev.event_type}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-mono font-bold text-base ${color}`}>
                            {ev.quantity_change > 0 ? "+" : ""}{ev.quantity_change}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {ev.reference_id
                            ? <span className="text-xs font-mono text-[#A3A3A3]">{ev.reference_id}</span>
                            : <span className="text-xs text-[#525252]">—</span>}
                        </td>
                        <td className="px-4 py-3 max-w-[220px]">
                          {ev.notes
                            ? <span className="text-xs text-[#A3A3A3] truncate block">{ev.notes}</span>
                            : <span className="text-xs text-[#525252]">—</span>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="text-xs text-[#A3A3A3]">{fmt(ev.created_at)}</p>
                          <p className="text-xs text-[#525252]">
                            {new Date(ev.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Details tab ── */}
      {tab === "details" && (
        <div className="space-y-4">
          {/* Pricing */}
          <div className="bg-[#161616] border border-[#262626] rounded-lg p-5">
            <h4 className="text-xs font-mono text-[#525252] uppercase tracking-wider mb-4">Pricing</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                ["Selling Price", inr(product.price)],
                ["Compare Price", product.compare_price ? inr(product.compare_price) : "—"],
                ["Cost Price", (product as unknown as Record<string, unknown>).cost_price ? inr(Number((product as unknown as Record<string, unknown>).cost_price)) : "—"],
                ["Margin", product.price && (product as unknown as Record<string, unknown>).cost_price
                  ? `${Math.round(((product.price - Number((product as unknown as Record<string, unknown>).cost_price)) / product.price) * 100)}%`
                  : "—"],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="text-xs text-[#525252] font-mono uppercase">{label}</p>
                  <p className="text-[#F5F5F5] font-mono font-semibold mt-1">{val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Inventory & Logistics */}
          <div className="bg-[#161616] border border-[#262626] rounded-lg p-5">
            <h4 className="text-xs font-mono text-[#525252] uppercase tracking-wider mb-4">Inventory & Logistics</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                ["SKU", product.sku || "—"],
                ["Current Stock", product.stock_count.toString()],
                ["Status", product.in_stock ? "In Stock" : "Out of Stock"],
                ["Weight", product.weight_grams ? `${product.weight_grams}g` : "—"],
                ["HSN Code", (product as unknown as Record<string, unknown>).hsn_code as string || "—"],
                ["Tax Rate", (product as unknown as Record<string, unknown>).tax_rate ? `${(product as unknown as Record<string, unknown>).tax_rate}%` : "18%"],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="text-xs text-[#525252] font-mono uppercase">{label}</p>
                  <p className="text-[#F5F5F5] mt-1 text-sm">{val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Meta */}
          <div className="bg-[#161616] border border-[#262626] rounded-lg p-5">
            <h4 className="text-xs font-mono text-[#525252] uppercase tracking-wider mb-4">Meta</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                ["Category", product.category?.name || "—"],
                ["Slug", product.slug],
                ["Created", fmt(product.created_at)],
                ["Active", product.is_active ? "Yes" : "No"],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="text-xs text-[#525252] font-mono uppercase">{label}</p>
                  <p className="text-[#F5F5F5] mt-1 text-sm font-mono">{val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          {(product.short_description || product.description) && (
            <div className="bg-[#161616] border border-[#262626] rounded-lg p-5">
              <h4 className="text-xs font-mono text-[#525252] uppercase tracking-wider mb-3">Description</h4>
              {product.short_description && (
                <p className="text-sm text-[#A3A3A3] mb-3">{product.short_description}</p>
              )}
              {product.description && product.description !== product.short_description && (
                <p className="text-sm text-[#525252] whitespace-pre-wrap">{product.description}</p>
              )}
            </div>
          )}

          {/* Images */}
          {product.images && product.images.length > 0 && (
            <div className="bg-[#161616] border border-[#262626] rounded-lg p-5">
              <h4 className="text-xs font-mono text-[#525252] uppercase tracking-wider mb-3">Images ({product.images.length})</h4>
              <div className="flex flex-wrap gap-3">
                {product.images.map((src, i) => (
                  <div key={i} className="w-20 h-20 rounded-lg border border-[#262626] overflow-hidden bg-[#1E1E1E]">
                    <Image src={src} alt={`${product.name} ${i + 1}`} width={80} height={80} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Event detail modal */}
      {selectedEvent && (
        <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
}
