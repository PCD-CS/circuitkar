import { NextResponse, type NextRequest } from "next/server";
import { getCustomerId } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createRazorpayOrder } from "@/lib/razorpay";

export async function POST(request: NextRequest) {
  const customerId = await getCustomerId();
  if (!customerId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let body: { amount: number; receipt: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: settingsRows } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", [
      "razorpay_use_live",
      "razorpay_key_id_live",
      "razorpay_key_secret_live",
      "razorpay_key_id_test",
      "razorpay_key_secret_test",
    ]);

  const s: Record<string, string> = {};
  for (const row of settingsRows ?? []) {
    if (row.value && row.value.trim()) s[row.key] = row.value.trim();
  }

  const useLive = s.razorpay_use_live === "true";

  // Pick keys — test keys fall back to env vars
  const keyId = useLive
    ? (s.razorpay_key_id_live || "")
    : (s.razorpay_key_id_test || process.env.RAZORPAY_KEY_ID || "");

  const keySecret = useLive
    ? (s.razorpay_key_secret_live || "")
    : (s.razorpay_key_secret_test || process.env.RAZORPAY_KEY_SECRET || "");

  if (!keyId || !keySecret) {
    const mode = useLive ? "live" : "test";
    const hint = useLive
      ? "Add your live Razorpay keys in Admin → Settings → Payments tab."
      : "Add your test Razorpay keys in Admin → Settings → Payments tab, then save.";
    return NextResponse.json(
      {
        error: `Razorpay ${mode} keys not configured. ${hint}`,
        debug: { useLive, hasKeyId: !!keyId, hasSecret: !!keySecret },
      },
      { status: 503 },
    );
  }

  try {
    const order = await createRazorpayOrder(
      Math.round(body.amount * 100),
      "INR",
      body.receipt,
      keyId,
      keySecret,
    );
    return NextResponse.json({ orderId: order.id, keyId, amount: order.amount });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Razorpay order creation failed." },
      { status: 500 },
    );
  }
}
