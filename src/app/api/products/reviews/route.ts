import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCustomerId } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const productId = searchParams.get("productId");
  if (!productId) return NextResponse.json({ error: "productId required." }, { status: 400 });

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("product_reviews")
    .select("id, rating, title, body, is_verified, created_at, customer:customer_profiles(full_name)")
    .eq("product_id", productId)
    .eq("is_approved", true)
    .order("created_at", { ascending: false });

  const reviews = data ?? [];
  const avg = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  return NextResponse.json({ reviews, total: reviews.length, average: Math.round(avg * 10) / 10 });
}

export async function POST(request: NextRequest) {
  const customerId = await getCustomerId();
  if (!customerId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  let body: { productId: string; rating: number; title?: string; body?: string };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid body." }, { status: 400 }); }

  if (!body.productId || !body.rating || body.rating < 1 || body.rating > 5 || !Number.isInteger(body.rating)) {
    return NextResponse.json({ error: "productId and rating (1–5) are required." }, { status: 400 });
  }
  if (body.title && body.title.trim().length > 150) {
    return NextResponse.json({ error: "Review title must be 150 characters or fewer." }, { status: 400 });
  }
  if (body.body && body.body.trim().length > 2000) {
    return NextResponse.json({ error: "Review must be 2000 characters or fewer." }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Check if customer bought this product (verified purchase)
  const { count } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("customer_id", customerId)
    .eq("payment_status", "paid")
    .neq("status", "cancelled")
    .contains("items", [{ product_id: body.productId }]);

  const isVerified = (count ?? 0) > 0;

  const { data: settings } = await supabase
    .from("settings").select("value").eq("key", "review_moderation").maybeSingle();
  const needsApproval = settings?.value !== "false";

  const { data, error } = await supabase
    .from("product_reviews")
    .upsert({
      product_id: body.productId,
      customer_id: customerId,
      rating: body.rating,
      title: body.title?.trim() || null,
      body: body.body?.trim() || null,
      is_verified: isVerified,
      is_approved: !needsApproval,
      is_rejected: false, // re-submission clears any previous rejection
      updated_at: new Date().toISOString(),
    }, { onConflict: "product_id,customer_id" })
    .select("id, is_approved")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({
    id: data.id,
    pending: !data.is_approved,
    message: data.is_approved
      ? "Review published."
      : "Review submitted — it will appear after admin approval.",
  }, { status: 201 });
}
