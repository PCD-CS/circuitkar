import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  // Basic bot filter — skip known crawlers
  const ua = request.headers.get("user-agent") ?? "";
  const isBot = /bot|crawler|spider|googlebot|bingbot|yandex|slurp|duckduck|baidu|sogou|exabot|facebot|ia_archiver/i.test(ua);
  if (isBot) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const supabase = createAdminClient();

  // Atomic increment using Postgres RPC (avoids read-modify-write race)
  const { error } = await supabase.rpc("increment_blog_view", { p_slug: slug });

  if (error) {
    // Fallback: manual increment if RPC not set up yet
    const { data: post } = await supabase
      .from("blog_posts")
      .select("id, view_count")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();

    if (post) {
      await supabase
        .from("blog_posts")
        .update({ view_count: (post.view_count ?? 0) + 1 })
        .eq("id", post.id);
    }
  }

  return NextResponse.json({ ok: true });
}
