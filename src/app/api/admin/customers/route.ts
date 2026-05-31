import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const pageSize = 30;

  const supabase = createAdminClient();

  // List all users from auth
  const { data: usersData, error: usersErr } = await supabase.auth.admin.listUsers({
    page,
    perPage: pageSize,
  });

  if (usersErr) return NextResponse.json({ error: usersErr.message }, { status: 500 });

  const users = usersData?.users ?? [];
  const userIds = users.map((u) => u.id);

  if (userIds.length === 0) {
    return NextResponse.json({ customers: [], total: 0, page, pageSize });
  }

  // Fetch profiles
  const { data: profiles } = await supabase
    .from("customer_profiles")
    .select("id, full_name, phone, business_name, gstin")
    .in("id", userIds);

  const profileMap: Record<string, { full_name: string | null; phone: string | null; business_name: string | null; gstin: string | null }> = {};
  for (const p of profiles ?? []) {
    profileMap[p.id] = p;
  }

  // Fetch order stats per user
  const { data: orderStats } = await supabase
    .from("orders")
    .select("customer_id, total, created_at")
    .in("customer_id", userIds)
    .neq("status", "cancelled");

  const orderMap: Record<string, { count: number; total: number; last_order_at: string | null }> = {};
  for (const o of orderStats ?? []) {
    if (!o.customer_id) continue;
    if (!orderMap[o.customer_id]) orderMap[o.customer_id] = { count: 0, total: 0, last_order_at: null };
    orderMap[o.customer_id].count += 1;
    orderMap[o.customer_id].total += Number(o.total ?? 0);
    if (!orderMap[o.customer_id].last_order_at || o.created_at > orderMap[o.customer_id].last_order_at!) {
      orderMap[o.customer_id].last_order_at = o.created_at;
    }
  }

  let customers = users.map((u) => {
    const profile = profileMap[u.id];
    const stats = orderMap[u.id];
    return {
      id: u.id,
      email: u.email ?? "",
      full_name: profile?.full_name ?? null,
      phone: profile?.phone ?? null,
      business_name: profile?.business_name ?? null,
      gstin: profile?.gstin ?? null,
      created_at: u.created_at,
      order_count: stats?.count ?? 0,
      total_spent: stats?.total ?? 0,
      last_order_at: stats?.last_order_at ?? null,
    };
  });

  // Client-side search filter (auth.users doesn't support server-side search easily)
  if (search) {
    const q = search.toLowerCase();
    customers = customers.filter(
      (c) =>
        c.email.toLowerCase().includes(q) ||
        (c.full_name ?? "").toLowerCase().includes(q) ||
        (c.phone ?? "").includes(q),
    );
  }

  return NextResponse.json({
    customers,
    total: usersData?.total ?? customers.length,
    page,
    pageSize,
  });
}
