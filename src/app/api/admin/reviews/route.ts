import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const approved = searchParams.get("approved"); // "true"|"false"|null

  const supabase = createAdminClient();
  let query = supabase
    .from("product_reviews")
    .select("*, product:products(name, slug), customer:customer_profiles(full_name)")
    .order("created_at", { ascending: false });

  if (approved === "true") query = query.eq("is_approved", true);
  // Pending = explicitly false OR null (newly submitted before moderation sets it)
  if (approved === "false") query = query.or("is_approved.is.null,is_approved.eq.false");

  const { data, error } = await query.limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reviews: data ?? [] });
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
