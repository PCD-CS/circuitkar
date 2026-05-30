import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }

  // Best-effort view count increment.
  await supabase
    .from("blog_posts")
    .update({ view_count: (data.view_count ?? 0) + 1 })
    .eq("id", data.id);

  return NextResponse.json({ post: data });
}
