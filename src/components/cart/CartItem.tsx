"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2, Cpu } from "lucide-react";
import { Stepper } from "@/components/ui/Stepper";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/utils";
import type { CartItemWithProduct } from "@/types";

export function CartItem({
  item,
  onNavigate,
}: {
  item: CartItemWithProduct;
  onNavigate?: () => void;
}) {
  const { updateQty, removeItem } = useCart();
  const product = item.product;
  const image = product?.images?.[0];

  return (
    <div className="flex gap-3 py-3">
      <Link
        href={`/products/${product?.slug ?? ""}`}
        onClick={onNavigate}
        className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-[#262626] bg-[#111111]"
      >
        {image ? (
          <Image
            src={image}
            alt={product?.name ?? ""}
            fill
            sizes="56px"
            className="object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center">
            <Cpu className="h-5 w-5 text-[#262626]" />
          </span>
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <Link
          href={`/products/${product?.slug ?? ""}`}
          onClick={onNavigate}
          className="line-clamp-2 text-sm font-medium text-[#F5F5F5] hover:text-[#F97316]"
        >
          {product?.name}
        </Link>
        <p className="mt-0.5 text-sm font-semibold text-[#F97316]">
          {formatPrice(product?.price)}
        </p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <Stepper
            value={item.quantity}
            max={product.in_stock && product.stock_count > 0 ? product.stock_count : 99}
            onChange={(q) => updateQty(item.id, q)}
          />
          <button
            type="button"
            onClick={() => removeItem(item.id)}
            aria-label="Remove item"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#525252] transition-colors hover:text-[#EF4444]"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
