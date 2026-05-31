"use client";

import { Bell, ShoppingCart, Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
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
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const Icon = getCategoryIcon(product.category?.icon);
  const image = product.images?.[0];
  const { launchMode } = useSiteConfig();
  const { addItem } = useCart();

  const canBuy = product.in_stock && launchMode === "live";

  // Check wishlist status on mount
  useEffect(() => {
    fetch("/api/account/wishlist")
      .then((r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        const items: Array<{ product_id: string }> = data.items ?? [];
        setWishlisted(items.some((i) => i.product_id === product.id));
      })
      .catch(() => {});
  }, [product.id]);

  async function handleAddToCart() {
    setAddingToCart(true);
    await addItem(product.id, 1);
    setAddingToCart(false);
  }

  async function toggleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (wishlistLoading) return;
    setWishlistLoading(true);
    try {
      if (wishlisted) {
        const res = await fetch(
          `/api/account/wishlist?productId=${product.id}`,
          { method: "DELETE" },
        );
        if (res.ok) setWishlisted(false);
        else if (res.status === 401) window.location.href = "/auth/login";
      } else {
        const res = await fetch("/api/account/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product.id }),
        });
        if (res.ok) setWishlisted(true);
        else if (res.status === 401) window.location.href = "/auth/login";
      }
    } finally {
      setWishlistLoading(false);
    }
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
          {/* Wishlist heart button */}
          <button
            onClick={toggleWishlist}
            disabled={wishlistLoading}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#0A0A0A]/70 text-[#A3A3A3] opacity-0 backdrop-blur-sm transition-all group-hover:opacity-100 hover:bg-[#0A0A0A]/90 disabled:cursor-not-allowed"
          >
            <Heart
              className={`h-4 w-4 transition-colors ${
                wishlisted
                  ? "fill-[#EF4444] text-[#EF4444]"
                  : "hover:text-[#EF4444]"
              }`}
            />
          </button>
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
