"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductGridSkeleton } from "@/components/ui/Skeleton";
import { PackageSearch } from "lucide-react";
import type { Category, ProductSort, ProductWithCategory } from "@/types";

const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest" },
];

export function ProductsClient({
  initialProducts,
  categories,
  maxPrice,
}: {
  initialProducts: ProductWithCategory[];
  categories: Category[];
  maxPrice: number;
}) {
  const [products] = useState<ProductWithCategory[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceCap, setPriceCap] = useState(maxPrice);
  const [sort, setSort] = useState<ProductSort>("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // brief skeleton flash on first paint for nicer UX
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 250);
    return () => clearTimeout(t);
  }, []);

  function toggleCategory(slug: string) {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  }

  const filtered = useMemo(() => {
    let list = [...products];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.short_description?.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q)),
      );
    }
    if (selectedCategories.length > 0) {
      list = list.filter(
        (p) => p.category && selectedCategories.includes(p.category.slug),
      );
    }
    list = list.filter((p) => p.price <= priceCap);
    switch (sort) {
      case "price-asc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list.sort((a, b) => b.price - a.price);
        break;
      case "newest":
        list.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        break;
      default:
        list.sort((a, b) => Number(b.is_featured) - Number(a.is_featured));
    }
    return list;
  }, [products, search, selectedCategories, priceCap, sort]);

  const hasFilters =
    search.trim() !== "" ||
    selectedCategories.length > 0 ||
    priceCap < maxPrice;

  function clearFilters() {
    setSearch("");
    setSelectedCategories([]);
    setPriceCap(maxPrice);
  }

  const sidebar = (
    <div className="space-y-7">
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#525252]">
          Search
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#525252]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search components..."
            className="w-full rounded-lg border border-[#262626] bg-[#111111] py-2.5 pl-9 pr-3 text-sm text-[#F5F5F5] placeholder:text-[#525252] focus:border-[#F97316] focus:outline-none focus:ring-1 focus:ring-[#F97316]"
          />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#525252]">
          Categories
        </h3>
        <div className="space-y-2">
          {categories.map((c) => (
            <label
              key={c.id}
              className="flex cursor-pointer items-center gap-2.5 text-sm text-[#A3A3A3] hover:text-[#F5F5F5]"
            >
              <input
                type="checkbox"
                checked={selectedCategories.includes(c.slug)}
                onChange={() => toggleCategory(c.slug)}
                className="h-4 w-4 rounded border-[#262626] bg-[#111111] accent-[#F97316]"
              />
              {c.name}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#525252]">
          Max Price
        </h3>
        <input
          type="range"
          min={0}
          max={maxPrice}
          step={10}
          value={priceCap}
          onChange={(e) => setPriceCap(Number(e.target.value))}
          className="w-full"
        />
        <div className="mt-1.5 flex justify-between text-xs text-[#A3A3A3]">
          <span>₹0</span>
          <span className="font-mono text-[#F5F5F5]">₹{priceCap}</span>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#525252]">
          In Stock
        </h3>
        <label
          className="flex cursor-not-allowed items-center gap-2.5 text-sm text-[#525252]"
          title="Coming soon"
        >
          <input
            type="checkbox"
            disabled
            className="h-4 w-4 rounded border-[#262626] bg-[#111111]"
          />
          In stock only{" "}
          <span className="text-xs text-[#525252]">(coming soon)</span>
        </label>
      </div>

      {hasFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1.5 text-sm text-[#F97316] hover:text-[#EA6C0A]"
        >
          <X className="h-3.5 w-3.5" /> Clear filters
        </button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#F5F5F5]">All Components</h1>
        <p className="mt-1 text-sm text-[#A3A3A3]">
          Browse the full Circuitkar catalog.
        </p>
      </div>

      <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-28 rounded-lg border border-[#262626] bg-[#161616] p-5">
            {sidebar}
          </div>
        </aside>

        <div>
          {/* Mobile filter toggle + sort */}
          <div className="mb-5 flex items-center justify-between gap-3">
            <button
              onClick={() => setFiltersOpen((o) => !o)}
              className="flex items-center gap-2 rounded-lg border border-[#262626] bg-[#161616] px-3 py-2 text-sm text-[#F5F5F5] lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </button>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-[#525252]">
                {filtered.length} result{filtered.length !== 1 ? "s" : ""}
              </span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as ProductSort)}
                className="rounded-lg border border-[#262626] bg-[#161616] px-3 py-2 text-sm text-[#F5F5F5] focus:border-[#F97316] focus:outline-none"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filtersOpen && (
            <div className="mb-5 rounded-lg border border-[#262626] bg-[#161616] p-5 lg:hidden">
              {sidebar}
            </div>
          )}

          {loading ? (
            <ProductGridSkeleton count={6} />
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#262626] py-20 text-center">
              <PackageSearch
                className="h-12 w-12 text-[#262626]"
                strokeWidth={1.25}
              />
              <p className="mt-4 text-sm text-[#A3A3A3]">
                No components match your filters.
              </p>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-3 text-sm text-[#F97316] hover:text-[#EA6C0A]"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
