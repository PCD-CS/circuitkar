"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { ChevronLeft, Pencil, Package, TrendingDown, TrendingUp, Minus, ExternalLink } from "lucide-react";
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

function inr(n: number) { return `₹${Number(n).toLocaleString("en-IN")}`; }
function fmt(ts: string) { return new Date(ts).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }); }

const EVENT_ICON: Record<string, React.ElementType> = {
  sale: TrendingDown,
  cancel: TrendingUp,
  restock: TrendingUp,
  adjustment: Minus,
};
const EVENT_COLOR: Record<string, string> = {
  sale: "text-[#EF4444]",
  cancel: "text-[#22C55E]",
  restock: "text-[#22C55E]",
  adjustment: "text-[#F59E0B]",
};

export default function AdminProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<ProductWithCategory | null>(null);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [events, setEvents] = useState<InventoryEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [pRes, eRes, oRes] = await Promise.all([
      fetch(`/api/admin/products/${id}`),
      fetch(`/api/admin/inventory?productId=${id}`),
      fetch(`/api/admin/orders?search=`), // we'll filter client-side for this product
    ]);
    if (pRes.ok) setProduct((await pRes.json()).product);
    if (eRes.ok) setEvents((await eRes.json()).events ?? []);
    if (oRes.ok) {
      const allOrders = (await oRes.json()).orders ?? [];
      // Filter orders that contain this product
      const filtered: OrderSummary[] = allOrders
        .filter((o: { items: OrderItem[] }) =>
          (o.items ?? []).some((it) => it.product_id === id)
        )
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

  if (loading) return <div className="flex items-center justify-center py-24"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F97316] border-t-transparent" /></div>;
  if (!product) return <div className="text-center py-24 text-[#525252]">Product not found.</div>;

  const totalRevenue = orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.revenue, 0);
  const totalUnitsSold = orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.qty, 0);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/products" className="inline-flex items-center gap-1 text-sm text-[#A3A3A3] hover:text-[#F5F5F5]">
          <ChevronLeft className="h-4 w-4" /> Products
        </Link>
        <span className="text-[#525252]">/</span>
        <span className="text-sm text-[#F5F5F5]">{product.name}</span>
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
            <span className={`text-xs px-2 py-0.5 rounded border ${product.in_stock ? "text-[#22C55E] border-[#22C55E]/40 bg-[#22C55E]/10" : "text-[#EF4444] border-[#EF4444]/40 bg-[#EF4444]/10"}`}>
              {product.in_stock ? `In Stock (${product.stock_count} units)` : "Out of Stock"}
            </span>
            {!product.is_active && <span className="text-xs px-2 py-0.5 rounded border text-[#525252] border-[#262626]">Inactive</span>}
          </div>
          <p className="text-sm text-[#525252] mt-1">{product.sku ? `SKU: ${product.sku}` : ""} {product.category?.name ? `· ${product.category.name}` : ""}</p>
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
          { label: "Current Stock", value: product.stock_count.toString(), sub: product.in_stock ? "available" : "out of stock" },
        ].map(kpi => (
          <div key={kpi.label} className="bg-[#161616] border border-[#262626] rounded-lg p-4">
            <p className="text-xs text-[#525252] font-mono uppercase">{kpi.label}</p>
            <p className="text-xl font-bold font-mono text-[#F5F5F5] mt-1">{kpi.value}</p>
            <p className="text-xs text-[#525252] mt-0.5">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders for this product */}
        <div className="bg-[#161616] border border-[#262626] rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-[#262626]">
            <h3 className="text-sm font-semibold text-[#F5F5F5]">Orders ({orders.length})</h3>
          </div>
          {orders.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[#525252]">No orders yet for this product.</div>
          ) : (
            <div className="divide-y divide-[#1A1A1A] max-h-80 overflow-y-auto">
              {orders.map(o => (
                <div key={o.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-[#1A1A1A]">
                  <div>
                    <Link href={`/admin/orders/${o.order_number}`} className="text-sm font-mono text-[#F97316] hover:underline">{o.order_number}</Link>
                    <p className="text-xs text-[#525252]">{fmt(o.created_at)} · {o.qty} unit{o.qty !== 1 ? "s" : ""}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono text-[#F5F5F5]">{inr(o.revenue)}</p>
                    <span className={`text-xs ${o.status === "cancelled" ? "text-[#EF4444]" : o.status === "delivered" ? "text-[#22C55E]" : "text-[#A3A3A3]"}`}>{o.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stock ledger */}
        <div className="bg-[#161616] border border-[#262626] rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-[#262626]">
            <h3 className="text-sm font-semibold text-[#F5F5F5]">Stock Ledger</h3>
          </div>
          {events.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[#525252]">No inventory events yet.</div>
          ) : (
            <div className="divide-y divide-[#1A1A1A] max-h-80 overflow-y-auto">
              {events.map(ev => {
                const Icon = EVENT_ICON[ev.event_type] ?? Minus;
                const color = EVENT_COLOR[ev.event_type] ?? "text-[#A3A3A3]";
                return (
                  <div key={ev.id} className="flex items-center gap-3 px-4 py-2.5">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#F5F5F5] capitalize">{ev.event_type}</p>
                      {ev.reference_id && <p className="text-xs text-[#525252] font-mono truncate">{ev.reference_id}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-mono font-bold ${color}`}>
                        {ev.quantity_change > 0 ? "+" : ""}{ev.quantity_change}
                      </p>
                      <p className="text-xs text-[#525252]">{fmt(ev.created_at)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Product details */}
      <div className="bg-[#161616] border border-[#262626] rounded-lg p-5 space-y-4">
        <h3 className="text-sm font-semibold text-[#F5F5F5]">Product Details</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          {[
            ["Price", inr(product.price)],
            ["Compare Price", product.compare_price ? inr(product.compare_price) : "—"],
            ["SKU", product.sku || "—"],
            ["Category", product.category?.name || "—"],
            ["Weight", product.weight_grams ? `${product.weight_grams}g` : "—"],
            ["Created", fmt(product.created_at)],
          ].map(([label, val]) => (
            <div key={label}>
              <p className="text-xs text-[#525252] font-mono uppercase">{label}</p>
              <p className="text-[#F5F5F5] mt-0.5">{val}</p>
            </div>
          ))}
        </div>
        {product.short_description && (
          <div>
            <p className="text-xs text-[#525252] font-mono uppercase mb-1">Description</p>
            <p className="text-sm text-[#A3A3A3]">{product.short_description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
