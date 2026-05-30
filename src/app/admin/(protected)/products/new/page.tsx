import { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProductForm } from "@/components/admin/ProductForm";
import type { Category } from "@/types";

export const metadata: Metadata = { title: "New Product" };

async function getCategories(): Promise<Category[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");
  return data ?? [];
}

export default async function NewProductPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link
          href="/admin/products"
          className="flex items-center gap-1 text-sm text-[#525252] hover:text-[#A3A3A3] transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Products
        </Link>
        <h1 className="text-xl font-bold font-mono text-[#F5F5F5]">New Product</h1>
      </div>

      <div className="bg-[#161616] border border-[#262626] rounded-lg p-6">
        <ProductForm categories={categories} />
      </div>
    </div>
  );
}
