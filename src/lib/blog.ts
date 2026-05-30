import { createAdminClient } from "@/lib/supabase/admin";
import type { BlogPost } from "@/types";

export interface BlogListItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  tags: string[] | null;
  author_name: string;
  published_at: string | null;
  view_count: number;
}

export async function getPublishedPosts(opts: {
  page?: number;
  pageSize?: number;
  search?: string;
  tag?: string;
} = {}): Promise<{ posts: BlogListItem[]; total: number }> {
  const supabase = createAdminClient();
  const page = opts.page && opts.page > 0 ? opts.page : 1;
  const pageSize = opts.pageSize && opts.pageSize > 0 ? opts.pageSize : 9;

  let query = supabase
    .from("blog_posts")
    .select(
      "id, title, slug, excerpt, cover_image, tags, author_name, published_at, view_count",
      { count: "exact" },
    )
    .eq("is_published", true);

  if (opts.search) {
    query = query.or(
      `title.ilike.%${opts.search}%,excerpt.ilike.%${opts.search}%`,
    );
  }
  if (opts.tag) {
    query = query.contains("tags", [opts.tag]);
  }

  query = query
    .order("published_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const { data, count } = await query;
  return { posts: (data as BlogListItem[]) ?? [], total: count ?? 0 };
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  return (data as BlogPost) ?? null;
}

export async function getRelatedPosts(
  excludeId: string,
  tags: string[] | null,
  limit = 3,
): Promise<BlogListItem[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from("blog_posts")
    .select(
      "id, title, slug, excerpt, cover_image, tags, author_name, published_at, view_count",
    )
    .eq("is_published", true)
    .neq("id", excludeId);
  if (tags && tags.length) {
    query = query.overlaps("tags", tags);
  }
  const { data } = await query
    .order("published_at", { ascending: false })
    .limit(limit);
  return (data as BlogListItem[]) ?? [];
}

export async function getAllTags(): Promise<string[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("tags")
    .eq("is_published", true);
  const set = new Set<string>();
  for (const row of data ?? []) {
    for (const t of (row.tags as string[] | null) ?? []) set.add(t);
  }
  return Array.from(set).sort();
}
