import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ coupons: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const code = String(body.code || "").trim().toUpperCase();
  if (!code) return NextResponse.json({ error: "Code is required." }, { status: 400 });
  if (!/^[A-Z0-9_-]+$/.test(code)) return NextResponse.json({ error: "Code can only contain letters, numbers, - and _." }, { status: 400 });

  const discountType = String(body.discount_type || "");
  if (!["percentage", "flat"].includes(discountType)) {
    return NextResponse.json({ error: "discount_type must be 'percentage' or 'flat'." }, { status: 400 });
  }
  const discountValue = Number(body.discount_value);
  if (!discountValue || discountValue <= 0) {
    return NextResponse.json({ error: "discount_value must be > 0." }, { status: 400 });
  }
  if (discountType === "percentage" && discountValue > 100) {
    return NextResponse.json({ error: "Percentage discount cannot exceed 100." }, { status: 400 });
  }
  if (body.max_discount_amount !== null && body.max_discount_amount !== undefined && Number(body.max_discount_amount) <= 0) {
    return NextResponse.json({ error: "max_discount_amount must be > 0." }, { status: 400 });
  }
  if (body.min_order_value !== null && body.min_order_value !== undefined && Number(body.min_order_value) < 0) {
    return NextResponse.json({ error: "min_order_value cannot be negative." }, { status: 400 });
  }
  if (body.usage_limit !== null && body.usage_limit !== undefined && Number(body.usage_limit) < 1) {
    return NextResponse.json({ error: "usage_limit must be at least 1." }, { status: 400 });
  }
  if (body.per_user_limit !== null && body.per_user_limit !== undefined && Number(body.per_user_limit) < 1) {
    return NextResponse.json({ error: "per_user_limit must be at least 1." }, { status: 400 });
  }
  // Date validation
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (body.starts_at) {
    const start = new Date(String(body.starts_at));
    if (isNaN(start.getTime())) return NextResponse.json({ error: "starts_at is not a valid date." }, { status: 400 });
    if (start < today) return NextResponse.json({ error: "starts_at cannot be in the past." }, { status: 400 });
  }
  if (body.expires_at) {
    const exp = new Date(String(body.expires_at));
    if (isNaN(exp.getTime())) return NextResponse.json({ error: "expires_at is not a valid date." }, { status: 400 });
    if (exp < today) return NextResponse.json({ error: "expires_at cannot be in the past." }, { status: 400 });
    if (body.starts_at && exp <= new Date(String(body.starts_at))) {
      return NextResponse.json({ error: "expires_at must be after starts_at." }, { status: 400 });
    }
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("coupons")
    .insert({ ...body, code })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ coupon: data }, { status: 201 });
}
