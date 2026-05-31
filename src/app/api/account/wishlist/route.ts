import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCustomerId } from "@/lib/auth";

export async function GET() {
  const customerId = await getCustomerId();
  if (!customerId) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("wishlists")
    .select("id, product_id, created_at, product:products(id, name, slug, price, compare_price, images, in_stock, stock_count)")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  return NextResponse.json({ items: data ?? [] });
}

export async function POST(request: NextRequest) {
  const customerId = await getCustomerId();
  if (!customerId) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: { productId: string };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid body." }, { status: 400 }); }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("wishlists")
    .upsert({ customer_id: customerId, product_id: body.productId }, { onConflict: "customer_id,product_id" })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ id: data.id }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const customerId = await getCustomerId();
  if (!customerId) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  if (!productId) return NextResponse.json({ error: "productId required." }, { status: 400 });

  const supabase = createAdminClient();
  await supabase.from("wishlists").delete()
    .eq("customer_id", customerId).eq("product_id", productId);

  return NextResponse.json({ ok: true });
}
