import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const approved = searchParams.get("approved"); // "true"|"false"|null

  const supabase = createAdminClient();
  // customer_reviews.customer_id → auth.users, not customer_profiles, so PostgREST
  // can't resolve the join inline. Fetch product join only, then enrich with a
  // second query to customer_profiles (same id as auth user id).
  let query = supabase
    .from("product_reviews")
    .select("*, product:products(name, slug)")
    .order("created_at", { ascending: false });

  if (approved === "true") query = query.eq("is_approved", true);
  // Pending = explicitly false OR null (newly submitted before moderation sets it)
  if (approved === "false") query = query.or("is_approved.is.null,is_approved.eq.false");

  const { data: reviews, error } = await query.limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enrich with customer names from customer_profiles
  const customerIds = [...new Set((reviews ?? []).map(r => r.customer_id).filter(Boolean))];
  let customerMap: Record<string, string | null> = {};
  if (customerIds.length > 0) {
    const { data: profiles } = await supabase
      .from("customer_profiles")
      .select("id, full_name")
      .in("id", customerIds);
    customerMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p.full_name]));
  }

  const enriched = (reviews ?? []).map(r => ({
    ...r,
    customer: r.customer_id ? { full_name: customerMap[r.customer_id] ?? null } : null,
  }));

  return NextResponse.json({ reviews: enriched });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: { id: string; is_approved: boolean };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid body." }, { status: 400 }); }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("product_reviews")
    .update({ is_approved: body.is_approved, updated_at: new Date().toISOString() })
    .eq("id", body.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
