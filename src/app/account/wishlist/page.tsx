"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/lib/cart-context";

interface WishlistProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_price: number | null;
  images: string[] | null;
  in_stock: boolean;
  stock_count: number;
}

interface WishlistItem {
  id: string;
  product_id: string;
  created_at: string;
  product: WishlistProduct | null;
}

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [addingToCartId, setAddingToCartId] = useState<string | null>(null);
  const { addItem } = useCart();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/account/wishlist");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function removeFromWishlist(productId: string) {
    setRemovingId(productId);
    try {
      const res = await fetch(`/api/account/wishlist?productId=${productId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.product_id !== productId));
      }
    } finally {
      setRemovingId(null);
    }
  }

  async function handleAddToCart(productId: string) {
    setAddingToCartId(productId);
    try {
      await addItem(productId, 1);
    } finally {
      setAddingToCartId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-[#F5F5F5]">Wishlist</h2>
          <p className="mt-1 text-sm text-[#A3A3A3]">Your saved products.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-lg border border-[#262626] bg-[#161616]"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#F5F5F5]">Wishlist</h2>
        <p className="mt-1 text-sm text-[#A3A3A3]">
          {items.length} saved item{items.length !== 1 ? "s" : ""}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-[#262626] bg-[#161616] px-6 py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#1E1E1E]">
            <Heart className="h-8 w-8 text-[#525252]" />
          </div>
          <p className="text-sm font-medium text-[#F5F5F5]">No saved items yet</p>
          <p className="mt-1 text-sm text-[#A3A3A3]">
            Products you wishlist will appear here.
          </p>
          <Link
            href="/products"
            className="mt-4 rounded-lg bg-[#F97316] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#EA6C0A]"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {items.map((item) => {
            const p = item.product;
            if (!p) return null;
            const image = p.images?.[0];
            const isRemoving = removingId === p.id;
            const isAddingToCart = addingToCartId === p.id;

            return (
              <div
                key={item.id}
                className="flex gap-4 rounded-lg border border-[#262626] bg-[#161616] p-4 transition-colors hover:border-[#525252]"
              >
                {/* Product image */}
                <Link
                  href={`/products/${p.slug}`}
                  className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-[#111111]"
                >
                  {image ? (
                    <Image
                      src={image}
                      alt={p.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Heart className="h-6 w-6 text-[#262626]" />
                    </div>
                  )}
                </Link>

                {/* Info */}
                <div className="flex min-w-0 flex-1 flex-col">
                  <Link href={`/products/${p.slug}`} className="block">
                    <h3 className="line-clamp-2 text-sm font-semibold text-[#F5F5F5] hover:text-[#F97316] transition-colors">
                      {p.name}
                    </h3>
                  </Link>

                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm font-bold text-[#F97316]">
                      {formatPrice(p.price)}
                    </span>
                    {p.compare_price && p.compare_price > p.price && (
                      <span className="text-xs text-[#525252] line-through">
                        {formatPrice(p.compare_price)}
                      </span>
                    )}
                  </div>

                  <p
                    className={`mt-1 text-xs ${
                      p.in_stock ? "text-[#22C55E]" : "text-[#EF4444]"
                    }`}
                  >
                    {p.in_stock ? "In Stock" : "Out of Stock"}
                  </p>

                  {/* Actions */}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {p.in_stock && (
                      <button
                        disabled={isAddingToCart}
                        onClick={() => handleAddToCart(p.id)}
                        className="inline-flex items-center gap-1.5 rounded-md bg-[#F97316] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#EA6C0A] disabled:opacity-60"
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                        {isAddingToCart ? "Adding…" : "Add to Cart"}
                      </button>
                    )}
                    <button
                      disabled={isRemoving}
                      onClick={() => removeFromWishlist(p.id)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-[#EF4444]/30 bg-[#EF4444]/10 px-3 py-1.5 text-xs text-[#EF4444] transition-colors hover:bg-[#EF4444]/20 disabled:opacity-60"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {isRemoving ? "Removing…" : "Remove"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
