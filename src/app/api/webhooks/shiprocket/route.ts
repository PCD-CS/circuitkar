import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, getEmailConfig } from "@/lib/resend";
import type { StatusHistoryEntry, OrderStatus } from "@/types";

/** Map Shiprocket status codes to our internal status */
function mapShiprocketStatus(srStatus: string): OrderStatus | null {
  const s = srStatus.toLowerCase();
  if (s.includes("delivered")) return "delivered";
  if (s.includes("out for delivery")) return "shipped";
  if (s.includes("shipped") || s.includes("in transit") || s.includes("picked up")) return "shipped";
  if (s.includes("return")) return "cancelled"; // RTO
  return null;
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Shiprocket sends: event, awb, status, shipment_status, order_id, etc.
  const srOrderId = String(body.shiprocket_order_id || body.order_id || "");
  const awb = String(body.awb || "");
  const srStatus = String(body.shipment_status || body.status || "");
  const trackingUrl = String(body.tracking_url || "");

  if (!srOrderId && !awb) {
    return NextResponse.json({ received: true }); // Unknown payload, ack
  }

  const supabase = createAdminClient();

  // Find order by Shiprocket order ID or AWB
  let orderQuery = supabase.from("orders").select("*");
  if (srOrderId) {
    orderQuery = orderQuery.eq("shiprocket_order_id", srOrderId);
  } else {
    orderQuery = orderQuery.eq("tracking_number", awb);
  }
  const { data: order } = await orderQuery.maybeSingle();

  if (!order) {
    console.warn("[webhook:shiprocket] Order not found", { srOrderId, awb });
    return NextResponse.json({ received: true });
  }

  const mappedStatus = mapShiprocketStatus(srStatus);
  const now = new Date().toISOString();
  const update: Record<string, unknown> = { updated_at: now };

  if (mappedStatus && mappedStatus !== order.status) {
    const history: StatusHistoryEntry[] = [
      ...(Array.isArray(order.status_history) ? order.status_history : []),
      { status: mappedStatus, timestamp: now, note: `Shiprocket: ${srStatus}` },
    ];
    update.status = mappedStatus;
    update.status_history = history;
    if (mappedStatus === "shipped") update.shipped_at = now;
    if (mappedStatus === "delivered") update.delivered_at = now;
  }

  if (awb && !order.tracking_number) update.tracking_number = awb;
  if (trackingUrl && !order.tracking_url) update.tracking_url = trackingUrl;

  await supabase.from("orders").update(update).eq("id", order.id);

  // Email customer on shipped/delivered status change
  if (mappedStatus && mappedStatus !== order.status) {
    try {
      const emailConfig = await getEmailConfig();
      const resend = await getResendClient();
      if (resend && order.customer_email && emailConfig.sendOrderEmails) {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://circuitkar.in";
        if (mappedStatus === "shipped") {
          await resend.emails.send({
            from: emailConfig.from,
            to: order.customer_email,
            subject: `Your order #${order.order_number} has been shipped — Circuitkar`,
            html: `<p>Hi ${order.customer_name || "there"},</p><p>Great news! Your order <strong>#${order.order_number}</strong> has been shipped.</p>${awb ? `<p>AWB/Tracking: <strong>${awb}</strong></p>` : ""}${trackingUrl ? `<p><a href="${trackingUrl}">Track your shipment →</a></p>` : ""}<p><a href="${siteUrl}/account/orders/${order.order_number}">View order details →</a></p>`,
          });
        }
        if (mappedStatus === "delivered") {
          await resend.emails.send({
            from: emailConfig.from,
            to: order.customer_email,
            subject: `Order #${order.order_number} delivered — Circuitkar`,
            html: `<p>Hi ${order.customer_name || "there"},</p><p>Your order <strong>#${order.order_number}</strong> has been delivered. We hope you love your components!</p><p>If anything is wrong, please contact us within 48 hours.</p><p><a href="${siteUrl}/account/orders/${order.order_number}">View order →</a></p>`,
          });
        }
      }
    } catch (e) { console.error("Webhook email failed", e); }
  }

  return NextResponse.json({ received: true });
}
