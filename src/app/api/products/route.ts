import { NextResponse, type NextRequest } from "next/server";
import { getProducts } from "@/lib/products";
import type { ProductSort } from "@/types";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  try {
    const result = await getProducts({
      category: sp.get("category") || undefined,
      search: sp.get("search") || undefined,
      sort: (sp.get("sort") as ProductSort) || undefined,
      featured: sp.get("featured") === "true",
      page: sp.get("page") ? Number(sp.get("page")) : undefined,
      pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : undefined,
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Failed to load products." },
      { status: 500 },
    );
  }
}
