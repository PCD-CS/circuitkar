"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, ExternalLink, Pencil, Search, X, Package, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { ProductWithCategory } from "@/types";

type SortField = "name" | "price" | "created_at";
type SortDir = "asc" | "desc";

const PAGE_SIZES = [10, 25, 50] as const;

/* ── Quantity modal shown when enabling in_stock ── */
function StockModal({
  product,
  onConfirm,
  onCancel,
}: {
  product: ProductWithCategory;
  onConfirm: (qty: number) => void;
  onCancel: () => void;
}) {
  const [qty, setQty] = useState(product.stock_count > 0 ? product.stock_count : 1);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onCancel} />
      <div className="relative bg-[#161616] border border-[#262626] rounded-lg p-6 w-full max-w-sm">
        <h3 className="text-base font-semibold text-[#F5F5F5] mb-1">Set Stock Quantity</h3>
        <p className="text-sm text-[#A3A3A3] mb-5">
          How many units of <span className="text-[#F5F5F5]">{product.name}</span> are available?
        </p>
        <Input
          label="Stock Count *"
          type="number"
          min={1}
          value={qty}
          onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
          autoFocus
        />
        <div className="flex gap-3 mt-5">
          <Button className="flex-1" onClick={() => onConfirm(qty)}>
            Mark In Stock ({qty} units)
          </Button>
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative w-9 h-5 rounded-full transition-colors disabled:opacity-50 ${checked ? "bg-[#F97316]" : "bg-[#262626]"}`}
    >
      <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? "translate-x-4" : "translate-x-0"}`} />
    </button>
  );
}

