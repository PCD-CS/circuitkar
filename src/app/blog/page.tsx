import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { FileText } from "lucide-react";
import { getPublishedPosts, getAllTags } from "@/lib/blog";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog — Guides & Tutorials",
  description:
    "Electronics tutorials, project guides and component deep-dives from the Circuitkar team.",
};

const PAGE_SIZE = 9;

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; tag?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || "1"));
  const search = sp.search || "";
  const tag = sp.tag || "";

  const [{ posts, total }, tags] = await Promise.all([
    getPublishedPosts({ page, pageSize: PAGE_SIZE, search, tag }),
    getAllTags(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function buildHref(params: Record<string, string | number | undefined>) {
    const q = new URLSearchParams();
    if (search) q.set("search", search);
    if (tag) q.set("tag", tag);
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === "") q.delete(k);
      else q.set(k, String(v));
    }
    const s = q.toString();
    return `/blog${s ? `?${s}` : ""}`;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#F5F5F5]">Circuitkar Blog</h1>
        <p className="mt-2 text-[#A3A3A3]">
          Tutorials, project guides and component deep-dives.
        </p>
      </div>

      <form action="/blog" className="mb-6 flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          name="search"
          defaultValue={search}
          placeholder="Search articles"
          className="flex-1 rounded-lg border border-[#262626] bg-[#111111] px-4 py-2.5 text-sm text-[#F5F5F5] placeholder:text-[#525252] focus:border-[#F97316] focus:outline-none"
        />
        {tag && <input type="hidden" name="tag" value={tag} />}
      </form>

      {tags.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <Link
            href={buildHref({ tag: undefined, page: undefined })}
            className={`rounded-lg border px-3 py-1 text-xs ${
              !tag
                ? "border-[#F97316] bg-[#F9731615] text-[#F97316]"
                : "border-[#262626] text-[#A3A3A3] hover:text-[#F5F5F5]"
            }`}
          >
            All
          </Link>
          {tags.map((t) => (
            <Link
              key={t}
              href={buildHref({ tag: t, page: undefined })}
              className={`rounded-lg border px-3 py-1 text-xs ${
                tag === t
                  ? "border-[#F97316] bg-[#F9731615] text-[#F97316]"
                  : "border-[#262626] text-[#A3A3A3] hover:text-[#F5F5F5]"
              }`}
            >
              {t}
            </Link>
          ))}
        </div>
      )}

      {posts.length === 0 ? (
        <div className="rounded-lg border border-[#262626] bg-[#161616] p-12 text-center">
          <FileText className="mx-auto mb-2 h-8 w-8 text-[#525252]" />
          <p className="text-[#A3A3A3]">No articles found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group flex flex-col overflow-hidden rounded-lg border border-[#262626] bg-[#161616] transition-all hover:-translate-y-0.5 hover:border-[#F97316]/40"
            >
              <div className="relative aspect-[16/9] bg-[#111111]">
                {post.cover_image ? (
                  <Image
                    src={post.cover_image}
                    alt={post.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <FileText className="h-10 w-10 text-[#262626]" />
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-4">
                {post.tags && post.tags.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1">
                    {post.tags.slice(0, 2).map((t) => (
                      <Badge key={t} variant="category">
                        {t}
                      </Badge>
                    ))}
                  </div>
                )}
                <h2 className="text-base font-semibold leading-snug text-[#F5F5F5] transition-colors group-hover:text-[#F97316]">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="mt-2 line-clamp-2 text-sm text-[#A3A3A3]">
                    {post.excerpt}
                  </p>
                )}
                <p className="mt-3 text-xs text-[#525252]">
                  {post.author_name} ·{" "}
                  {post.published_at
                    ? new Date(post.published_at).toLocaleDateString("en-IN")
                    : ""}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-3">
          {page > 1 && (
            <Link
              href={buildHref({ page: page - 1 })}
              className="rounded-lg border border-[#262626] px-4 py-2 text-sm text-[#A3A3A3] hover:text-[#F5F5F5]"
            >
              Previous
            </Link>
          )}
          <span className="text-xs text-[#525252]">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={buildHref({ page: page + 1 })}
              className="rounded-lg border border-[#262626] px-4 py-2 text-sm text-[#A3A3A3] hover:text-[#F5F5F5]"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
