import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid body." }, { status: 400 }); }

  // Validate only fields that are present in the patch
  if (body.discount_type !== undefined && !["percentage", "flat"].includes(String(body.discount_type))) {
    return NextResponse.json({ error: "discount_type must be 'percentage' or 'flat'." }, { status: 400 });
  }
  if (body.discount_value !== undefined && Number(body.discount_value) <= 0) {
    return NextResponse.json({ error: "discount_value must be > 0." }, { status: 400 });
  }
  if (body.discount_type === "percentage" && body.discount_value !== undefined && Number(body.discount_value) > 100) {
    return NextResponse.json({ error: "Percentage discount cannot exceed 100." }, { status: 400 });
  }
  if (body.usage_limit !== null && body.usage_limit !== undefined && Number(body.usage_limit) < 1) {
    return NextResponse.json({ error: "usage_limit must be at least 1." }, { status: 400 });
  }
  if (body.per_user_limit !== null && body.per_user_limit !== undefined && Number(body.per_user_limit) < 1) {
    return NextResponse.json({ error: "per_user_limit must be at least 1." }, { status: 400 });
  }
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

  // Only pass through safe, known fields
  const allowed = ["code", "description", "discount_type", "discount_value", "max_discount_amount",
    "min_order_value", "usage_limit", "per_user_limit", "is_active", "starts_at", "expires_at"];
  const safe = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("coupons")
    .update({ ...safe, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ coupon: data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const supabase = createAdminClient();
  const { error } = await supabase.from("coupons").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