function SortIcon({ field, sortBy, sortDir }: { field: SortField; sortBy: SortField; sortDir: SortDir }) {
  if (sortBy !== field) {
    return <ChevronsUpDown className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 transition-opacity" />;
  }
  return sortDir === "asc"
    ? <ChevronUp className="w-3.5 h-3.5 text-[#F97316]" />
    : <ChevronDown className="w-3.5 h-3.5 text-[#F97316]" />;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<typeof PAGE_SIZES[number]>(25);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [stockModal, setStockModal] = useState<ProductWithCategory | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  const totalPages = Math.ceil(total / pageSize);

  const fetchProducts = useCallback(async (p: number, q: string, ps: number, sb: SortField, sd: SortDir) => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(p),
      pageSize: String(ps),
      sortBy: sb,
      sortDir: sd,
    });
    if (q.trim()) params.set("search", q.trim());
    const res = await fetch(`/api/admin/products?${params}`);
    const data = await res.json();
    setProducts(data.products ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts(page, search, pageSize, sortBy, sortDir);
  }, [fetchProducts, page, search, pageSize, sortBy, sortDir]);

  function handleSearchInput(val: string) {
    setSearchInput(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      setSearch(val);
    }, 350);
  }

  function handleSort(field: SortField) {
    if (sortBy === field) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDir(field === "price" ? "asc" : "asc");
    }
    setPage(1);
  }

  async function handleToggleActive(id: string, field: "is_active", value: boolean) {
    setToggling(id + field);
    await fetch(`/api/admin/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
    setToggling(null);
  }

  async function confirmStock(product: ProductWithCategory, qty: number) {
    setStockModal(null);
    setToggling(product.id + "in_stock");
    await fetch(`/api/admin/products/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ in_stock: true, stock_count: qty }),
    });
    setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, in_stock: true, stock_count: qty } : p));
    setToggling(null);
  }

  async function handleStockToggle(product: ProductWithCategory, newVal: boolean) {
    if (newVal) {
      setStockModal(product);
    } else {
      setToggling(product.id + "in_stock");
      await fetch(`/api/admin/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ in_stock: false, stock_count: 0 }),
      });
      setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, in_stock: false, stock_count: 0 } : p));
      setToggling(null);
    }
  }

  const SortableHeader = ({ field, label, className }: { field: SortField; label: string; className?: string }) => (
    <th
      className={`px-4 py-3 text-xs font-mono text-[#525252] uppercase tracking-wider whitespace-nowrap cursor-pointer select-none group ${className ?? "text-left"}`}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        <SortIcon field={field} sortBy={sortBy} sortDir={sortDir} />
      </div>
    </th>
  );

  return (
    <div className="space-y-5">
      {stockModal && (
        <StockModal
          product={stockModal}
          onConfirm={(qty) => confirmStock(stockModal, qty)}
          onCancel={() => setStockModal(null)}
        />
      )}

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold font-mono text-[#F5F5F5]">Products</h1>
          <p className="text-sm text-[#525252] mt-0.5">{total} items in catalog</p>
        </div>
        <Link href="/admin/products/new">
          <Button size="sm"><Plus className="w-4 h-4" /> Add Product</Button>
        </Link>
      </div>

      {/* Search + rows per page */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#525252]" />
          <input
            value={searchInput}
            onChange={(e) => handleSearchInput(e.target.value)}
            placeholder="Search products…"
            className="w-full bg-[#161616] border border-[#262626] rounded-lg pl-9 pr-9 py-2.5 text-sm text-[#F5F5F5] placeholder:text-[#525252] focus:outline-none focus:border-[#F97316]"
          />
          {searchInput && (
            <button onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#525252] hover:text-[#A3A3A3]">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-[#525252]">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value) as typeof PAGE_SIZES[number]); setPage(1); }}
            className="bg-[#161616] border border-[#262626] rounded-lg px-2 py-1.5 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#F97316]"
          >
            {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-[#161616] border border-[#262626] rounded-lg divide-y divide-[#1A1A1A]">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-4">
              <div className="w-10 h-10 bg-[#262626] rounded animate-pulse" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-[#262626] rounded w-48 animate-pulse" />
                <div className="h-3 bg-[#1A1A1A] rounded w-24 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-[#161616] border border-[#262626] rounded-lg flex flex-col items-center justify-center py-20 text-center">
          <Package className="w-10 h-10 text-[#525252] mb-3" />
          <p className="text-[#A3A3A3] text-sm">{search ? `No products matching "${search}"` : "No products yet."}</p>
          {!search && (
            <Link href="/admin/products/new" className="mt-3 text-sm text-[#F97316] hover:underline">Add your first product →</Link>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#262626]">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-[#262626] bg-[#111111]">
                <SortableHeader field="name" label="Product" />
                <th className="px-4 py-3 text-left text-xs font-mono text-[#525252] uppercase tracking-wider whitespace-nowrap">Category</th>
                <SortableHeader field="price" label="Price" className="text-right" />
                <th className="px-4 py-3 text-center text-xs font-mono text-[#525252] uppercase tracking-wider">In Stock</th>
                <th className="px-4 py-3 text-center text-xs font-mono text-[#525252] uppercase tracking-wider">Active</th>
                <th className="px-4 py-3 text-right text-xs font-mono text-[#525252] uppercase tracking-wider">Interests</th>
                <th className="px-4 py-3 text-right text-xs font-mono text-[#525252] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-[#1A1A1A] hover:bg-[#111111] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-[#1E1E1E] border border-[#262626] flex-shrink-0 overflow-hidden">
                        {p.images?.[0] ? (
                          <Image src={p.images[0]} alt={p.name} width={40} height={40} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#525252] text-xs font-mono">{p.name[0]}</div>
                        )}
                      </div>
                      <div>
                        <Link href={`/admin/products/${p.id}`} className="font-medium text-[#F5F5F5] hover:text-[#F97316] leading-tight transition-colors">{p.name}</Link>
                        <p className="text-xs text-[#525252] font-mono">{p.sku ?? p.slug}</p>
                        {p.in_stock && p.stock_count > 0 && (
                          <p className="text-xs text-[#22C55E]">{p.stock_count} units</p>
                        )}
                        {!p.in_stock && <p className="text-xs text-[#EF4444]">Out of stock</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#A3A3A3] text-xs">{p.category?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    <span className="text-[#F97316] font-semibold">₹{p.price}</span>
                    {p.compare_price && <span className="text-[#525252] line-through text-xs ml-1">₹{p.compare_price}</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Toggle checked={p.in_stock} disabled={toggling === p.id + "in_stock"} onChange={(v) => handleStockToggle(p, v)} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Toggle checked={p.is_active} disabled={toggling === p.id + "is_active"} onChange={(v) => handleToggleActive(p.id, "is_active", v)} />
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[#F97316] font-bold">{p.interest_count}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/products/${p.id}/edit`}>
                        <button className="p-1.5 text-[#525252] hover:text-[#F5F5F5] hover:bg-[#1E1E1E] rounded transition-colors" title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </Link>
                      <Link href={`/products/${p.slug}`} target="_blank">
                        <button className="p-1.5 text-[#525252] hover:text-[#F97316] hover:bg-[#F9731615] rounded transition-colors" title="View on site">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-[#525252]">
            {total === 0 ? "No products" : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total} products`}
          </p>
          {totalPages > 1 && (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const n = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                return n <= totalPages ? (
                  <button key={n} onClick={() => setPage(n)}
                    className={`w-8 h-8 rounded text-sm font-mono transition-colors ${n === page ? "bg-[#F97316] text-white" : "text-[#A3A3A3] hover:bg-[#1E1E1E]"}`}
                  >{n}</button>
                ) : null;
              })}
              <Button variant="ghost" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
