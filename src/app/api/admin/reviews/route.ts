import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";

// Tri-state:
//   pending  → is_approved = false, is_rejected = false
//   approved → is_approved = true
//   rejected → is_rejected = true

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const tab = searchParams.get("tab"); // "pending" | "approved" | "rejected"

  const supabase = createAdminClient();
  // customer_reviews.customer_id → auth.users, not customer_profiles, so PostgREST
  // can't resolve the join inline. Fetch product join only, then enrich with a
  // second query to customer_profiles (same id as auth user id).
  let query = supabase
    .from("product_reviews")
    .select("*, product:products(name, slug)")
    .order("created_at", { ascending: false });

  if (tab === "approved") {
    query = query.eq("is_approved", true);
  } else if (tab === "rejected") {
    query = query.eq("is_rejected", true);
  } else {
    // pending: not approved, not rejected
    query = query.eq("is_approved", false).eq("is_rejected", false);
  }

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

  let body: { id: string; action: "approve" | "reject" | "restore" };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid body." }, { status: 400 }); }

  if (!body.id || !["approve", "reject", "restore"].includes(body.action)) {
    return NextResponse.json({ error: "id and action (approve|reject|restore) are required." }, { status: 400 });
  }

  const supabase = createAdminClient();

  let update: Record<string, unknown>;
  if (body.action === "approve") {
    update = { is_approved: true, is_rejected: false };
  } else if (body.action === "reject") {
    update = { is_approved: false, is_rejected: true };
  } else {
    // restore → back to pending
    update = { is_approved: false, is_rejected: false };
  }

  const { error } = await supabase
    .from("product_reviews")
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq("id", body.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
