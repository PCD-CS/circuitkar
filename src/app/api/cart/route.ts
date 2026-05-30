import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getCurrentUserId,
  getOrCreateCart,
  findCartId,
  getCartItems,
  sessionIdFromRequest,
} from "@/lib/cart";

export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId();
  const sessionId = sessionIdFromRequest(request);
  const cartId = await findCartId(userId, sessionId);
  if (!cartId) {
    return NextResponse.json({ items: [] });
  }
  const items = await getCartItems(cartId);
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  let body: { productId?: string; quantity?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }
  if (!body.productId) {
    return NextResponse.json({ error: "productId is required." }, { status: 400 });
  }
  const quantity = Math.max(1, Math.min(99, body.quantity ?? 1));

  const userId = await getCurrentUserId();
  const sessionId = sessionIdFromRequest(request);
  if (!userId && !sessionId) {
    return NextResponse.json({ error: "No cart session." }, { status: 400 });
  }

  const cartId = await getOrCreateCart(userId, sessionId);
  if (!cartId) {
    return NextResponse.json({ error: "Could not create cart." }, { status: 500 });
  }

  const supabase = createAdminClient();

  // Fetch product to check stock
  const { data: product } = await supabase
    .from("products")
    .select("in_stock, stock_count")
    .eq("id", body.productId)
    .maybeSingle();

  const maxQty = product?.in_stock && product.stock_count > 0 ? product.stock_count : 99;

  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("cart_id", cartId)
    .eq("product_id", body.productId)
    .maybeSingle();

  if (existing) {
    const newQty = Math.min(maxQty, existing.quantity + quantity);
    if (newQty <= existing.quantity) {
      return NextResponse.json({ error: `Only ${maxQty} units available.` }, { status: 400 });
    }
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: newQty })
      .eq("id", existing.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  } else {
    const clampedQty = Math.min(maxQty, quantity);
    const { error } = await supabase.from("cart_items").insert({
      cart_id: cartId,
      product_id: body.productId,
      quantity: clampedQty,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  await supabase
    .from("carts")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", cartId);

  const items = await getCartItems(cartId);
  return NextResponse.json({ items }, { status: 201 });
}
