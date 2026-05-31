"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, X, Users, ChevronLeft, ChevronRight, ChevronRight as ArrowRight } from "lucide-react";

interface Customer {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  business_name: string | null;
  gstin: string | null;
  created_at: string;
  order_count: number;
  total_spent: number;
  last_order_at: string | null;
}

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

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const pageSize = 30;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const load = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams({ page: String(page) });
    if (search) qs.set("search", search);
    try {
      const res = await fetch(`/api/admin/customers?${qs.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers ?? []);
        setTotal(data.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold font-mono text-[#F5F5F5]">Customers</h1>
          <p className="text-sm text-[#525252] mt-1">{total} customer{total === 1 ? "" : "s"} total</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#525252]" />
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by name, email or phone…"
          className="w-full bg-[#111111] border border-[#262626] rounded-lg pl-9 pr-9 py-2.5 text-sm text-[#F5F5F5] placeholder:text-[#525252] focus:outline-none focus:border-[#F97316]"
        />
        {searchInput && (
          <button onClick={() => setSearchInput("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#525252] hover:text-[#F5F5F5]">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-[#161616] border border-[#262626] rounded-lg overflow-hidden">
        {loading ? (
          <div className="py-24 text-center text-sm text-[#525252]">Loading…</div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-[#1E1E1E] flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-[#525252]" />
            </div>
            <p className="text-sm text-[#525252]">No customers found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#262626] text-left text-xs uppercase tracking-wider text-[#525252]">
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium text-right">Orders</th>
                  <th className="px-4 py-3 font-medium text-right">Total Spent</th>
                  <th className="px-4 py-3 font-medium">Last Order</th>
                  <th className="px-4 py-3 font-medium text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A]">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-[#1A1A1A] transition-colors group">
                    <td className="px-4 py-3">
                      <p className="text-[#F5F5F5] font-medium">{c.full_name ?? <span className="text-[#525252]">—</span>}</p>
                      <p className="text-xs text-[#525252]">{c.email}</p>
                    </td>
                    <td className="px-4 py-3 text-[#A3A3A3] text-sm">
                      {c.phone ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-[#A3A3A3] text-xs whitespace-nowrap">
                      {fmtDate(c.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono font-bold text-[#F5F5F5]">{c.order_count}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[#F97316] font-medium">
                      {inr(c.total_spent)}
                    </td>
                    <td className="px-4 py-3 text-[#A3A3A3] text-xs whitespace-nowrap">
                      {fmtDate(c.last_order_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/customers/${c.id}`}
                        className="inline-flex items-center gap-1 rounded-md border border-[#262626] px-2.5 py-1.5 text-xs text-[#A3A3A3] hover:border-[#F97316] hover:text-[#F97316] transition-colors opacity-0 group-hover:opacity-100"
                      >
                        View <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
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
            Page {page} of {totalPages}
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
