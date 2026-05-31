import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { getResendClient, getEmailConfig } from "@/lib/resend";
import { ShippingConfirmationEmail } from "@/lib/emails/shipping-confirmation";
import { OrderCancelledEmail } from "@/lib/emails/order-cancelled";
import type { StatusHistoryEntry } from "@/types";

const VALID_STATUSES = [
  "pending", "confirmed", "accepted", "packed", "shipped", "delivered", "cancelled",
];

// Forward-only transitions. Cancellation is always allowed from admin.
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending:   ["confirmed", "cancelled"],
  confirmed: ["accepted", "cancelled"],
  accepted:  ["packed",    "cancelled"],
  packed:    ["shipped",   "cancelled"],
  shipped:   ["delivered", "cancelled"],
  delivered: [], // terminal
  cancelled: [], // terminal
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const supabase = createAdminClient();
  const column = isUuid(id) ? "id" : "order_number";
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq(column, id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  return NextResponse.json({ order: data });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: {
    status?: string;
    note?: string;
    courier_name?: string;
    tracking_number?: string;
    tracking_url?: string;
    shiprocket_tracking?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  if (body.status && !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  // Enforce forward-only transitions (checked after fetching current order below)

  const supabase = createAdminClient();
  const column = isUuid(id) ? "id" : "order_number";

  // Fetch current order for history and inventory restore
  const { data: current } = await supabase
    .from("orders")
    .select("*")
    .eq(column, id)
    .maybeSingle();

  if (!current) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  // Validate forward-only transition
  if (body.status && body.status !== current.status) {
    const allowed = VALID_TRANSITIONS[current.status] ?? [];
    if (!allowed.includes(body.status)) {
      return NextResponse.json({
        error: `Cannot change status from "${current.status}" to "${body.status}". Order flow is forward-only.`,
      }, { status: 400 });
    }
  }

  const now = new Date().toISOString();
  const update: Record<string, unknown> = { updated_at: now };

  if (body.status) {
    update.status = body.status;

    // Append to status history
    const history: StatusHistoryEntry[] = Array.isArray(current.status_history)
      ? [...current.status_history]
      : [];
    history.push({ status: body.status as StatusHistoryEntry["status"], timestamp: now, note: body.note });
    update.status_history = history;

    // Timestamp for each status milestone
    if (body.status === "accepted") update.accepted_at = now;
    if (body.status === "packed") update.packed_at = now;
    if (body.status === "shipped") update.shipped_at = now;
    if (body.status === "delivered") update.delivered_at = now;
    if (body.status === "cancelled") update.cancelled_at = now;
  }

  if (typeof body.courier_name === "string") update.courier_name = body.courier_name;
  if (typeof body.tracking_number === "string") update.tracking_number = body.tracking_number;
  if (typeof body.tracking_url === "string") update.tracking_url = body.tracking_url;
  if (typeof body.shiprocket_tracking === "string") update.shiprocket_tracking = body.shiprocket_tracking;

  const { data, error } = await supabase
    .from("orders")
    .update(update)
    .eq(column, id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Restore stock when cancelling (only if not already cancelled)
  if (body.status === "cancelled" && current.status !== "cancelled") {
    const orderItems = Array.isArray(current.items) ? current.items : [];
    for (const item of orderItems) {
      const productId = item.product_id;
      const qty = item.qty ?? 0;
      if (!productId || qty <= 0) continue;

      const { data: prod } = await supabase
        .from("products")
        .select("stock_count, in_stock")
        .eq("id", productId)
        .maybeSingle();

      if (prod !== null) {
        const newStock = (prod.stock_count ?? 0) + qty;
        await supabase
          .from("products")
          .update({ stock_count: newStock, in_stock: true, updated_at: now })
          .eq("id", productId);

        // Log inventory restore
        await supabase.from("inventory_events").insert({
          product_id: productId,
          event_type: "cancel",
          quantity_change: qty,
          reference_id: current.order_number,
          notes: `Stock restored — order ${current.order_number} cancelled`,
        }).then(() => {});
      }
    }
  }

  // Send customer emails on key status changes
  if (body.status && body.status !== current.status && data) {
    try {
      const emailConfig = await getEmailConfig();
      const resend = await getResendClient();
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://circuitkar.in";
      if (resend && data.customer_email && emailConfig.sendOrderEmails) {
        if (body.status === "shipped") {
          await resend.emails.send({
            from: emailConfig.from,
            to: data.customer_email,
            subject: `Order #${data.order_number} shipped — Circuitkar`,
            react: ShippingConfirmationEmail({
              orderNumber: data.order_number,
              customerName: data.customer_name || "there",
              courierName: body.courier_name ?? data.courier_name ?? undefined,
              trackingNumber: body.tracking_number ?? data.tracking_number ?? undefined,
              trackingUrl: body.tracking_url ?? data.tracking_url ?? undefined,
              siteUrl,
            }),
          });
        }
        if (body.status === "cancelled") {
          await resend.emails.send({
            from: emailConfig.from,
            to: data.customer_email,
            subject: `Order #${data.order_number} cancelled — Circuitkar`,
            react: OrderCancelledEmail({
              orderNumber: data.order_number,
              customerName: data.customer_name || "there",
              reason: body.note ?? undefined,
              siteUrl,
            }),
          });
        }
        if (body.status === "delivered") {
          await resend.emails.send({
            from: emailConfig.from,
            to: data.customer_email,
            subject: `Order #${data.order_number} delivered — Circuitkar`,
            html: `<p>Hi ${data.customer_name || "there"},</p><p>Your order <strong>#${data.order_number}</strong> has been delivered. Enjoy your components!</p><p>If anything is wrong, contact us within 48 hours.</p>`,
          });
        }
      }
    } catch (e) { console.error("Status email error", e); }
  }

  return NextResponse.json({ order: data });
}
