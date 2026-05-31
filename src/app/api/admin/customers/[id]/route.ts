import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const supabase = createAdminClient();

  // Get user from auth
  const { data: userData, error: userErr } = await supabase.auth.admin.getUserById(id);
  if (userErr || !userData?.user) {
    return NextResponse.json({ error: "Customer not found." }, { status: 404 });
  }
  const user = userData.user;

  const [profileRes, ordersRes] = await Promise.all([
    supabase
      .from("customer_profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("orders")
      .select("*")
      .eq("customer_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const orders = ordersRes.data ?? [];
  const nonCancelledOrders = orders.filter((o) => o.status !== "cancelled");
  const totalSpent = nonCancelledOrders.reduce((sum, o) => sum + Number(o.total ?? 0), 0);
  const avgOrderValue = nonCancelledOrders.length > 0 ? totalSpent / nonCancelledOrders.length : 0;
  const firstOrder = orders.length > 0 ? orders[orders.length - 1].created_at : null;
  const lastOrder = orders.length > 0 ? orders[0].created_at : null;

  return NextResponse.json({
    customer: {
      id: user.id,
      email: user.email ?? "",
      created_at: user.created_at,
      profile: profileRes.data ?? null,
    },
    orders,
    stats: {
      order_count: orders.length,
      total_spent: totalSpent,
      avg_order_value: avgOrderValue,
      first_order_at: firstOrder,
      last_order_at: lastOrder,
    },
  });
}
