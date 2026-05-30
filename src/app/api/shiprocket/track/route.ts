import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getShiprocketToken,
  trackShiprocketOrder,
} from "@/lib/shiprocket";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const shipmentId = searchParams.get("shipmentId");

  if (!shipmentId) {
    return NextResponse.json(
      { error: "shipmentId query param is required." },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const { data: settingsRows } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", ["shiprocket_email", "shiprocket_password"]);
  const settings: Record<string, string> = {};
  for (const row of settingsRows ?? []) settings[row.key] = row.value ?? "";

  const email = settings.shiprocket_email;
  const password = settings.shiprocket_password;
  if (!email || !password) {
    return NextResponse.json(
      { error: "Shiprocket credentials are not configured." },
      { status: 400 },
    );
  }

  let token: string;
  try {
    token = await getShiprocketToken(email, password);
  } catch {
    return NextResponse.json(
      { error: "Shiprocket authentication failed." },
      { status: 502 },
    );
  }
  if (!token) {
    return NextResponse.json(
      { error: "Shiprocket authentication failed." },
      { status: 502 },
    );
  }

  const tracking = await trackShiprocketOrder(shipmentId, token);
  return NextResponse.json({ tracking });
}
