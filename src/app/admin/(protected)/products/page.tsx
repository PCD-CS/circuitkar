"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, ExternalLink, Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { ProductWithCategory } from "@/types";

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative w-9 h-5 rounded-full transition-colors disabled:opacity-50 ${
        checked ? "bg-[#F97316]" : "bg-[#262626]"
      }`}
    >
      <div
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/products?page=1&pageSize=200");
    const data = await res.json();
    setProducts(data.products ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  async function handleToggle(
    id: string,
    field: "in_stock" | "is_active",
    value: boolean
  ) {
    setToggling(id + field);
    await fetch(`/api/admin/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
    setToggling(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-mono text-[#F5F5F5]">Products</h1>
          <p className="text-sm text-[#525252] mt-1">{products.length} items in catalog</p>
        </div>
        <Link href="/admin/products/new">
          <Button size="sm">
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="bg-[#161616] border border-[#262626] rounded-lg divide-y divide-[#1A1A1A]">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-4">
              <div className="w-10 h-10 bg-[#262626] rounded animate-pulse" />
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-[#262626] rounded w-48 animate-pulse" />
                <div className="h-3 bg-[#1A1A1A] rounded w-24 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#262626]">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-[#262626] bg-[#111111]">
                <th className="px-4 py-3 text-left text-xs font-mono text-[#525252] uppercase tracking-wider">Product</th>
                <th className="px-4 py-3 text-left text-xs font-mono text-[#525252] uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-right text-xs font-mono text-[#525252] uppercase tracking-wider">Price</th>
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
                          <Image
                            src={p.images[0]}
                            alt={p.name}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#525252] text-xs font-mono">
                            {p.name[0]}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-[#F5F5F5] leading-tight">{p.name}</p>
                        <p className="text-xs text-[#525252] font-mono">{p.sku ?? p.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#A3A3A3] text-xs">
                    {p.category?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    <span className="text-[#F97316] font-semibold">₹{p.price}</span>
                    {p.compare_price && (
                      <span className="text-[#525252] line-through text-xs ml-1">₹{p.compare_price}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Toggle
                      checked={p.in_stock}
                      disabled={toggling === p.id + "in_stock"}
                      onChange={(v) => handleToggle(p.id, "in_stock", v)}
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Toggle
                      checked={p.is_active}
                      disabled={toggling === p.id + "is_active"}
                      onChange={(v) => handleToggle(p.id, "is_active", v)}
                    />
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[#F97316] font-bold">
                    {p.interest_count}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/products/${p.id}/edit`}>
                        <button className="p-1.5 text-[#525252] hover:text-[#F5F5F5] hover:bg-[#1E1E1E] rounded transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </Link>
                      <Link href={`/products/${p.slug}`} target="_blank">
                        <button className="p-1.5 text-[#525252] hover:text-[#F97316] hover:bg-[#F9731615] rounded transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-[#525252]">
                    No products yet.{" "}
                    <Link href="/admin/products/new" className="text-[#F97316] hover:underline">
                      Add your first product
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
