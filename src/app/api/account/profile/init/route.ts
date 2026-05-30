import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Called right after signup to persist extended profile fields
 * (phone / business). Uses the service role to upsert the profile row that
 * the auth trigger created. Only writes fields for the supplied userId.
 */
export async function POST(request: NextRequest) {
  let body: {
    userId?: string;
    full_name?: string;
    phone?: string | null;
    account_type?: string;
    business_name?: string | null;
    gstin?: string | null;
    pan?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }
  if (!body.userId) {
    return NextResponse.json({ error: "userId is required." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("customer_profiles").upsert(
    {
      id: body.userId,
      full_name: body.full_name ?? null,
      phone: body.phone ?? null,
      account_type: body.account_type ?? "personal",
      business_name: body.business_name ?? null,
      gstin: body.gstin ?? null,
      pan: body.pan ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
