import { NextResponse, type NextRequest } from "next/server";
import { getCustomerId } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyRazorpaySignature } from "@/lib/razorpay";

export async function POST(request: NextRequest) {
  const customerId = await getCustomerId();
  if (!customerId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let body: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: settingsRows } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", ["razorpay_use_live", "razorpay_key_secret_live", "razorpay_key_secret_test"]);

  const s: Record<string, string> = {};
  for (const row of settingsRows ?? []) {
    if (row.value) s[row.key] = row.value;
  }

  const useLive = s.razorpay_use_live === "true";
  const secret = useLive
    ? (s.razorpay_key_secret_live || process.env.RAZORPAY_KEY_SECRET || "")
    : (s.razorpay_key_secret_test || process.env.RAZORPAY_KEY_SECRET || "");

  if (!secret) {
    return NextResponse.json({ error: "Razorpay not configured." }, { status: 503 });
  }

  const isValid = verifyRazorpaySignature(
    body.razorpay_order_id,
    body.razorpay_payment_id,
    body.razorpay_signature,
    secret,
  );

  if (!isValid) {
    return NextResponse.json({ error: "Invalid payment signature." }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
