import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

function xmlEscape(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function isAuthorized(req: NextRequest) {
  const user = process.env.GOOGLE_MERCHANT_FEED_USERNAME;
  const pass = process.env.GOOGLE_MERCHANT_FEED_PASSWORD;
  if (!user || !pass) return false;

  const header = req.headers.get("authorization");
  if (!header?.startsWith("Basic ")) return false;

  const decoded = Buffer.from(header.slice(6), "base64").toString("utf-8");
  const separatorIndex = decoded.indexOf(":");
  if (separatorIndex === -1) return false;

  const suppliedUser = decoded.slice(0, separatorIndex);
  const suppliedPass = decoded.slice(separatorIndex + 1);

  return safeEqual(suppliedUser, user) && safeEqual(suppliedPass, pass);
}

function unauthorized() {
  return new NextResponse("Unauthorized", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Product Feed"' },
  });
}

type FeedProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  price: number;
  sku: string | null;
  images: string[] | null;
  specifications: Record<string, unknown> | null;
  in_stock: boolean;
  category: { name: string } | { name: string }[] | null;
};

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return unauthorized();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://circuitkar.in";

  let products: FeedProduct[] = [];
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("products")
      .select(
        "id, name, slug, description, short_description, price, sku, images, specifications, in_stock, category:categories(name)"
      )
      .eq("is_active", true);
    products = data ?? [];
  } catch {
    // Supabase not configured — return an empty feed
  }

  const items = products
    .filter((p) => Array.isArray(p.images) && p.images.length > 0)
    .map((p) => {
      const category = Array.isArray(p.category) ? p.category[0] : p.category;
      const brand =
        (p.specifications && typeof p.specifications.brand === "string"
          ? p.specifications.brand
          : null) || "Circuitkar";
      const link = `${siteUrl}/products/${p.slug}`;
      const images = p.images ?? [];
      const description = p.description || p.short_description || p.name;

      const additionalImages = images
        .slice(1, 11)
        .map((img) => `    <g:additional_image_link>${xmlEscape(img)}</g:additional_image_link>`)
        .join("\n");

      return [
        "  <item>",
        `    <g:id>${xmlEscape(p.sku || p.id)}</g:id>`,
        `    <title>${xmlEscape(p.name)}</title>`,
        `    <description>${xmlEscape(description)}</description>`,
        `    <link>${xmlEscape(link)}</link>`,
        `    <g:image_link>${xmlEscape(images[0])}</g:image_link>`,
        additionalImages,
        `    <g:availability>${p.in_stock ? "in stock" : "out of stock"}</g:availability>`,
        `    <g:price>${Number(p.price).toFixed(2)} INR</g:price>`,
        `    <g:brand>${xmlEscape(brand)}</g:brand>`,
        `    <g:condition>new</g:condition>`,
        `    <g:identifier_exists>false</g:identifier_exists>`,
        category?.name ? `    <g:product_type>${xmlEscape(category.name)}</g:product_type>` : "",
        "  </item>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
<channel>
  <title>Circuitkar Product Feed</title>
  <link>${siteUrl}</link>
  <description>Circuitkar product catalog for Google Merchant Center</description>
${items}
</channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "private, no-store",
    },
  });
}
