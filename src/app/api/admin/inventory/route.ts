import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const productId = searchParams.get("productId");

  const supabase = createAdminClient();

  if (productId) {
    // Inventory events for a specific product
    const { data: events } = await supabase
      .from("inventory_events")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(50);
    return NextResponse.json({ events: events ?? [] });
  }

  // Full inventory list
  const settings = await getSettings();
  const lowStockThreshold = parseInt(settings.low_stock_threshold || "5");
  const search = searchParams.get("search")?.trim() ?? "";
  const filter = searchParams.get("filter") ?? "all"; // all | low | out
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "25")));
  const sortByRaw = searchParams.get("sortBy") ?? "name";
  const sortBy = ["name", "stock_count", "price"].includes(sortByRaw) ? sortByRaw : "name";
  const sortAsc = searchParams.get("sortDir") !== "desc";

  let query = supabase
    .from("products")
    .select("id, name, sku, slug, images, price, cost_price, in_stock, stock_count, is_active, category:categories(name)", { count: "exact" })
    .order(sortBy, { ascending: sortAsc })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (search) query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
  if (filter === "out") query = query.eq("in_stock", false);
  if (filter === "low") query = query.eq("in_stock", true).lte("stock_count", lowStockThreshold).gt("stock_count", 0);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Summary counts (unfiltered, for stat cards)
  const [{ count: lowCount }, { count: outCount }] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }).eq("in_stock", true).lte("stock_count", lowStockThreshold).gt("stock_count", 0),
    supabase.from("products").select("*", { count: "exact", head: true }).eq("in_stock", false),
  ]);

  return NextResponse.json({
    products: data ?? [],
    total: count ?? 0,
    lowStockThreshold,
    summary: { low: lowCount ?? 0, out: outCount ?? 0 },
  });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: { productId: string; action: "add" | "remove" | "set"; quantity: number; note?: string };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid body." }, { status: 400 }); }

  if (!body.productId) return NextResponse.json({ error: "productId is required." }, { status: 400 });
  if (!["add", "remove", "set"].includes(body.action)) {
    return NextResponse.json({ error: "action must be 'add', 'remove', or 'set'." }, { status: 400 });
  }
  const qty = Number(body.quantity);
  if (isNaN(qty) || !Number.isInteger(qty)) {
    return NextResponse.json({ error: "quantity must be a whole number." }, { status: 400 });
  }
  if (body.action === "set" && qty < 0) {
    return NextResponse.json({ error: "quantity cannot be negative when setting stock." }, { status: 400 });
  }
  if ((body.action === "add" || body.action === "remove") && qty < 1) {
    return NextResponse.json({ error: "quantity must be at least 1 for add/remove." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: product } = await supabase
    .from("products")
    .select("stock_count, in_stock")
    .eq("id", body.productId)
    .maybeSingle();

  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const prevStock = product.stock_count ?? 0;
  let newStock = prevStock;
  let eventType: string;
  let qtyChange: number;

  if (body.action === "set") {
    qtyChange = body.quantity - prevStock;
    newStock = body.quantity;
    eventType = prevStock === 0 && body.quantity > 0 ? "restock" : "adjustment";
  } else if (body.action === "add") {
    qtyChange = body.quantity;
    newStock = prevStock + body.quantity;
    eventType = prevStock === 0 ? "restock" : "restock";
  } else {
    qtyChange = -body.quantity;
    newStock = Math.max(0, prevStock - body.quantity);
    eventType = "adjustment";
  }

  await supabase.from("products").update({
    stock_count: newStock,
    in_stock: newStock > 0,
    updated_at: new Date().toISOString(),
  }).eq("id", body.productId);

  const absVal = Math.abs(qtyChange);
  const direction = qtyChange > 0 ? `+${absVal} added` : `${qtyChange} removed`;
  const autoNote = body.action === "set"
    ? `Set to ${newStock} (was ${prevStock})`
    : `${direction} — was ${prevStock}, now ${newStock}`;

  await supabase.from("inventory_events").insert({
    product_id: body.productId,
    event_type: eventType,
    quantity_change: qtyChange,
    notes: body.note ? `${body.note} — ${autoNote}` : autoNote,
  });

  return NextResponse.json({ stock_count: newStock });
}
