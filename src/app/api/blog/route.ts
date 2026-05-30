import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const pageSize = Math.min(24, parseInt(searchParams.get("pageSize") || "9"));
  const search = searchParams.get("search") || "";
  const tag = searchParams.get("tag") || "";

  const supabase = createAdminClient();
  let query = supabase
    .from("blog_posts")
    .select(
      "id, title, slug, excerpt, cover_image, tags, author_name, published_at, view_count",
      { count: "exact" },
    )
    .eq("is_published", true);

  if (search) {
    query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%`);
  }
  if (tag) {
    query = query.contains("tags", [tag]);
  }

  query = query
    .order("published_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const { data, count, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({
    posts: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
  });
}
