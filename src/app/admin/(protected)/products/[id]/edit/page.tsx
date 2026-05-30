import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProductForm } from "@/components/admin/ProductForm";
import type { Category, Product } from "@/types";

export const metadata: Metadata = { title: "Edit Product" };

async function getProduct(id: string): Promise<(Product & { category: Category | null }) | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("products")
    .select("*, category:categories(*)")
    .eq("id", id)
    .single();
  return data ?? null;
}

async function getCategories(): Promise<Category[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");
  return data ?? [];
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getProduct(id),
    getCategories(),
  ]);

  if (!product) notFound();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link
          href="/admin/products"
          className="flex items-center gap-1 text-sm text-[#525252] hover:text-[#A3A3A3] transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Products
        </Link>
        <h1 className="text-xl font-bold font-mono text-[#F5F5F5]">Edit Product</h1>
        <p className="text-sm text-[#525252] mt-1 font-mono">{product.slug}</p>
      </div>

      <div className="bg-[#161616] border border-[#262626] rounded-lg p-6">
        <ProductForm product={product} categories={categories} />
      </div>
    </div>
  );
}
