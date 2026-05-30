import { createClient } from "@/lib/supabase/server";

/**
 * Verifies an authenticated admin for API routes. Returns the user
 * if a valid Supabase session is present, otherwise null. Admin access
 * is also allowed via the service-role key in the `x-admin-key` header
 * (useful for server-to-server / scripts).
 */
export async function requireAdmin(
  request: Request,
): Promise<{ ok: true } | { ok: false }> {
  const headerKey = request.headers.get("x-admin-key");
  if (headerKey && headerKey === process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: true };
  }

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) return { ok: true };
  } catch {
    // fall through
  }
  return { ok: false };
}
