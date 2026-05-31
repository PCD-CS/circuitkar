import { NextResponse, type NextRequest } from "next/server";
import { getCustomerId } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createRazorpayOrder } from "@/lib/razorpay";
import { getSettings } from "@/lib/settings";

const GST_RATE = 0.18;

export async function POST(request: NextRequest) {
  const customerId = await getCustomerId();
  if (!customerId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let body: { couponCode?: string; receipt: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const supabase = createAdminClient();

  // ── Fetch Razorpay keys ──────────────────────────────────────────────────
  const { data: settingsRows } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", [
      "razorpay_use_live",
      "razorpay_key_id_live",
      "razorpay_key_secret_live",
      "razorpay_key_id_test",
      "razorpay_key_secret_test",
    ]);

  const s: Record<string, string> = {};
  for (const row of settingsRows ?? []) {
    if (row.value && row.value.trim()) s[row.key] = row.value.trim();
  }

  const useLive = s.razorpay_use_live === "true";
  const keyId = useLive
    ? (s.razorpay_key_id_live || "")
    : (s.razorpay_key_id_test || process.env.RAZORPAY_KEY_ID || "");
  const keySecret = useLive
    ? (s.razorpay_key_secret_live || "")
    : (s.razorpay_key_secret_test || process.env.RAZORPAY_KEY_SECRET || "");

  if (!keyId || !keySecret) {
    const mode = useLive ? "live" : "test";
    const hint = useLive
      ? "Add your live Razorpay keys in Admin → Settings → Payments tab."
      : "Add your test Razorpay keys in Admin → Settings → Payments tab, then save.";
    return NextResponse.json(
      {
        error: `Razorpay ${mode} keys not configured. ${hint}`,
        debug: { useLive, hasKeyId: !!keyId, hasSecret: !!keySecret },
      },
      { status: 503 },
    );
  }

  // ── Calculate total from cart — never trust client-supplied amount ────────
  const { data: cart } = await supabase
    .from("carts")
    .select("id")
    .eq("customer_id", customerId)
    .maybeSingle();

  if (!cart) {
    return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
  }

  const { data: cartItems } = await supabase
    .from("cart_items")
    .select("quantity, product:products(id, price, in_stock)")
    .eq("cart_id", cart.id);

  if (!cartItems || cartItems.length === 0) {
    return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const validItems = (cartItems as any[]).filter((i) => i.product);

  const settings = await getSettings();
  const freeShippingThreshold = parseInt(settings.free_shipping_threshold) || 499;
  const shippingCharge = parseInt(settings.shipping_charge) || 100;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subtotal = validItems.reduce((sum: number, item: any) => {
    return sum + item.product.price * item.quantity;
  }, 0);

  const shipping = subtotal >= freeShippingThreshold ? 0 : shippingCharge;
  const gst = Math.round(subtotal * GST_RATE * 100) / 100;

  // ── Validate coupon server-side if provided ──────────────────────────────
  let discountAmount = 0;
  let validatedCouponCode: string | undefined;

  if (body.couponCode) {
    const code = body.couponCode.trim().toUpperCase();
    const { data: coupon } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", code)
      .eq("is_active", true)
      .maybeSingle();

    if (coupon) {
      const now = new Date();
      const expired = coupon.expires_at && new Date(coupon.expires_at) < now;
      const notStarted = coupon.starts_at && new Date(coupon.starts_at) > now;
      const overLimit = coupon.usage_limit && coupon.usage_count >= coupon.usage_limit;
      const underMinOrder = coupon.min_order_value && subtotal < coupon.min_order_value;

      if (!expired && !notStarted && !overLimit && !underMinOrder) {
        if (coupon.discount_type === "percentage") {
          discountAmount = Math.round((subtotal * coupon.discount_value) / 100);
          if (coupon.max_discount_amount) {
            discountAmount = Math.min(discountAmount, coupon.max_discount_amount);
          }
        } else {
          discountAmount = Math.min(coupon.discount_value, subtotal);
        }
        validatedCouponCode = code;
      }
    }
  }

  const total = Math.max(0, subtotal + shipping + gst - discountAmount);

  try {
    const order = await createRazorpayOrder(
      Math.round(total * 100),
      "INR",
      body.receipt,
      keyId,
      keySecret,
    );
    return NextResponse.json({
      orderId: order.id,
      keyId,
      amount: order.amount,
      subtotal,
      shipping,
      gst,
      discountAmount,
      couponCode: validatedCouponCode,
      total,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Razorpay order creation failed." },
      { status: 500 },
    );
  }
}
