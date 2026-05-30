import { Metadata } from "next";
import Link from "next/link";
import { Package, Bell, TrendingUp, Star } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { StatsCard } from "@/components/admin/StatsCard";

export const metadata: Metadata = { title: "Dashboard" };

async function getDashboardData() {
  const supabase = createAdminClient();

  const [productRes, interestRes, highInterestRes, topRes] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("product_interests").select("id", { count: "exact", head: true }),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .gte("interest_count", 5),
    supabase
      .from("products")
      .select("id, name, interest_count, category:categories(name)")
      .order("interest_count", { ascending: false })
      .limit(5),
  ]);

  return {
    totalProducts: productRes.count ?? 0,
    totalInterests: interestRes.count ?? 0,
    highInterestCount: highInterestRes.count ?? 0,
    topProducts: topRes.data ?? [],
  };
}

export default async function DashboardPage() {
  const { totalProducts, totalInterests, highInterestCount, topProducts } =
    await getDashboardData();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold font-mono text-[#F5F5F5]">Dashboard</h1>
        <p className="text-sm text-[#525252] mt-1">Circuitkar store overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard
          title="Total Products"
          value={totalProducts}
          subtitle="Active listings in catalog"
          icon={<Package className="w-5 h-5" />}
          accent
        />
        <StatsCard
          title="Total Interests"
          value={totalInterests}
          subtitle="Notify-me signups all time"
          icon={<Bell className="w-5 h-5" />}
        />
        <StatsCard
          title="Ready to Stock"
          value={highInterestCount}
          subtitle="Products with 5+ interests"
          icon={<TrendingUp className="w-5 h-5" />}
          accent
        />
      </div>

      <div className="bg-[#161616] border border-[#262626] rounded-lg">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[#262626]">
          <Star className="w-4 h-4 text-[#F97316]" />
          <h2 className="text-sm font-semibold text-[#F5F5F5]">Top 5 Most Interested</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1A1A1A]">
                <th className="px-6 py-3 text-left text-xs font-mono text-[#525252] uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-mono text-[#525252] uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-right text-xs font-mono text-[#525252] uppercase tracking-wider">Interests</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-[#525252] text-sm">
                    No interest data yet.
                  </td>
                </tr>
              ) : (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                topProducts.map((p: any) => (
                  <tr key={p.id} className="border-b border-[#1A1A1A] hover:bg-[#111111] transition-colors">
                    <td className="px-6 py-3">
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        className="text-[#F5F5F5] hover:text-[#F97316] transition-colors"
                      >
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-[#A3A3A3]">
                      {p.category?.name ?? "—"}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className="font-mono font-bold text-[#F97316]">
                        {p.interest_count}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-[#1A1A1A]">
          <Link
            href="/admin/interests"
            className="text-xs text-[#F97316] hover:text-[#EA6C0A] transition-colors"
          >
            View all interests →
          </Link>
        </div>
      </div>
    </div>
  );
}
