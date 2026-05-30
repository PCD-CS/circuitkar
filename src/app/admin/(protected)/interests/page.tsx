"use client";

import { useState, useEffect, useCallback } from "react";
import { Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/admin/DataTable";
import type { ProductInterestWithProduct } from "@/types";

interface InterestRow extends ProductInterestWithProduct {
  product_name: string;
}

export default function AdminInterestsPage() {
  const [interests, setInterests] = useState<InterestRow[]>([]);
  const [filtered, setFiltered] = useState<InterestRow[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchInterests = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/interests");
    const data = await res.json();
    const rows: InterestRow[] = (data.interests ?? []).map(
      (i: ProductInterestWithProduct) => ({
        ...i,
        product_name: i.product?.name ?? "Unknown",
      })
    );
    setInterests(rows);
    setFiltered(rows);

    const seen = new Set<string>();
    const prods: { id: string; name: string }[] = [];
    for (const r of rows) {
      if (r.product_id && !seen.has(r.product_id)) {
        seen.add(r.product_id);
        prods.push({ id: r.product_id, name: r.product_name });
      }
    }
    setProducts(prods);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInterests();
  }, [fetchInterests]);

  useEffect(() => {
    if (!selectedProduct) {
      setFiltered(interests);
    } else {
      setFiltered(interests.filter((i) => i.product_id === selectedProduct));
    }
  }, [selectedProduct, interests]);

  async function handleExport() {
    setExporting(true);
    const res = await fetch("/api/admin/interests/export");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `circuitkar-interests-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  }

  const interestCounts = products
    .map((p) => ({
      ...p,
      count: interests.filter((i) => i.product_id === p.id).length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const maxCount = Math.max(...interestCounts.map((p) => p.count), 1);

  const columns: Column<InterestRow>[] = [
    {
      key: "product_name",
      header: "Product",
      render: (row) => <span className="text-[#F5F5F5]">{row.product_name}</span>,
    },
    {
      key: "email",
      header: "Email",
      render: (row) => <span className="font-mono text-xs">{row.email}</span>,
    },
    {
      key: "name",
      header: "Name",
      render: (row) => row.name ?? <span className="text-[#525252]">—</span>,
    },
    {
      key: "created_at",
      header: "Date",
      render: (row) => (
        <span className="font-mono text-xs">
          {new Date(row.created_at).toLocaleDateString("en-IN")}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-mono text-[#F5F5F5]">Interests</h1>
          <p className="text-sm text-[#525252] mt-1">
            {interests.length} total notify-me signups
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleExport}
          loading={exporting}
        >
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {interestCounts.length > 0 && (
        <div className="bg-[#161616] border border-[#262626] rounded-lg p-6">
          <h2 className="text-sm font-semibold text-[#F5F5F5] mb-4">Interest by Product</h2>
          <div className="space-y-3">
            {interestCounts.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="text-xs text-[#A3A3A3] w-40 truncate flex-shrink-0">
                  {p.name}
                </span>
                <div className="flex-1 bg-[#262626] rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-[#F97316] rounded-full transition-all duration-500"
                    style={{ width: `${(p.count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-mono font-bold text-[#F97316] w-6 text-right flex-shrink-0">
                  {p.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center gap-3 mb-4">
          <Filter className="w-4 h-4 text-[#525252]" />
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="bg-[#111111] border border-[#262626] rounded-lg px-3 py-2 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#F97316]"
          >
            <option value="">All products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <span className="text-xs text-[#525252]">{filtered.length} entries</span>
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(r) => r.id}
          emptyMessage={loading ? "Loading..." : "No interests yet."}
        />
      </div>
    </div>
  );
}
