import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ posts: data ?? [] });
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
