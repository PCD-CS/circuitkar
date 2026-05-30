"use client";

import { Bell, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { OutOfStockBadge } from "./OutOfStockBadge";
import { NotifyMeModal } from "./NotifyMeModal";
import { getCategoryIcon } from "@/lib/category-icons";
import { formatPrice } from "@/lib/utils";
import { useSiteConfig } from "@/lib/site-config";
import { useCart } from "@/lib/cart-context";
import type { ProductWithCategory } from "@/types";

export function ProductCard({ product }: { product: ProductWithCategory }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [count, setCount] = useState(product.interest_count);
  const [addingToCart, setAddingToCart] = useState(false);
  const Icon = getCategoryIcon(product.category?.icon);
  const image = product.images?.[0];
  const { launchMode } = useSiteConfig();
  const { addItem } = useCart();

  const canBuy = product.in_stock && launchMode === "live";

  async function handleAddToCart() {
    setAddingToCart(true);
    await addItem(product.id, 1);
    setAddingToCart(false);
  }

  return (
    <>
      <div className="group flex flex-col overflow-hidden rounded-lg border border-[#262626] border-l-2 border-l-transparent bg-[#161616] transition-all duration-200 hover:-translate-y-0.5 hover:border-l-[#F97316] hover:shadow-lg hover:shadow-black/40">
        <Link
          href={`/products/${product.slug}`}
          className="relative block aspect-[4/3] overflow-hidden bg-[#111111]"
        >
          {image ? (
            <Image
              src={image}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Icon className="h-12 w-12 text-[#262626]" strokeWidth={1.25} />
            </div>
          )}
          {product.category && (
            <div className="absolute left-3 top-3">
              <Badge variant="category">{product.category.name}</Badge>
            </div>
          )}
        </Link>

        <div className="flex flex-1 flex-col p-4">
          <Link href={`/products/${product.slug}`} className="block">
            <h3 className="line-clamp-2 min-h-[2.75rem] text-sm font-semibold leading-snug text-[#F5F5F5] transition-colors group-hover:text-[#F97316]">
              {product.name}
            </h3>
          </Link>

          <div className="mt-2 flex items-center gap-2">
            <span className="text-lg font-bold text-[#F97316]">
              {formatPrice(product.price)}
            </span>
            {product.compare_price && product.compare_price > product.price && (
              <span className="text-sm text-[#525252] line-through">
                {formatPrice(product.compare_price)}
              </span>
            )}
          </div>

          <div className="mt-2">
            {product.in_stock ? (
              <Badge variant="success">In Stock</Badge>
            ) : (
              <OutOfStockBadge />
            )}
          </div>

          <div className="mt-4 flex-1" />

          {canBuy ? (
            <Button
              size="sm"
              className="w-full"
              loading={addingToCart}
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-4 w-4" />
              Add to Cart
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={() => setModalOpen(true)}
            >
              <Bell className="h-4 w-4" />
              {product.in_stock ? "Buy Soon" : "Notify Me"}
            </Button>
          )}

          {count > 0 && !canBuy && (
            <p className="mt-2 text-center text-xs text-[#525252]">
              {count} {count === 1 ? "person" : "people"} interested
            </p>
          )}
        </div>
      </div>

      <NotifyMeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        productId={product.id}
        productName={product.name}
        onSuccess={(newCount) => setCount(newCount)}
      />
    </>
  );
}
