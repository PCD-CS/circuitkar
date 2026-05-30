import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";

const VALID_STATUSES = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

/** `id` may be a UUID or an order_number (CK-...). */
function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = createAdminClient();
  const column = isUuid(id) ? "id" : "order_number";
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq(column, id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  return NextResponse.json({ order: data });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: { status?: string; shiprocket_tracking?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  if (body.status && !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (body.status) update.status = body.status;
  if (typeof body.shiprocket_tracking === "string") {
    update.shiprocket_tracking = body.shiprocket_tracking;
  }

  const supabase = createAdminClient();
  const column = isUuid(id) ? "id" : "order_number";
  const { data, error } = await supabase
    .from("orders")
    .update(update)
    .eq(column, id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ order: data });
}
