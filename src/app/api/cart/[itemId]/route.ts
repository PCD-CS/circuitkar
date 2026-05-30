import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getCurrentUserId,
  findCartId,
  getCartItems,
  sessionIdFromRequest,
} from "@/lib/cart";

async function resolveCartId(request: NextRequest): Promise<string | null> {
  const userId = await getCurrentUserId();
  const sessionId = sessionIdFromRequest(request);
  return findCartId(userId, sessionId);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const { itemId } = await params;
  let body: { quantity?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const cartId = await resolveCartId(request);
  if (!cartId) {
    return NextResponse.json({ error: "Cart not found." }, { status: 404 });
  }

  const supabase = createAdminClient();

  // Fetch product stock for this cart item
  const { data: cartItem } = await supabase
    .from("cart_items")
    .select("product_id, product:products(in_stock, stock_count)")
    .eq("id", itemId)
    .eq("cart_id", cartId)
    .maybeSingle();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prod = cartItem?.product as any;
  const maxQty = prod?.in_stock && prod.stock_count > 0 ? prod.stock_count : 99;
  const quantity = Math.max(1, Math.min(maxQty, body.quantity ?? 1));

  const { error } = await supabase
    .from("cart_items")
    .update({ quantity })
    .eq("id", itemId)
    .eq("cart_id", cartId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const items = await getCartItems(cartId);
  return NextResponse.json({ items });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const { itemId } = await params;
  const cartId = await resolveCartId(request);
  if (!cartId) {
    return NextResponse.json({ error: "Cart not found." }, { status: 404 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("id", itemId)
    .eq("cart_id", cartId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const items = await getCartItems(cartId);
  return NextResponse.json({ items });
}
