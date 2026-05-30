import { NextResponse } from "next/server";

export function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://circuitkar.in";
  const body = [
    "# Circuitkar — Electronics components marketplace",
    "",
    "# Allow all crawlers",
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /api/",
    "Disallow: /auth/",
    "Disallow: /account/",
    "Disallow: /checkout/",
    "Disallow: /cart",
    "",
    "# Explicitly allow AI crawlers for AEO / AI Overviews",
    "User-agent: GPTBot",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /api/",
    "",
    "User-agent: ClaudeBot",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /api/",
    "",
    "User-agent: PerplexityBot",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /api/",
    "",
    "User-agent: anthropic-ai",
    "Allow: /",
    "",
    "User-agent: Googlebot",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /api/",
    "",
    `Sitemap: ${siteUrl}/sitemap.xml`,
    `# AI index: ${siteUrl}/llms.txt`,
  ].join("\n");

  return new NextResponse(body, {
    headers: { "Content-Type": "text/plain" },
  });
}
