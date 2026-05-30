import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserId, getOrCreateCart } from "@/lib/cart";

/** Merge a guest cart (by session_id) into the authenticated user's cart. */
export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let body: { sessionId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }
  const sessionId = body.sessionId;
  if (!sessionId) {
    return NextResponse.json({ success: true });
  }

  const supabase = createAdminClient();

  const { data: guestCart } = await supabase
    .from("carts")
    .select("id")
    .eq("session_id", sessionId)
    .is("customer_id", null)
    .maybeSingle();

  if (!guestCart) {
    return NextResponse.json({ success: true });
  }

  const { data: guestItems } = await supabase
    .from("cart_items")
    .select("product_id, quantity")
    .eq("cart_id", guestCart.id);

  if (!guestItems || guestItems.length === 0) {
    await supabase.from("carts").delete().eq("id", guestCart.id);
    return NextResponse.json({ success: true });
  }

  const userCartId = await getOrCreateCart(userId, null);
  if (!userCartId) {
    return NextResponse.json({ error: "Could not create cart." }, { status: 500 });
  }

  const { data: existingItems } = await supabase
    .from("cart_items")
    .select("product_id, quantity")
    .eq("cart_id", userCartId);
  const existingMap = new Map(
    (existingItems ?? []).map((i) => [i.product_id, i.quantity]),
  );

  for (const item of guestItems) {
    const current = existingMap.get(item.product_id) ?? 0;
    const merged = Math.min(99, current + item.quantity);
    if (current > 0) {
      await supabase
        .from("cart_items")
        .update({ quantity: merged })
        .eq("cart_id", userCartId)
        .eq("product_id", item.product_id);
    } else {
      await supabase.from("cart_items").insert({
        cart_id: userCartId,
        product_id: item.product_id,
        quantity: item.quantity,
      });
    }
  }

  // Remove the guest cart once merged.
  await supabase.from("carts").delete().eq("id", guestCart.id);

  return NextResponse.json({ success: true });
}
