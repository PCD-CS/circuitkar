import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "25")));
  const search = searchParams.get("search")?.trim() ?? "";
  const sortByRaw = searchParams.get("sortBy") ?? "created_at";
  const sortDir = searchParams.get("sortDir") === "asc";
  const sortBy = ["name", "price", "created_at"].includes(sortByRaw) ? sortByRaw : "created_at";

  const supabase = createAdminClient();
  let query = supabase
    .from("products")
    .select("*, category:categories(*)", { count: "exact" })
    .order(sortBy, { ascending: sortDir })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (search) {
    query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,slug.ilike.%${search}%`);
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ products: data ?? [], total: count ?? 0, page, pageSize });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid body." }, { status: 400 }); }

  if (!body.name || !body.slug || body.price === undefined) {
    return NextResponse.json({ error: "Name, slug and price are required." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .insert({ ...body, updated_at: new Date().toISOString() })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ product: data }, { status: 201 });
}
