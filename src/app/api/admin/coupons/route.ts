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
  if (!body.discount_type || !["percentage", "flat"].includes(String(body.discount_type))) {
    return NextResponse.json({ error: "discount_type must be 'percentage' or 'flat'." }, { status: 400 });
  }
  if (!body.discount_value || Number(body.discount_value) <= 0) {
    return NextResponse.json({ error: "discount_value must be > 0." }, { status: 400 });
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
