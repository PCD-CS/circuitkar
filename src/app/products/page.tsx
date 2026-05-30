import type { Metadata } from "next";
import { getProducts, getCategories } from "@/lib/products";
import { ProductsClient } from "./ProductsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "All Components",
  description:
    "Browse the full Circuitkar catalog of electronic components — microcontrollers, sensors, displays, power modules and more.",
};

export default async function ProductsPage() {
  const [{ products }, categories] = await Promise.all([
    getProducts({ pageSize: 100, sort: "featured" }),
    getCategories(),
  ]);

  const maxPrice = Math.max(100, ...products.map((p) => Math.ceil(p.price)));

  return (
    <ProductsClient
      initialProducts={products}
      categories={categories}
      maxPrice={maxPrice}
    />
  );
}
