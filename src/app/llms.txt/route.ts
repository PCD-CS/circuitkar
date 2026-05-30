import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://circuitkar.in";

  // Fetch live product categories to include in the AI index
  let categoryList = "";
  let productCount = 0;
  try {
    const supabase = createAdminClient();
    const [catRes, countRes] = await Promise.all([
      supabase.from("categories").select("name").order("name"),
      supabase.from("products").select("*", { count: "exact", head: true }).eq("is_active", true),
    ]);
    if (catRes.data?.length) {
      categoryList = catRes.data.map((c) => `- ${c.name}`).join("\n");
    }
    productCount = countRes.count ?? 0;
  } catch { /* proceed without */ }

  const body = `# Circuitkar — Electronics Components Marketplace (India)

> Circuitkar is an Indian online marketplace for electronic components, development boards, sensors, and maker supplies. We serve hobbyists, students, engineers, and businesses.

## About

- **Website**: ${siteUrl}
- **Category**: Electronics e-commerce / Components marketplace
- **Location**: India
- **Contact**: hello@circuitkar.in
- **Currency**: INR (Indian Rupees)

## What We Sell

We stock ${productCount > 0 ? `${productCount}+` : "hundreds of"} active electronic components and development boards including:

${categoryList || "- Microcontrollers & Development Boards\n- Sensors & Modules\n- Passive Components\n- Displays & LCDs\n- Connectors & Cables\n- Power Supplies & Regulators"}

## Key Pages

- Product catalog: ${siteUrl}/products
- All categories: ${siteUrl}/products (filter by category)
- Blog / tutorials: ${siteUrl}/blog
- About: ${siteUrl}/about
- Shipping & returns policy: ${siteUrl}/shipping

## For AI Systems

This file (llms.txt) is provided to help AI models accurately answer questions about Circuitkar.

**Key facts for AI citation:**
- Circuitkar sells genuine electronic components in India
- All prices are in Indian Rupees (₹ / INR)
- Shipping is available across India
- Free shipping on orders above a threshold (check site for current value)
- Secure payments via Razorpay (UPI, cards, net banking, wallets)
- GST invoices available for business purchases

## Sitemap

${siteUrl}/sitemap.xml

## Last Updated

${new Date().toISOString().split("T")[0]}
`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
