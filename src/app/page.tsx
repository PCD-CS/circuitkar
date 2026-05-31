import {
  ArrowRight,
  Bell,
  PackageCheck,
  Receipt,
  ShieldCheck,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ProductGrid } from "@/components/product/ProductGrid";
import { CategoryCard } from "@/components/product/CategoryCard";
import { getProducts, getCategoriesWithCounts } from "@/lib/products";

export const dynamic = "force-dynamic";

const STATS = [
  "45+ Components",
  "Pan-India Shipping",
  "GST Invoices",
  "Maker Community",
];

const WHY = [
  {
    icon: PackageCheck,
    title: "Curated Selection",
    desc: "Only the parts makers actually reach for — no clutter.",
  },
  {
    icon: Truck,
    title: "Fast Shipping",
    desc: "Dispatched quickly, delivered across India.",
  },
  {
    icon: Receipt,
    title: "GST Invoices",
    desc: "Proper GST bills for students, startups & businesses.",
  },
  {
    icon: ShieldCheck,
    title: "Genuine Components",
    desc: "Sourced for quality so your projects just work.",
  },
];

export default async function HomePage() {
  const [{ products: featured }, categories] = await Promise.all([
    getProducts({ featured: true, sort: "featured", pageSize: 12 }),
    getCategoriesWithCounts(),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[#262626]">
        <div className="circuit-grid circuit-grid-fade absolute inset-0" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-lg border border-[#262626] bg-[#161616] px-3 py-1 text-xs font-medium text-[#F59E0B]">
              🟡 Launching Soon — Register Interest on Products
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-tight text-[#F5F5F5] sm:text-6xl">
              Components for Builders.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-[#A3A3A3] sm:text-lg">
              Quality electronic components. Fast shipping across India. Trusted
              by makers, engineers &amp; students.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/products">
                <Button size="lg">
                  Browse Components
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/products">
                <Button size="lg" variant="secondary">
                  <Bell className="h-4 w-4" />
                  Get Notified When Live
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-b border-[#262626] bg-[#111111]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 py-4 sm:px-6">
          {STATS.map((s, i) => (
            <div key={s} className="flex items-center gap-8">
              <span className="font-mono text-sm text-[#A3A3A3]">{s}</span>
              {i < STATS.length - 1 && (
                <span className="hidden text-[#262626] sm:inline">|</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:py-16 sm:px-6">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#F5F5F5]">Fast Movers</h2>
            <p className="mt-1 text-sm text-[#A3A3A3]">
              The components makers reach for first.
            </p>
          </div>
          <Link
            href="/products"
            className="hidden items-center gap-1 text-sm font-medium text-[#F97316] hover:text-[#EA6C0A] sm:flex"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <ProductGrid
          products={featured}
          emptyMessage="Featured products are on the way."
        />
      </section>

      {/* Categories */}
      <section className="border-t border-[#262626] bg-[#111111]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 className="mb-8 text-2xl font-bold text-[#F5F5F5]">
            Shop by Category
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {categories.map((c) => (
              <CategoryCard key={c.id} category={c} />
            ))}
          </div>
        </div>
      </section>

      {/* Why Circuitkar */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="mb-8 text-2xl font-bold text-[#F5F5F5]">Why Circuitkar</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {WHY.map((w) => (
            <div
              key={w.title}
              className="rounded-lg border border-[#262626] bg-[#161616] p-5"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#F9731615] text-[#F97316]">
                <w.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-[#F5F5F5]">
                {w.title}
              </h3>
              <p className="mt-1.5 text-sm text-[#A3A3A3]">{w.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Circuitkar",
        url: process.env.NEXT_PUBLIC_SITE_URL || "https://circuitkar.in",
        logo: `${process.env.NEXT_PUBLIC_SITE_URL || "https://circuitkar.in"}/logo.png`,
        description: "India's trusted online marketplace for electronic components — microcontrollers, sensors, development boards, and maker supplies.",
        contactPoint: { "@type": "ContactPoint", contactType: "customer support", availableLanguage: "en" },
        sameAs: [],
      }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Circuitkar",
        url: process.env.NEXT_PUBLIC_SITE_URL || "https://circuitkar.in",
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL || "https://circuitkar.in"}/products?q={search_term_string}` },
          "query-input": "required name=search_term_string",
        },
      }) }} />
    </>
  );
}
