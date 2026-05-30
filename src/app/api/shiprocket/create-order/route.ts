import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import {
  getShiprocketToken,
  createShiprocketOrder,
} from "@/lib/shiprocket";
import type { Order, OrderItem, ShippingAddress } from "@/types";

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: { orderId?: string; orderNumber?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  if (!body.orderId && !body.orderNumber) {
    return NextResponse.json(
      { error: "orderId or orderNumber is required." },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  // Load Shiprocket credentials from settings
  const { data: settingsRows } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", [
      "shiprocket_email",
      "shiprocket_password",
      "shiprocket_pickup_location",
    ]);
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

  // Load the order
  const query = supabase.from("orders").select("*");
  const { data: orderRow } = body.orderId
    ? await query.eq("id", body.orderId).maybeSingle()
    : await query.eq("order_number", body.orderNumber!).maybeSingle();

  if (!orderRow) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  const order = orderRow as Order;
  const addr = order.shipping_address as ShippingAddress;
  const items = (order.items ?? []) as OrderItem[];

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

  const nameParts = (order.customer_name || "").trim().split(" ");
  const firstName = nameParts[0] || order.customer_name || "Customer";
  const lastName = nameParts.slice(1).join(" ") || ".";

  const shiprocketPayload: Record<string, unknown> = {
    order_id: order.order_number,
    order_date: new Date(order.created_at).toISOString().split("T")[0],
    pickup_location: settings.shiprocket_pickup_location || "Primary",
    billing_customer_name: firstName,
    billing_last_name: lastName,
    billing_address: addr.line1,
    billing_address_2: addr.line2 || "",
    billing_city: addr.city,
    billing_pincode: addr.pincode,
    billing_state: addr.state,
    billing_country: addr.country || "India",
    billing_email: order.customer_email,
    billing_phone: order.customer_phone || "",
    shipping_is_billing: true,
    order_items: items.map((it) => ({
      name: it.name,
      sku: it.product_id,
      units: it.qty,
      selling_price: it.price,
    })),
    payment_method: order.payment_status === "paid" ? "Prepaid" : "COD",
    sub_total: order.subtotal ?? order.total ?? 0,
    length: 10,
    breadth: 10,
    height: 5,
    weight: 0.5,
  };

  const result = await createShiprocketOrder(shiprocketPayload, token);

  if (result?.status_code && result.status_code >= 400) {
    return NextResponse.json(
      { error: result.message || "Shiprocket order creation failed.", result },
      { status: 502 },
    );
  }

  // Persist Shiprocket identifiers back to the order
  const shiprocketOrderId = result?.order_id ? String(result.order_id) : null;
  const shipmentId = result?.shipment_id ? String(result.shipment_id) : null;
  if (shiprocketOrderId) {
    await supabase
      .from("orders")
      .update({
        shiprocket_order_id: shiprocketOrderId,
        shiprocket_tracking: shipmentId
          ? `https://shiprocket.co/tracking/shipment/${shipmentId}`
          : order.shiprocket_tracking,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);
  }

  return NextResponse.json({ success: true, result });
}
