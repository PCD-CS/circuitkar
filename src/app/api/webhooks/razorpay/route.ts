import { NextResponse, type NextRequest } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, getEmailConfig } from "@/lib/resend";
import type { StatusHistoryEntry } from "@/types";

/**
 * Razorpay sends a webhook signature in the header X-Razorpay-Signature.
 * Verify it against the webhook secret (different from key secret).
 */
function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";

  // Webhook secret comes from env (set in Razorpay dashboard → Webhooks)
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET ?? "";

  if (webhookSecret && signature) {
    if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      console.error("[webhook:razorpay] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
  }

  let event: { event: string; payload: Record<string, unknown> };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const eventType = event.event;

  try {
    // payment.captured — payment succeeded
    if (eventType === "payment.captured") {
      const payment = (event.payload?.payment as Record<string, unknown>)?.entity as Record<string, unknown>;
      const razorpayOrderId = payment?.order_id as string;
      if (!razorpayOrderId) return NextResponse.json({ ok: true });

      const { data: order } = await supabase
        .from("orders")
        .select("*")
        .eq("razorpay_order_id", razorpayOrderId)
        .maybeSingle();

      if (order && order.payment_status !== "paid") {
        const history: StatusHistoryEntry[] = [
          ...(Array.isArray(order.status_history) ? order.status_history : []),
          { status: "confirmed", timestamp: new Date().toISOString(), note: "Payment captured (webhook)" },
        ];
        await supabase.from("orders").update({
          payment_status: "paid",
          status: "confirmed",
          status_history: history,
          updated_at: new Date().toISOString(),
        }).eq("id", order.id);
      }
    }

    // payment.failed — payment failed
    if (eventType === "payment.failed") {
      const payment = (event.payload?.payment as Record<string, unknown>)?.entity as Record<string, unknown>;
      const razorpayOrderId = payment?.order_id as string;
      if (!razorpayOrderId) return NextResponse.json({ ok: true });

      await supabase.from("orders")
        .update({ payment_status: "failed", updated_at: new Date().toISOString() })
        .eq("razorpay_order_id", razorpayOrderId)
        .eq("payment_status", "pending");
    }

    // refund.created / refund.processed
    if (eventType === "refund.created" || eventType === "refund.processed") {
      const refund = (event.payload?.refund as Record<string, unknown>)?.entity as Record<string, unknown>;
      const paymentId = refund?.payment_id as string;
      if (!paymentId) return NextResponse.json({ ok: true });

      const { data: order } = await supabase
        .from("orders")
        .select("*")
        .eq("razorpay_payment_id", paymentId)
        .maybeSingle();

      if (order) {
        const history: StatusHistoryEntry[] = [
          ...(Array.isArray(order.status_history) ? order.status_history : []),
          { status: "cancelled", timestamp: new Date().toISOString(), note: `Refund ${eventType === "refund.processed" ? "processed" : "initiated"} via Razorpay` },
        ];
        await supabase.from("orders").update({
          payment_status: "refunded",
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          status_history: history,
          updated_at: new Date().toISOString(),
        }).eq("id", order.id);

        // Restore stock
        const orderItems = Array.isArray(order.items) ? order.items : [];
        for (const item of orderItems) {
          if (!item.product_id || !item.qty) continue;
          const { data: prod } = await supabase.from("products").select("stock_count").eq("id", item.product_id).maybeSingle();
          if (prod) {
            await supabase.from("products").update({
              stock_count: (prod.stock_count ?? 0) + item.qty,
              in_stock: true,
              updated_at: new Date().toISOString(),
            }).eq("id", item.product_id);
          }
        }

        // Send refund email
        try {
          const emailConfig = await getEmailConfig();
          const resend = await getResendClient();
          if (resend && order.customer_email) {
            await resend.emails.send({
              from: emailConfig.from,
              to: order.customer_email,
              subject: `Refund initiated for order #${order.order_number} — Circuitkar`,
              html: `<p>Hi ${order.customer_name || "there"},</p><p>A refund has been initiated for your order <strong>#${order.order_number}</strong>. Refunds typically take 5-7 business days to reflect in your account.</p><p>If you have questions, reply to this email or WhatsApp us.</p>`,
            });
          }
        } catch (e) { console.error("Refund email failed", e); }
      }
    }
  } catch (e) {
    console.error("[webhook:razorpay] processing error", e);
  }

  return NextResponse.json({ received: true });
}
