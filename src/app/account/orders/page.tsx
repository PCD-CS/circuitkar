"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Loader2, Search, Package } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import type { Order } from "@/types";

const STATUSES = ["", "pending", "confirmed", "shipped", "delivered", "cancelled"];

const statusVariant: Record<string, "accent" | "success" | "warning" | "status"> = {
  pending: "warning",
  confirmed: "accent",
  shipped: "accent",
  delivered: "success",
  cancelled: "status",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const pageSize = 10;

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (status) params.set("status", status);
    if (search) params.set("search", search);
    const res = await fetch(`/api/account/orders?${params}`);
    const data = await res.json();
    if (res.ok) {
      setOrders(data.orders ?? []);
      setTotal(data.total ?? 0);
    }
    setLoading(false);
  }, [page, status, search]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-[#F5F5F5]">My Orders</h2>

      <div className="flex flex-col gap-3 sm:flex-row">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            load();
          }}
          className="relative flex-1"
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#525252]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order number"
            className="w-full rounded-lg border border-[#262626] bg-[#111111] py-2.5 pl-9 pr-3 text-sm text-[#F5F5F5] placeholder:text-[#525252] focus:border-[#F97316] focus:outline-none"
          />
        </form>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-[#262626] bg-[#111111] px-3 py-2.5 text-sm text-[#F5F5F5] focus:border-[#F97316] focus:outline-none"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s ? s[0].toUpperCase() + s.slice(1) : "All statuses"}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#F97316]" />
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-lg border border-[#262626] bg-[#161616] p-8 text-center">
          <Package className="mx-auto mb-2 h-7 w-7 text-[#525252]" />
          <p className="text-sm text-[#A3A3A3]">No orders found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/account/orders/${o.order_number}`}
              className="flex items-center justify-between rounded-lg border border-[#262626] bg-[#161616] px-4 py-3 transition-colors hover:border-[#525252]"
            >
              <div>
                <p className="font-mono text-sm text-[#F5F5F5]">
                  #{o.order_number}
                </p>
                <p className="text-xs text-[#525252]">
                  {new Date(o.created_at).toLocaleDateString("en-IN")} ·{" "}
                  {Array.isArray(o.items) ? o.items.length : 0} item(s)
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-[#F97316]">
                  {formatPrice(o.total)}
                </span>
                <Badge variant={statusVariant[o.status] ?? "category"}>
                  {o.status}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            size="sm"
            variant="ghost"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-xs text-[#525252]">
            Page {page} of {totalPages}
          </span>
          <Button
            size="sm"
            variant="ghost"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
