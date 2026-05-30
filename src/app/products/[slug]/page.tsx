import type { Metadata } from "next";
import { ChevronRight, FileText } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { OutOfStockBadge } from "@/components/product/OutOfStockBadge";
import { SpecsTable } from "@/components/product/SpecsTable";
import { NotifyCTA } from "@/components/product/NotifyCTA";
import { ProductGrid } from "@/components/product/ProductGrid";
import {
  getProductBySlug,
  getRelatedProducts,
  getProducts,
} from "@/lib/products";
import { getCategoryIcon } from "@/lib/category-icons";
import { formatPrice, discountPercent } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const { products } = await getProducts({ pageSize: 100 });
    return products.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    return { title: "Product Not Found" };
  }
  return {
    title: `Buy ${product.name} in India`,
    description:
      product.short_description ||
      `Buy ${product.name} from Circuitkar — quality electronic components shipped across India.`,
    openGraph: {
      title: `Buy ${product.name} in India | Circuitkar`,
      description: product.short_description || undefined,
      images: product.images?.length ? [product.images[0]] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.category_id, product.id);
  const Icon = getCategoryIcon(product.category?.icon);
  const image = product.images?.[0];
  const discount = discountPercent(product.price, product.compare_price);

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://circuitkar.in";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.short_description || product.description || "",
    sku: product.sku || undefined,
    image: product.images?.length
      ? product.images
      : undefined,
    brand: { "@type": "Brand", name: "Circuitkar" },
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/products/${product.slug}`,
      priceCurrency: "INR",
      price: product.price,
      availability: product.in_stock
        ? "https://schema.org/InStock"
        : "https://schema.org/PreOrder",
    },
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Breadcrumb */}
      <nav className="mb-6 flex flex-wrap items-center gap-1 text-sm text-[#525252]">
        <Link href="/" className="hover:text-[#A3A3A3]">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        {product.category && (
          <>
            <Link
              href={`/category/${product.category.slug}`}
              className="hover:text-[#A3A3A3]"
            >
              {product.category.name}
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
          </>
        )}
        <span className="text-[#A3A3A3]">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        {/* Left: image */}
        <div>
          <div className="relative aspect-square overflow-hidden rounded-lg border border-[#262626] bg-[#111111]">
            {image ? (
              <Image
                src={image}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain p-6"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Icon
                  className="h-24 w-24 text-[#262626]"
                  strokeWidth={1}
                />
              </div>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="mt-3 flex gap-3">
              {product.images.slice(0, 5).map((img, i) => (
                <div
                  key={i}
                  className="relative h-16 w-16 overflow-hidden rounded-lg border border-[#262626] bg-[#111111]"
                >
                  <Image
                    src={img}
                    alt={`${product.name} ${i + 1}`}
                    fill
                    sizes="64px"
                    className="object-contain p-1"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: details */}
        <div>
          {product.category && (
            <Badge variant="category">{product.category.name}</Badge>
          )}
          <h1 className="mt-3 text-2xl font-bold text-[#F5F5F5] sm:text-3xl">
            {product.name}
          </h1>

          <div className="mt-4 flex items-center gap-3">
            <span className="text-3xl font-bold text-[#F97316]">
              {formatPrice(product.price)}
            </span>
            {product.compare_price &&
              product.compare_price > product.price && (
                <span className="text-lg text-[#525252] line-through">
                  {formatPrice(product.compare_price)}
                </span>
              )}
            {discount && <Badge variant="accent">{discount}% off</Badge>}
          </div>

          <div className="mt-4">
            {product.in_stock ? (
              <Badge variant="success">In Stock</Badge>
            ) : (
              <OutOfStockBadge />
            )}
          </div>

          {product.short_description && (
            <p className="mt-5 text-[#A3A3A3]">{product.short_description}</p>
          )}

          <div className="mt-6">
            <NotifyCTA
              productId={product.id}
              productName={product.name}
              initialCount={product.interest_count}
            />
          </div>

          {product.datasheet_url && (
            <a
              href={product.datasheet_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#F97316] hover:text-[#EA6C0A]"
            >
              <FileText className="h-4 w-4" />
              Download Datasheet
            </a>
          )}

          {product.tags && product.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <Badge key={tag} variant="category">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          <div className="my-8 border-t border-[#262626]" />

          <h2 className="mb-4 text-lg font-bold text-[#F5F5F5]">
            Specifications
          </h2>
          <SpecsTable specs={product.specifications} />
        </div>
      </div>

      {/* Full description */}
      {product.description && (
        <section className="mt-12 max-w-3xl">
          <h2 className="mb-4 text-lg font-bold text-[#F5F5F5]">Overview</h2>
          <div className="whitespace-pre-line text-[#A3A3A3]">
            {product.description}
          </div>
        </section>
      )}

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-xl font-bold text-[#F5F5F5]">
            Related Components
          </h2>
          <ProductGrid products={related} />
        </section>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
