import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/product/ProductGrid";
import { getCategoryIcon } from "@/lib/category-icons";
import {
  getCategoryBySlug,
  getCategories,
  getProducts,
} from "@/lib/products";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const categories = await getCategories();
    return categories.map((c) => ({ slug: c.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const category = await getCategoryBySlug(params.slug);
  if (!category) return { title: "Category Not Found" };
  return {
    title: `${category.name} Components`,
    description:
      category.description ||
      `Browse ${category.name} components at Circuitkar.`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: { slug: string };
}) {
  const category = await getCategoryBySlug(params.slug);
  if (!category) notFound();

  const { products } = await getProducts({
    category: params.slug,
    sort: "featured",
    pageSize: 100,
  });
  const Icon = getCategoryIcon(category.icon);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#F9731615] text-[#F97316]">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#F5F5F5]">{category.name}</h1>
          {category.description && (
            <p className="mt-1 max-w-2xl text-sm text-[#A3A3A3]">
              {category.description}
            </p>
          )}
        </div>
      </div>

      <ProductGrid
        products={products}
        emptyMessage="No components in this category yet."
      />
    </div>
  );
}
