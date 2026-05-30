import { PackageSearch } from "lucide-react";
import { ProductCard } from "./ProductCard";
import type { ProductWithCategory } from "@/types";

export function ProductGrid({
  products,
  emptyMessage = "No components found.",
}: {
  products: ProductWithCategory[];
  emptyMessage?: string;
}) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#262626] py-20 text-center">
        <PackageSearch className="h-12 w-12 text-[#262626]" strokeWidth={1.25} />
        <p className="mt-4 text-sm text-[#A3A3A3]">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
