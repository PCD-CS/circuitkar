import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import type { StatusHistoryEntry } from "@/types";

const VALID_STATUSES = [
  "pending",
  "confirmed",
  "accepted",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
];

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

  const supabase = createAdminClient();
  const column = isUuid(id) ? "id" : "order_number";

  // Fetch current order for history and inventory restore
  const { data: current } = await supabase
    .from("orders")
    .select("*")
    .eq(column, id)
    .maybeSingle();

  if (!current) return NextResponse.json({ error: "Order not found." }, { status: 404 });

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

  return NextResponse.json({ order: data });
}
