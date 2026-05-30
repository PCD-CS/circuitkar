import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function xmlEscape(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://circuitkar.in";

  let productsData: { slug: string; updated_at: string }[] = [];
  let categoriesData: { slug: string }[] = [];
  let blogData: { slug: string; updated_at: string }[] = [];

  try {
    const supabase = createAdminClient();
    const [productsRes, categoriesRes, blogRes] = await Promise.all([
      supabase
        .from("products")
        .select("slug, updated_at")
        .eq("is_active", true)
        .order("updated_at", { ascending: false }),
      supabase.from("categories").select("slug, created_at"),
      supabase
        .from("blog_posts")
        .select("slug, updated_at")
        .eq("is_published", true)
        .order("updated_at", { ascending: false }),
    ]);
    productsData = productsRes.data ?? [];
    categoriesData = categoriesRes.data ?? [];
    blogData = blogRes.data ?? [];
  } catch {
    // Supabase not configured — return static sitemap
  }

  const staticPages = [
    { url: "/", priority: "1.0", changefreq: "daily" },
    { url: "/products", priority: "0.9", changefreq: "daily" },
    { url: "/about", priority: "0.5", changefreq: "monthly" },
    { url: "/contact", priority: "0.5", changefreq: "monthly" },
  ];

  const urls = [
    ...staticPages.map(
      (p) =>
        `  <url>\n    <loc>${siteUrl}${p.url}</loc>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`
    ),
    ...categoriesData.map(
      (c) =>
        `  <url>\n    <loc>${xmlEscape(`${siteUrl}/category/${c.slug}`)}</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>`
    ),
    ...productsData.map(
      (p) =>
        `  <url>\n    <loc>${xmlEscape(`${siteUrl}/products/${p.slug}`)}</loc>\n    <lastmod>${new Date(p.updated_at).toISOString().split("T")[0]}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`
    ),
    ...blogData.map(
      (b) =>
        `  <url>\n    <loc>${xmlEscape(`${siteUrl}/blog/${b.slug}`)}</loc>\n    <lastmod>${new Date(b.updated_at).toISOString().split("T")[0]}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`
    ),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
