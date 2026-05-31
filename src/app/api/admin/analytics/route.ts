import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const supabase = createAdminClient();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Fetch all non-cancelled orders
  const { data: orders, error } = await supabase
    .from("orders")
    .select("total, items, status, created_at")
    .neq("status", "cancelled");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const allOrders = orders ?? [];

  // Revenue calculations
  let revenueToday = 0;
  let revenueWeek = 0;
  let revenueMonth = 0;
  let revenueAll = 0;

  // Product aggregate: { productName -> { qty, revenue } }
  const productMap: Record<string, { name: string; qty: number; revenue: number }> = {};

  // Status breakdown: { status -> count } (include all orders including cancelled)
  const statusMap: Record<string, number> = {};

  for (const order of allOrders) {
    const total = Number(order.total ?? 0);
    const createdAt = order.created_at;

    revenueAll += total;
    if (createdAt >= monthStart) revenueMonth += total;
    if (createdAt >= weekStart) revenueWeek += total;
    if (createdAt >= todayStart) revenueToday += total;

    // Aggregate top products
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

  // Fetch all orders for status breakdown (including cancelled)
  const { data: allOrdersForStatus } = await supabase
    .from("orders")
    .select("status");

  for (const o of allOrdersForStatus ?? []) {
    const s: string = o.status ?? "unknown";
    statusMap[s] = (statusMap[s] ?? 0) + 1;
  }

  const ordersByStatus = Object.entries(statusMap).map(([status, count]) => ({ status, count }));

  const topProducts = Object.values(productMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const avgOrderValue = allOrders.length > 0 ? revenueAll / allOrders.length : 0;

  return NextResponse.json({
    revenue: {
      today: revenueToday,
      week: revenueWeek,
      month: revenueMonth,
      all: revenueAll,
    },
    ordersByStatus,
    avgOrderValue,
    topProducts,
    totalOrders: (allOrdersForStatus ?? []).length,
  });
}
