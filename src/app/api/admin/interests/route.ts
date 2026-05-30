import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const productId = request.nextUrl.searchParams.get("productId");
  const supabase = createAdminClient();
  let query = supabase
    .from("product_interests")
    .select("*, product:products(id, name, slug)")
    .order("created_at", { ascending: false });
  if (productId) query = query.eq("product_id", productId);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ interests: data });
}
