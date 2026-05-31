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
    .from("customer_addresses")
    .select("*")
    .eq("customer_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ addresses: data ?? [] });
}

export async function POST(request: Request) {
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

  const required = ["full_name", "phone", "line1", "city", "state", "pincode"];
  for (const f of required) {
    if (!body[f]) {
      return NextResponse.json({ error: `Missing field: ${f}` }, { status: 400 });
    }
  }
  const phone = String(body.phone).replace(/\D/g, "");
  if (phone.length !== 10 || !/^[6-9]/.test(phone)) {
    return NextResponse.json({ error: "Phone must be a valid 10-digit Indian mobile number." }, { status: 400 });
  }
  const pincode = String(body.pincode).replace(/\D/g, "");
  if (pincode.length !== 6) {
    return NextResponse.json({ error: "Pincode must be exactly 6 digits." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const isDefault = body.is_default === true;
  if (isDefault) {
    await supabase
      .from("customer_addresses")
      .update({ is_default: false })
      .eq("customer_id", userId);
  }

  const { data, error } = await supabase
    .from("customer_addresses")
    .insert({
      customer_id: userId,
      label: body.label || "Home",
      full_name: body.full_name,
      phone: body.phone,
      line1: body.line1,
      line2: body.line2 || null,
      city: body.city,
      state: body.state,
      pincode: body.pincode,
      country: body.country || "India",
      is_default: isDefault,
    })
    .select("*")
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ address: data }, { status: 201 });
}
