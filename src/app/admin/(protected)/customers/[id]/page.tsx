"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Mail, Phone, Building2, FileText, ShoppingCart } from "lucide-react";
import type { Order, OrderStatus } from "@/types";

interface CustomerDetail {
  id: string;
  email: string;
  created_at: string;
  profile: {
    full_name: string | null;
    phone: string | null;
    account_type: string | null;
    business_name: string | null;
    gstin: string | null;
    pan: string | null;
  } | null;
}

interface CustomerStats {
  order_count: number;
  total_spent: number;
  avg_order_value: number;
  first_order_at: string | null;
  last_order_at: string | null;
}

const STATUS_STYLE: Record<string, string> = {
  pending:   "bg-[#F59E0B]/10 text-[#F59E0B]  border-[#F59E0B]/40",
  confirmed: "bg-[#3B82F6]/10 text-[#3B82F6]  border-[#3B82F6]/40",
  accepted:  "bg-[#8B5CF6]/10 text-[#8B5CF6]  border-[#8B5CF6]/40",
  packed:    "bg-[#F97316]/10 text-[#F97316]  border-[#F97316]/40",
  shipped:   "bg-[#06B6D4]/10 text-[#06B6D4]  border-[#06B6D4]/40",
  delivered: "bg-[#22C55E]/10 text-[#22C55E]  border-[#22C55E]/40",
  cancelled: "bg-[#EF4444]/10 text-[#EF4444]  border-[#EF4444]/40",
};

function inr(n: number) {
  return `₹${Number(n ?? 0).toLocaleString("en-IN")}`;
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CustomerDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/customers/${id}`);
        if (res.status === 404) { setNotFound(true); return; }
        if (res.ok) {
          const data = await res.json();
          setCustomer(data.customer);
          setOrders(data.orders ?? []);
          setStats(data.stats);
        }
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-sm text-[#525252]">
        Loading customer…
      </div>
    );
  }

  if (notFound || !customer) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/customers"
          className="inline-flex items-center gap-2 text-sm text-[#A3A3A3] hover:text-[#F5F5F5] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Customers
        </Link>
        <div className="flex flex-col items-center justify-center py-24">
          <p className="text-sm text-[#525252]">Customer not found.</p>
        </div>
      </div>
    );
  }

  const profile = customer.profile;
  const displayName = profile?.full_name ?? customer.email;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        href="/admin/customers"
        className="inline-flex items-center gap-2 text-sm text-[#A3A3A3] hover:text-[#F5F5F5] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Customers
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold font-mono text-[#F5F5F5]">{displayName}</h1>
        <p className="text-sm text-[#525252] mt-1">Customer since {fmtDate(customer.created_at)}</p>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Orders", value: String(stats.order_count) },
            { label: "Total Spent", value: inr(stats.total_spent) },
            { label: "Avg Order Value", value: inr(stats.avg_order_value) },
            { label: "Last Order", value: fmtDate(stats.last_order_at) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[#161616] border border-[#262626] rounded-lg p-4 space-y-1">
              <p className="text-xs text-[#A3A3A3] uppercase tracking-wider font-mono">{label}</p>
              <p className="text-lg font-bold text-[#F5F5F5] font-mono">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Profile card */}
      <div className="bg-[#161616] border border-[#262626] rounded-lg p-6">
        <h2 className="text-sm font-semibold text-[#F5F5F5] mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-[#F97316]" /> Profile
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-[#525252] flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Email
            </p>
            <p className="text-sm text-[#F5F5F5]">{customer.email}</p>
          </div>

          {profile?.phone && (
            <div className="space-y-1">
              <p className="text-xs text-[#525252] flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> Phone
              </p>
              <p className="text-sm text-[#F5F5F5]">{profile.phone}</p>
            </div>
          )}

          {profile?.full_name && (
            <div className="space-y-1">
              <p className="text-xs text-[#525252] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Full Name
              </p>
              <p className="text-sm text-[#F5F5F5]">{profile.full_name}</p>
            </div>
          )}

          {profile?.account_type === "business" && profile?.business_name && (
            <div className="space-y-1">
              <p className="text-xs text-[#525252] flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> Business Name
              </p>
              <p className="text-sm text-[#F5F5F5]">{profile.business_name}</p>
            </div>
          )}

          {profile?.gstin && (
            <div className="space-y-1">
              <p className="text-xs text-[#525252] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> GSTIN
              </p>
              <p className="text-sm text-[#F5F5F5] font-mono">{profile.gstin}</p>
            </div>
          )}

          {profile?.pan && (
            <div className="space-y-1">
              <p className="text-xs text-[#525252]">PAN</p>
              <p className="text-sm text-[#F5F5F5] font-mono">{profile.pan}</p>
            </div>
          )}

          {stats?.first_order_at && (
            <div className="space-y-1">
              <p className="text-xs text-[#525252]">First Order</p>
              <p className="text-sm text-[#F5F5F5]">{fmtDate(stats.first_order_at)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Orders */}
      <div className="bg-[#161616] border border-[#262626] rounded-lg">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[#262626]">
          <ShoppingCart className="w-4 h-4 text-[#F97316]" />
          <h2 className="text-sm font-semibold text-[#F5F5F5]">Order History</h2>
          <span className="text-xs text-[#525252]">{orders.length} order{orders.length === 1 ? "" : "s"}</span>
        </div>
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 rounded-full bg-[#1E1E1E] flex items-center justify-center mb-3">
              <ShoppingCart className="w-6 h-6 text-[#525252]" />
            </div>
            <p className="text-sm text-[#525252]">No orders yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#262626] text-left text-xs uppercase tracking-wider text-[#525252]">
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Items</th>
                  <th className="px-4 py-3 font-medium text-right">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A]">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-[#1A1A1A] transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-mono text-[#F5F5F5] text-xs">{o.order_number}</p>
                    </td>
                    <td className="px-4 py-3 text-[#A3A3A3] text-xs whitespace-nowrap">
                      {fmtDateTime(o.created_at)}
                    </td>
                    <td className="px-4 py-3 text-[#A3A3A3]">
                      {(o.items ?? []).reduce((n, it) => n + (it.qty || 0), 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[#F97316] font-medium">
                      {inr(o.total ?? 0)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-md border px-2 py-0.5 text-xs ${
                          STATUS_STYLE[o.status as OrderStatus] ?? "bg-[#262626] text-[#A3A3A3] border-[#262626]"
                        }`}
                      >
                        {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/orders/${o.order_number}`}
                        className="inline-flex items-center gap-1 rounded-md border border-[#262626] px-2.5 py-1.5 text-xs text-[#A3A3A3] hover:border-[#F97316] hover:text-[#F97316] transition-colors"
                      >
                        View
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
  );
}
