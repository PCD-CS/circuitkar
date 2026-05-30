import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { CartItemWithProduct } from "@/types";

const CART_PRODUCT_SELECT =
  "id, product_id, quantity, product:products(id, name, slug, price, compare_price, images, in_stock, stock_count)";

/** Resolve the current customer id from the Supabase session, if any. */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Find or create a cart for the given user or guest session.
 * Authenticated users always take precedence over the session id.
 */
export async function getOrCreateCart(
  userId: string | null,
  sessionId: string | null,
): Promise<string | null> {
  const supabase = createAdminClient();

  if (userId) {
    const { data: existing } = await supabase
      .from("carts")
      .select("id")
      .eq("customer_id", userId)
      .maybeSingle();
    if (existing) return existing.id;
    const { data: created } = await supabase
      .from("carts")
      .insert({ customer_id: userId })
      .select("id")
      .single();
    return created?.id ?? null;
  }

  if (sessionId) {
    const { data: existing } = await supabase
      .from("carts")
      .select("id")
      .eq("session_id", sessionId)
      .is("customer_id", null)
      .maybeSingle();
    if (existing) return existing.id;
    const { data: created } = await supabase
      .from("carts")
      .insert({ session_id: sessionId })
      .select("id")
      .single();
    return created?.id ?? null;
  }

  return null;
}

/** Look up an existing cart id without creating one. */
export async function findCartId(
  userId: string | null,
  sessionId: string | null,
): Promise<string | null> {
  const supabase = createAdminClient();
  if (userId) {
    const { data } = await supabase
      .from("carts")
      .select("id")
      .eq("customer_id", userId)
      .maybeSingle();
    return data?.id ?? null;
  }
  if (sessionId) {
    const { data } = await supabase
      .from("carts")
      .select("id")
      .eq("session_id", sessionId)
      .is("customer_id", null)
      .maybeSingle();
    return data?.id ?? null;
  }
  return null;
}

export async function getCartItems(
  cartId: string,
): Promise<CartItemWithProduct[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("cart_items")
    .select(CART_PRODUCT_SELECT)
    .eq("cart_id", cartId)
    .order("added_at", { ascending: true });
  return (data as unknown as CartItemWithProduct[]) ?? [];
}

/** Resolve the session id from the request header set by the client. */
export function sessionIdFromRequest(request: Request): string | null {
  return request.headers.get("x-cart-session") || null;
}
