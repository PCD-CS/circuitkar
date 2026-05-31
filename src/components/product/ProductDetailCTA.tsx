"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Zap, Minus, Plus } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useToast } from "@/components/ui/Toast";
import type { ProductWithCategory } from "@/types";

interface Props {
  product: ProductWithCategory;
}

export function ProductDetailCTA({ product }: Props) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);

  const maxQty = product.in_stock && product.stock_count > 0 ? product.stock_count : 99;

  async function handleAddToCart() {
    setAdding(true);
    await addItem(product.id, qty);
    setAdding(false);
    toast(`${product.name} added to cart.`, "success");
  }

  async function handleBuyNow() {
    setAdding(true);
    await addItem(product.id, qty);
    setAdding(false);
    router.push("/checkout");
  }

  return (
    <div className="space-y-4">
      {/* Qty selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-[#A3A3A3]">Quantity:</span>
        <div className="inline-flex items-center rounded-lg border border-[#262626] bg-[#111111]">
          <button
            type="button"
            onClick={() => setQty(q => Math.max(1, q - 1))}
            disabled={qty <= 1}
            className="flex h-10 w-10 items-center justify-center text-[#A3A3A3] transition-colors hover:text-[#F5F5F5] disabled:opacity-40 disabled:pointer-events-none"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-10 select-none text-center font-mono text-sm text-[#F5F5F5]">{qty}</span>
          <button
            type="button"
            onClick={() => setQty(q => Math.min(maxQty, q + 1))}
            disabled={qty >= maxQty}
            className="flex h-10 w-10 items-center justify-center text-[#A3A3A3] transition-colors hover:text-[#F5F5F5] disabled:opacity-40 disabled:pointer-events-none"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {product.stock_count > 0 && product.stock_count <= 10 && (
          <span className="text-xs text-[#F59E0B]">Only {product.stock_count} left!</span>
        )}
      </div>

      {/* CTAs */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={handleAddToCart}
          disabled={adding}
          className="flex flex-1 min-w-[160px] items-center justify-center gap-2 rounded-lg border border-[#F97316] bg-transparent px-5 py-3 text-sm font-semibold text-[#F97316] transition-colors hover:bg-[#F97316]/10 disabled:opacity-60 disabled:pointer-events-none"
        >
          <ShoppingCart className="h-4 w-4" />
          {adding ? "Adding…" : "Add to Cart"}
        </button>
        <button
          onClick={handleBuyNow}
          disabled={adding}
          className="flex flex-1 min-w-[160px] items-center justify-center gap-2 rounded-lg bg-[#F97316] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#EA6C0A] active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
        >
          <Zap className="h-4 w-4" />
          Buy Now
        </button>
      </div>
    </div>
  );
}
