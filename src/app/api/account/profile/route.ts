import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCustomerId } from "@/lib/auth";

export async function GET() {
  const userId = await getCustomerId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("customer_profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ profile: data });
}

export async function PUT(request: Request) {
  const userId = await getCustomerId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  // Only allow updating profile-owned columns.
  const allowed = [
    "full_name",
    "phone",
    "account_type",
    "business_name",
    "gstin",
    "pan",
    "email_notifications",
    "whatsapp_notifications",
  ] as const;
  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("customer_profiles")
    .upsert({ id: userId, ...update }, { onConflict: "id" })
    .select("*")
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ profile: data });
}
