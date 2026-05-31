import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const page     = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "25")));
  const search   = searchParams.get("search")?.trim() ?? "";
  const sortByRaw = searchParams.get("sortBy") ?? "created_at";
  const sortDir   = searchParams.get("sortDir") === "asc";
  const published = searchParams.get("published"); // "true" | "false" | null
  const sortBy    = ["title", "created_at", "view_count", "published_at"].includes(sortByRaw)
    ? sortByRaw : "created_at";

  const supabase = createAdminClient();
  let query = supabase
    .from("blog_posts")
    .select("*", { count: "exact" })
    .order(sortBy, { ascending: sortDir })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (search) {
    query = query.or(`title.ilike.%${search}%,slug.ilike.%${search}%,excerpt.ilike.%${search}%`);
  }
  if (published === "true") query = query.eq("is_published", true);
  if (published === "false") query = query.eq("is_published", false);

  const { data, error, count } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ posts: data ?? [], total: count ?? 0, page, pageSize });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }
  if (!body.title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  const slug = (body.slug as string)?.trim() || slugify(body.title as string);
  const isPublished = body.is_published === true;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .insert({
      title: body.title,
      slug,
      excerpt: body.excerpt || null,
      content: body.content || null,
      cover_image: body.cover_image || null,
      tags: Array.isArray(body.tags) ? body.tags : [],
      is_published: isPublished,
      published_at: isPublished ? new Date().toISOString() : null,
      author_name: body.author_name || "Circuitkar Team",
      seo_title: body.seo_title || null,
      seo_description: body.seo_description || null,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ post: data }, { status: 201 });
}
