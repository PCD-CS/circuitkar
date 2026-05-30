import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCustomerId } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const userId = await getCustomerId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const pageSize = Math.min(50, parseInt(searchParams.get("pageSize") || "10"));
  const status = searchParams.get("status") || "";
  const search = searchParams.get("search") || "";

  const supabase = createAdminClient();
  let query = supabase
    .from("orders")
    .select("*", { count: "exact" })
    .eq("customer_id", userId);

  if (status) query = query.eq("status", status);
  if (search) query = query.ilike("order_number", `%${search}%`);

  query = query
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const { data, count, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({
    orders: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
  });
}
