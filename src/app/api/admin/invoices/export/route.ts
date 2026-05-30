import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import type { OrderItem } from "@/types";

const VALID_STATUSES = ["pending","confirmed","accepted","packed","shipped","delivered","cancelled"];

function escapeCsv(val: unknown): string {
  const s = String(val ?? "").replace(/"/g, '""');
  return /[",\n\r]/.test(s) ? `"${s}"` : s;
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status") || "";
  const search = searchParams.get("search")?.trim() || "";
  const from  = searchParams.get("from") || "";
  const to    = searchParams.get("to") || "";

  const supabase = createAdminClient();
  let query = supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5000);

  if (status && VALID_STATUSES.includes(status)) query = query.eq("status", status);
  if (search) query = query.or(`order_number.ilike.%${search}%,customer_email.ilike.%${search}%,customer_name.ilike.%${search}%`);
  if (from) query = query.gte("created_at", `${from}T00:00:00Z`);
  if (to)   query = query.lte("created_at", `${to}T23:59:59Z`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const orders = data ?? [];

  const headers = [
    "Order Number", "Date", "Customer Name", "Email", "Phone",
    "Status", "Payment Status", "Is Test",
    "Items", "Item SKUs",
    "Subtotal (₹)", "Shipping (₹)", "Total (₹)",
    "GST Invoice", "GSTIN", "Business Name",
    "Shipping Name", "Line 1", "Line 2", "City", "State", "Pincode",
    "Courier", "Tracking Number", "Tracking URL",
    "Razorpay Order ID", "Razorpay Payment ID",
  ];

  const rows = orders.map((o) => {
    const addr = (o.shipping_address ?? {}) as Record<string, string>;
    const items = (o.items ?? []) as OrderItem[];
    const itemSummary = items.map(i => `${i.name} x${i.qty}`).join("; ");
    return [
      o.order_number,
      new Date(o.created_at).toLocaleDateString("en-IN"),
      o.customer_name,
      o.customer_email,
      o.customer_phone ?? "",
      o.status,
      o.payment_status,
      o.is_test_order ? "YES" : "NO",
      itemSummary,
      items.map(i => i.product_id).join("; "),
      o.subtotal ?? 0,
      o.shipping_charge ?? 0,
      o.total ?? 0,
      o.gstin ? "YES" : "NO",
      o.gstin ?? "",
      o.business_name ?? "",
      addr.full_name ?? "",
      addr.line1 ?? "",
      addr.line2 ?? "",
      addr.city ?? "",
      addr.state ?? "",
      addr.pincode ?? "",
      o.courier_name ?? "",
      o.tracking_number ?? "",
      o.tracking_url ?? "",
      o.razorpay_order_id ?? "",
      o.razorpay_payment_id ?? "",
    ].map(escapeCsv).join(",");
  });

  const csv = [headers.map(escapeCsv).join(","), ...rows].join("\r\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="circuitkar-orders-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
