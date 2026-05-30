import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";

const PAGE_SIZE = 20;
const VALID_STATUSES = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
  const status = searchParams.get("status") || "";
  const search = (searchParams.get("search") || "").trim();

  const supabase = createAdminClient();
  let query = supabase
    .from("orders")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (status && VALID_STATUSES.includes(status)) {
    query = query.eq("status", status);
  }
  if (search) {
    query = query.or(
      `order_number.ilike.%${search}%,customer_email.ilike.%${search}%,customer_name.ilike.%${search}%`,
    );
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data, count, error } = await query.range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    orders: data ?? [],
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
  });
}
