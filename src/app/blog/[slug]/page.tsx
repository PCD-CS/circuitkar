import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getPostBySlug, getRelatedPosts } from "@/lib/blog";
import { createAdminClient } from "@/lib/supabase/admin";
import { RichTextRenderer } from "@/components/ui/RichTextRenderer";
import { Badge } from "@/components/ui/Badge";
import { ShareButtons } from "@/components/blog/ShareButtons";

export const dynamic = "force-dynamic";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://circuitkar.in";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Post Not Found" };
  return {
    title: post.seo_title || post.title,
    description: post.seo_description || post.excerpt || undefined,
    openGraph: {
      type: "article",
      title: post.seo_title || post.title,
      description: post.seo_description || post.excerpt || undefined,
      images: post.cover_image ? [post.cover_image] : undefined,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  // Best-effort view count increment.
  const admin = createAdminClient();
  admin
    .from("blog_posts")
    .update({ view_count: (post.view_count ?? 0) + 1 })
    .eq("id", post.id)
    .then(() => {});

  const related = await getRelatedPosts(post.id, post.tags);
  const url = `${siteUrl}/blog/${post.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || post.seo_description || "",
    image: post.cover_image ? [post.cover_image] : undefined,
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at,
    author: { "@type": "Organization", name: post.author_name },
    publisher: {
      "@type": "Organization",
      name: "Circuitkar",
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/blog"
        className="mb-6 inline-flex items-center gap-1 text-sm text-[#A3A3A3] hover:text-[#F5F5F5]"
      >
        <ChevronLeft className="h-4 w-4" /> All articles
      </Link>

      {post.tags && post.tags.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {post.tags.map((t) => (
            <Link key={t} href={`/blog?tag=${encodeURIComponent(t)}`}>
              <Badge variant="category">{t}</Badge>
            </Link>
          ))}
        </div>
      )}

      <h1 className="text-3xl font-bold leading-tight text-[#F5F5F5]">
        {post.title}
      </h1>
      <p className="mt-3 text-sm text-[#525252]">
        {post.author_name} ·{" "}
        {post.published_at
          ? new Date(post.published_at).toLocaleDateString("en-IN", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : ""}
      </p>

      {post.cover_image && (
        <div className="relative mt-6 aspect-[16/9] overflow-hidden rounded-lg border border-[#262626]">
          <Image
            src={post.cover_image}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
            priority
          />
        </div>
      )}

      {post.content && (
        <div className="mt-8">
          <RichTextRenderer html={post.content} />
        </div>
      )}

      <div className="mt-8 border-t border-[#262626] pt-6">
        <ShareButtons url={url} title={post.title} />
      </div>

      {related.length > 0 && (
        <section className="mt-12 border-t border-[#262626] pt-8">
          <h2 className="mb-4 text-lg font-bold text-[#F5F5F5]">
            Related Articles
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {related.map((r) => (
              <Link
                key={r.id}
                href={`/blog/${r.slug}`}
                className="group rounded-lg border border-[#262626] bg-[#161616] p-4 transition-colors hover:border-[#F97316]/40"
              >
                <h3 className="text-sm font-semibold text-[#F5F5F5] group-hover:text-[#F97316]">
                  {r.title}
                </h3>
                {r.excerpt && (
                  <p className="mt-1 line-clamp-2 text-xs text-[#A3A3A3]">
                    {r.excerpt}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </article>
  );
}
