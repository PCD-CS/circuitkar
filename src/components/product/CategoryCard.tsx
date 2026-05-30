import Link from "next/link";
import { getCategoryIcon } from "@/lib/category-icons";
import type { CategoryWithCount } from "@/types";

export function CategoryCard({ category }: { category: CategoryWithCount }) {
  const Icon = getCategoryIcon(category.icon);
  return (
    <Link
      href={`/category/${category.slug}`}
      className="group flex flex-col rounded-lg border border-[#262626] border-l-2 border-l-transparent bg-[#161616] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-l-[#F97316]"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#1E1E1E] text-[#F97316] transition-colors group-hover:bg-[#F9731615]">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-[#F5F5F5]">
        {category.name}
      </h3>
      <p className="mt-1 text-xs text-[#525252]">
        {category.product_count}{" "}
        {category.product_count === 1 ? "product" : "products"}
      </p>
    </Link>
  );
}
