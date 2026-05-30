"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Product, Category, Specifications } from "@/types";

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

interface ProductFormProps {
  product?: Product & { category?: Category | null };
  categories: Category[];
}

export function ProductForm({ product, categories }: ProductFormProps) {
  const router = useRouter();
  const isEdit = !!product;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugManual, setSlugManual] = useState(isEdit);
  const [shortDesc, setShortDesc] = useState(product?.short_description ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [categoryId, setCategoryId] = useState(product?.category_id ?? "");
  const [price, setPrice] = useState(String(product?.price ?? ""));
  const [comparePrice, setComparePrice] = useState(String(product?.compare_price ?? ""));
  const [sku, setSku] = useState(product?.sku ?? "");
  const [inStock, setInStock] = useState(product?.in_stock ?? false);
  const [isFeatured, setIsFeatured] = useState(product?.is_featured ?? false);
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [stockCount, setStockCount] = useState(String(product?.stock_count ?? "0"));
  const [weightGrams, setWeightGrams] = useState(String(product?.weight_grams ?? ""));
  const [tags, setTags] = useState((product?.tags ?? []).join(", "));
  const [datasheetUrl, setDatasheetUrl] = useState(product?.datasheet_url ?? "");
  const [imageUrls, setImageUrls] = useState((product?.images ?? []).join("\n"));

  const [specs, setSpecs] = useState<{ key: string; value: string }[]>(() => {
    const s = product?.specifications as Specifications | null;
    if (!s) return [{ key: "", value: "" }];
    return Object.entries(s).map(([key, value]) => ({ key, value }));
  });

  useEffect(() => {
    if (!slugManual) {
      setSlug(slugify(name));
    }
  }, [name, slugManual]);

  function addSpec() {
    setSpecs((prev) => [...prev, { key: "", value: "" }]);
  }

  function removeSpec(i: number) {
    setSpecs((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateSpec(i: number, field: "key" | "value", val: string) {
    setSpecs((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, [field]: val } : s))
    );
  }

  async function handleSubmit(e: React.FormEvent, andContinue = false) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const specsObj: Record<string, string> = {};
    for (const s of specs) {
      if (s.key.trim()) specsObj[s.key.trim()] = s.value;
    }

    const body = {
      name: name.trim(),
      slug: slug.trim(),
      short_description: shortDesc.trim() || null,
      description: description.trim() || null,
      category_id: categoryId || null,
      price: parseFloat(price),
      compare_price: comparePrice ? parseFloat(comparePrice) : null,
      sku: sku.trim() || null,
      in_stock: inStock,
      is_featured: isFeatured,
      is_active: isActive,
      stock_count: parseInt(stockCount) || 0,
      weight_grams: weightGrams ? parseInt(weightGrams) : null,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      specifications: Object.keys(specsObj).length ? specsObj : null,
      datasheet_url: datasheetUrl.trim() || null,
      images: imageUrls
        .split("\n")
        .map((u) => u.trim())
        .filter(Boolean),
    };

    try {
      const url = isEdit
        ? `/api/admin/products/${product!.id}`
        : "/api/admin/products";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save product.");
        setSaving(false);
        return;
      }
      if (andContinue && isEdit) {
        setSaving(false);
        return;
      }
      router.push("/admin/products");
    } catch {
      setError("Network error. Please try again.");
      setSaving(false);
    }
  }

  const Toggle = ({
    label,
    checked,
    onChange,
  }: {
    label: string;
    checked: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <label className="flex items-center gap-3 cursor-pointer">
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div
          className={`w-10 h-5 rounded-full transition-colors ${
            checked ? "bg-[#F97316]" : "bg-[#262626]"
          }`}
        />
        <div
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </div>
      <span className="text-sm text-[#A3A3A3]">{label}</span>
    </label>
  );

  return (
    <form onSubmit={(e) => handleSubmit(e)} className="space-y-8">
      {error && (
        <div className="bg-[#EF444415] border border-[#EF4444]/30 rounded-lg px-4 py-3 text-sm text-[#EF4444]">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Input
            label="Product Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. ESP32 DevKit V1"
          />
          <div>
            <label className="block text-xs text-[#A3A3A3] mb-1.5 font-mono uppercase tracking-wider">
              Slug *
            </label>
            <input
              value={slug}
              onChange={(e) => {
                setSlugManual(true);
                setSlug(e.target.value);
              }}
              required
              placeholder="auto-generated"
              className="w-full bg-[#111111] border border-[#262626] rounded-lg px-3 py-2.5 text-sm text-[#F5F5F5] placeholder:text-[#525252] focus:outline-none focus:border-[#F97316] font-mono"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-[#A3A3A3] mb-1.5 font-mono uppercase tracking-wider">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-[#111111] border border-[#262626] rounded-lg px-3 py-2.5 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#F97316]"
            >
              <option value="">— No category —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="SKU"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="e.g. ESP32-001"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-[#A3A3A3] mb-1.5 font-mono uppercase tracking-wider">
          Short Description
        </label>
        <input
          value={shortDesc}
          onChange={(e) => setShortDesc(e.target.value)}
          placeholder="One-liner shown on product cards"
          className="w-full bg-[#111111] border border-[#262626] rounded-lg px-3 py-2.5 text-sm text-[#F5F5F5] placeholder:text-[#525252] focus:outline-none focus:border-[#F97316]"
        />
      </div>

      <div>
        <label className="block text-xs text-[#A3A3A3] mb-1.5 font-mono uppercase tracking-wider">
          Full Description (Markdown)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
          placeholder="Detailed description with markdown support..."
          className="w-full bg-[#111111] border border-[#262626] rounded-lg px-3 py-2.5 text-sm text-[#F5F5F5] placeholder:text-[#525252] focus:outline-none focus:border-[#F97316] resize-y font-mono"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Input
          label="Price (₹) *"
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
          placeholder="249"
        />
        <Input
          label="Compare Price (₹)"
          type="number"
          min="0"
          step="0.01"
          value={comparePrice}
          onChange={(e) => setComparePrice(e.target.value)}
          placeholder="299"
        />
        <Input
          label="Stock Count"
          type="number"
          min="0"
          value={stockCount}
          onChange={(e) => setStockCount(e.target.value)}
        />
        <Input
          label="Weight (grams)"
          type="number"
          min="0"
          value={weightGrams}
          onChange={(e) => setWeightGrams(e.target.value)}
          placeholder="50"
        />
      </div>

      <div className="flex flex-wrap gap-6">
        <Toggle label="In Stock" checked={inStock} onChange={setInStock} />
        <Toggle label="Featured" checked={isFeatured} onChange={setIsFeatured} />
        <Toggle label="Active (visible)" checked={isActive} onChange={setIsActive} />
      </div>

      <div>
        <label className="block text-xs text-[#A3A3A3] mb-1.5 font-mono uppercase tracking-wider">
          Tags (comma separated)
        </label>
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="wifi, iot, popular"
          className="w-full bg-[#111111] border border-[#262626] rounded-lg px-3 py-2.5 text-sm text-[#F5F5F5] placeholder:text-[#525252] focus:outline-none focus:border-[#F97316]"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs text-[#A3A3A3] font-mono uppercase tracking-wider">
            Specifications
          </label>
          <button
            type="button"
            onClick={addSpec}
            className="flex items-center gap-1 text-xs text-[#F97316] hover:text-[#EA6C0A]"
          >
            <Plus className="w-3 h-3" /> Add Row
          </button>
        </div>
        <div className="space-y-2">
          {specs.map((s, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={s.key}
                onChange={(e) => updateSpec(i, "key", e.target.value)}
                placeholder="Key (e.g. Voltage)"
                className="flex-1 bg-[#111111] border border-[#262626] rounded-lg px-3 py-2 text-sm text-[#F5F5F5] placeholder:text-[#525252] focus:outline-none focus:border-[#F97316]"
              />
              <input
                value={s.value}
                onChange={(e) => updateSpec(i, "value", e.target.value)}
                placeholder="Value (e.g. 3.3-5V)"
                className="flex-1 bg-[#111111] border border-[#262626] rounded-lg px-3 py-2 text-sm text-[#F5F5F5] placeholder:text-[#525252] focus:outline-none focus:border-[#F97316]"
              />
              <button
                type="button"
                onClick={() => removeSpec(i)}
                className="text-[#525252] hover:text-[#EF4444] transition-colors p-2"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs text-[#A3A3A3] mb-1.5 font-mono uppercase tracking-wider">
          Image URLs (one per line)
        </label>
        <textarea
          value={imageUrls}
          onChange={(e) => setImageUrls(e.target.value)}
          rows={3}
          placeholder="https://your-supabase.storage/product-images/..."
          className="w-full bg-[#111111] border border-[#262626] rounded-lg px-3 py-2.5 text-sm text-[#F5F5F5] placeholder:text-[#525252] focus:outline-none focus:border-[#F97316] resize-y font-mono"
        />
      </div>

      <Input
        label="Datasheet URL"
        value={datasheetUrl}
        onChange={(e) => setDatasheetUrl(e.target.value)}
        placeholder="https://example.com/datasheet.pdf"
      />

      <div className="flex flex-wrap gap-3 pt-2 border-t border-[#262626]">
        <Button type="submit" loading={saving}>
          {isEdit ? "Save Changes" : "Create Product"}
        </Button>
        {isEdit && (
          <Button
            type="button"
            variant="secondary"
            loading={saving}
            onClick={(e) => handleSubmit(e as unknown as React.FormEvent, true)}
          >
            Save & Continue Editing
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/admin/products")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
