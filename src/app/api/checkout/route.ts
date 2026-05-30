import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCustomerId } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

const GST_RATE = 0.18;

export async function POST(request: NextRequest) {
  const customerId = await getCustomerId();
  if (!customerId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Fetch cart items
  const { data: cart } = await supabase
    .from("carts")
    .select("id")
    .eq("customer_id", customerId)
    .maybeSingle();

  if (!cart) {
    return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
  }

  const { data: items } = await supabase
    .from("cart_items")
    .select("quantity, product:products(id, name, price, images, in_stock)")
    .eq("cart_id", cart.id);

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const validItems = items.filter((i: any) => i.product);
  if (validItems.length === 0) {
    return NextResponse.json({ error: "No valid items in cart." }, { status: 400 });
  }

  const settings = await getSettings();
  const freeShippingThreshold = parseInt(settings.free_shipping_threshold) || 499;
  const launchMode = settings.launch_mode || "prelaunch";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subtotal = validItems.reduce((sum: number, item: any) => {
    return sum + item.product.price * item.quantity;
  }, 0);

  const shipping = subtotal >= freeShippingThreshold ? 0 : 60;
  const gst = Math.round(subtotal * GST_RATE * 100) / 100;
  const total = subtotal + shipping + gst;

  return NextResponse.json({
    items: validItems,
    subtotal,
    shipping,
    gst,
    gstRate: GST_RATE,
    total,
    launchMode,
    freeShippingThreshold,
  });
}
