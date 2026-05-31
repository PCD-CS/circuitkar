import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSettings } from "@/lib/settings";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const orderNumber = searchParams.get("orderNumber");
  const email = searchParams.get("email");

  if (!orderNumber || !email) {
    return NextResponse.json(
      { error: "Order number and email are required." },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const { data: order } = await supabase
    .from("orders")
    .select(
      "order_number, status, payment_status, shipping_address, items, subtotal, shipping_charge, total, shiprocket_tracking, courier_name, tracking_number, tracking_url, created_at, updated_at",
    )
    .eq("order_number", orderNumber.trim().toUpperCase())
    .eq("customer_email", email.trim().toLowerCase())
    .maybeSingle();

  if (!order) {
    return NextResponse.json(
      { error: "Order not found. Check your order number and email." },
      { status: 404 },
    );
  }

  const settings = await getSettings();
  return NextResponse.json({ order, whatsappNumber: settings.whatsapp_number });
}
