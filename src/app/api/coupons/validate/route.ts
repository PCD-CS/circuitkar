import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCustomerId } from "@/lib/auth";

export async function POST(request: NextRequest) {
  let body: { code: string; subtotal: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const code = body.code?.trim().toUpperCase();
  if (!code) return NextResponse.json({ error: "Coupon code is required." }, { status: 400 });

  const customerId = await getCustomerId();
  const supabase = createAdminClient();

  const { data: coupon } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", code)
    .eq("is_active", true)
    .maybeSingle();

  if (!coupon) return NextResponse.json({ error: "Invalid or expired coupon code." }, { status: 404 });

  const now = new Date();

  // Check expiry
  if (coupon.expires_at && new Date(coupon.expires_at) < now) {
    return NextResponse.json({ error: "This coupon has expired." }, { status: 400 });
  }

  // Check start date
  if (coupon.starts_at && new Date(coupon.starts_at) > now) {
    return NextResponse.json({ error: "This coupon is not active yet." }, { status: 400 });
  }

  // Check usage limit
  if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
    return NextResponse.json({ error: "This coupon has reached its usage limit." }, { status: 400 });
  }

  // Check minimum order value
  if (coupon.min_order_value && body.subtotal < coupon.min_order_value) {
    return NextResponse.json({
      error: `Minimum order value of ₹${coupon.min_order_value} required for this coupon.`,
    }, { status: 400 });
  }

  // Check per-user usage limit
  if (customerId && coupon.per_user_limit) {
    const { count } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("customer_id", customerId)
      .eq("coupon_code", code);
    if ((count ?? 0) >= coupon.per_user_limit) {
      return NextResponse.json({ error: "You have already used this coupon." }, { status: 400 });
    }
  }

  // Calculate discount
  let discountAmount = 0;
  if (coupon.discount_type === "percentage") {
    discountAmount = Math.round((body.subtotal * coupon.discount_value) / 100);
    if (coupon.max_discount_amount) {
      discountAmount = Math.min(discountAmount, coupon.max_discount_amount);
    }
  } else {
    // flat
    discountAmount = Math.min(coupon.discount_value, body.subtotal);
  }

  return NextResponse.json({
    valid: true,
    coupon: {
      code: coupon.code,
      description: coupon.description,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      discount_amount: discountAmount,
    },
  });
}
