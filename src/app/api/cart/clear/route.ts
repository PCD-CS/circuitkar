import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserId, findCartId, sessionIdFromRequest } from "@/lib/cart";

export async function DELETE(request: NextRequest) {
  const userId = await getCurrentUserId();
  const sessionId = sessionIdFromRequest(request);
  const cartId = await findCartId(userId, sessionId);
  if (!cartId) {
    return NextResponse.json({ items: [] });
  }
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("cart_id", cartId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ items: [] });
}
