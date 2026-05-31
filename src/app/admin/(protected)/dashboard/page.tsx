import { Metadata } from "next";
import Link from "next/link";
import { Package, Bell, TrendingUp, Star, DollarSign, ShoppingCart, BarChart2, Zap } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { StatsCard } from "@/components/admin/StatsCard";

export const metadata: Metadata = { title: "Dashboard" };

function inr(n: number) {
  return `₹${Number(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
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

async function getDashboardData() {
  const supabase = createAdminClient();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [productRes, interestRes, highInterestRes, topRes, ordersRes, allOrdersRes] = await Promise.all([
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
    // Non-cancelled orders for revenue
    supabase
      .from("orders")
      .select("total, items, created_at")
      .neq("status", "cancelled"),
    // All orders for status breakdown
    supabase
      .from("orders")
      .select("status"),
  ]);

  const orders = ordersRes.data ?? [];
  const allOrders = allOrdersRes.data ?? [];

  let revenueToday = 0;
  let revenueWeek = 0;
  let revenueMonth = 0;
  let revenueAll = 0;
  const productMap: Record<string, { name: string; qty: number; revenue: number }> = {};

  for (const order of orders) {
    const total = Number(order.total ?? 0);
    const createdAt = order.created_at;

    revenueAll += total;
    if (createdAt >= monthStart) revenueMonth += total;
    if (createdAt >= weekStart) revenueWeek += total;
    if (createdAt >= todayStart) revenueToday += total;

    const items = Array.isArray(order.items) ? order.items : [];
    for (const item of items) {
      const name: string = item.name ?? "Unknown";
      const qty: number = Number(item.qty ?? 0);
      const itemRevenue: number = Number(item.price ?? 0) * qty;
      if (!productMap[name]) productMap[name] = { name, qty: 0, revenue: 0 };
      productMap[name].qty += qty;
      productMap[name].revenue += itemRevenue;
    }
  }

  const statusMap: Record<string, number> = {};
  for (const o of allOrders) {
    const s: string = o.status ?? "unknown";
    statusMap[s] = (statusMap[s] ?? 0) + 1;
  }

  const ordersByStatus = Object.entries(statusMap).map(([status, count]) => ({ status, count }));
  const topSellingProducts = Object.values(productMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);
  const avgOrderValue = orders.length > 0 ? revenueAll / orders.length : 0;
  const totalOrderCount = allOrders.length;

  return {
    totalProducts: productRes.count ?? 0,
    totalInterests: interestRes.count ?? 0,
    highInterestCount: highInterestRes.count ?? 0,
    topProducts: topRes.data ?? [],
    revenue: { today: revenueToday, week: revenueWeek, month: revenueMonth, all: revenueAll },
    ordersByStatus,
    topSellingProducts,
    avgOrderValue,
    totalOrderCount,
  };
}

export default async function DashboardPage() {
  const {
    totalProducts,
    totalInterests,
    highInterestCount,
    topProducts,
    revenue,
    ordersByStatus,
    topSellingProducts,
    avgOrderValue,
    totalOrderCount,
  } = await getDashboardData();

  const maxStatusCount = Math.max(...ordersByStatus.map((s) => s.count), 1);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold font-mono text-[#F5F5F5]">Dashboard</h1>
        <p className="text-sm text-[#525252] mt-1">Circuitkar store overview</p>
      </div>

      {/* Top stats */}
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

      {/* Revenue section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-4 h-4 text-[#F97316]" />
          <h2 className="text-sm font-semibold text-[#F5F5F5]">Revenue</h2>
          <span className="text-xs text-[#525252]">(excluding cancelled orders)</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Today", value: revenue.today },
            { label: "This Week", value: revenue.week },
            { label: "This Month", value: revenue.month },
            { label: "All Time", value: revenue.all },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="bg-[#161616] border border-[#262626] rounded-lg p-5 flex flex-col gap-2"
            >
              <p className="text-xs text-[#A3A3A3] uppercase tracking-wider font-mono">{label}</p>
              <p className="text-2xl font-bold text-[#F5F5F5] font-mono">{inr(value)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Order stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[#161616] border border-[#262626] rounded-lg p-5 flex flex-col gap-2 border-l-2 border-l-[#F97316]">
          <p className="text-xs text-[#A3A3A3] uppercase tracking-wider font-mono flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" /> Total Orders
          </p>
          <p className="text-3xl font-bold text-[#F5F5F5] font-mono">{totalOrderCount}</p>
          <p className="text-xs text-[#525252]">All statuses combined</p>
        </div>
        <div className="bg-[#161616] border border-[#262626] rounded-lg p-5 flex flex-col gap-2">
          <p className="text-xs text-[#A3A3A3] uppercase tracking-wider font-mono flex items-center gap-2">
            <Zap className="w-4 h-4" /> Avg Order Value
          </p>
          <p className="text-3xl font-bold text-[#F5F5F5] font-mono">{inr(avgOrderValue)}</p>
          <p className="text-xs text-[#525252]">Non-cancelled orders</p>
        </div>
      </div>

      {/* Orders by status + Top selling products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by status */}
        <div className="bg-[#161616] border border-[#262626] rounded-lg">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-[#262626]">
            <BarChart2 className="w-4 h-4 text-[#F97316]" />
            <h2 className="text-sm font-semibold text-[#F5F5F5]">Orders by Status</h2>
          </div>
          <div className="p-6 space-y-3">
            {ordersByStatus.length === 0 ? (
              <p className="text-sm text-[#525252] text-center py-6">No orders yet.</p>
            ) : (
              ordersByStatus
                .sort((a, b) => b.count - a.count)
                .map(({ status, count }) => (
                  <div key={status} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-block rounded-md border px-2 py-0.5 text-xs ${STATUS_STYLE[status] ?? "bg-[#262626] text-[#A3A3A3] border-[#262626]"}`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                      <span className="text-sm font-mono font-bold text-[#F5F5F5]">{count}</span>
                    </div>
                    <div className="h-1.5 bg-[#262626] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#F97316] rounded-full transition-all"
                        style={{ width: `${(count / maxStatusCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
            )}
          </div>
          <div className="px-6 py-3 border-t border-[#1A1A1A]">
            <Link
              href="/admin/orders"
              className="text-xs text-[#F97316] hover:text-[#EA6C0A] transition-colors"
            >
              View all orders →
            </Link>
          </div>
        </div>

        {/* Top selling products */}
        <div className="bg-[#161616] border border-[#262626] rounded-lg">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-[#262626]">
            <TrendingUp className="w-4 h-4 text-[#F97316]" />
            <h2 className="text-sm font-semibold text-[#F5F5F5]">Top 5 Products by Sales</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1A1A1A]">
                  <th className="px-6 py-3 text-left text-xs font-mono text-[#525252] uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-right text-xs font-mono text-[#525252] uppercase tracking-wider">Qty</th>
                  <th className="px-6 py-3 text-right text-xs font-mono text-[#525252] uppercase tracking-wider">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topSellingProducts.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-[#525252] text-sm">
                      No sales data yet.
                    </td>
                  </tr>
                ) : (
                  topSellingProducts.map((p) => (
                    <tr key={p.name} className="border-b border-[#1A1A1A] hover:bg-[#111111] transition-colors">
                      <td className="px-6 py-3 text-[#F5F5F5] truncate max-w-[180px]">{p.name}</td>
                      <td className="px-6 py-3 text-right font-mono font-bold text-[#F97316]">{p.qty}</td>
                      <td className="px-6 py-3 text-right font-mono text-[#A3A3A3]">{inr(p.revenue)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Top 5 Most Interested */}
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
