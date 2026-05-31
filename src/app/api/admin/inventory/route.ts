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

  let query = supabase
    .from("products")
    .select("id, name, sku, slug, images, price, cost_price, in_stock, stock_count, is_active, category:categories(name)")
    .order("name");

  if (search) query = query.ilike("name", `%${search}%`);
  if (filter === "out") query = query.eq("in_stock", false);
  if (filter === "low") query = query.eq("in_stock", true).lte("stock_count", lowStockThreshold).gt("stock_count", 0);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ products: data ?? [], lowStockThreshold });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: { productId: string; action: "add" | "remove" | "set"; quantity: number; note?: string };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid body." }, { status: 400 }); }

  const supabase = createAdminClient();
  const { data: product } = await supabase
    .from("products")
    .select("stock_count, in_stock")
    .eq("id", body.productId)
    .maybeSingle();

  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  let newStock = product.stock_count ?? 0;
  let eventType: string;
  let qtyChange: number;

  if (body.action === "set") {
    qtyChange = body.quantity - newStock;
    newStock = body.quantity;
    eventType = "adjustment";
  } else if (body.action === "add") {
    qtyChange = body.quantity;
    newStock = newStock + body.quantity;
    eventType = "restock";
  } else {
    qtyChange = -body.quantity;
    newStock = Math.max(0, newStock - body.quantity);
    eventType = "adjustment";
  }

  await supabase.from("products").update({
    stock_count: newStock,
    in_stock: newStock > 0,
    updated_at: new Date().toISOString(),
  }).eq("id", body.productId);

  await supabase.from("inventory_events").insert({
    product_id: body.productId,
    event_type: eventType,
    quantity_change: qtyChange,
    notes: body.note || `Manual ${body.action} by admin`,
  });

  return NextResponse.json({ stock_count: newStock });
}
