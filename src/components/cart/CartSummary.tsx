"use client";

import { formatPrice } from "@/lib/utils";

interface CartSummaryProps {
  subtotal: number;
  freeShippingThreshold: number;
  /** Default flat shipping when under threshold. */
  shippingCharge?: number;
}

export function CartSummary({
  subtotal,
  freeShippingThreshold,
  shippingCharge = 49,
}: CartSummaryProps) {
  const qualifiesFreeShipping =
    freeShippingThreshold > 0 && subtotal >= freeShippingThreshold;
  const shipping = subtotal === 0 || qualifiesFreeShipping ? 0 : shippingCharge;
  const total = subtotal + shipping;

  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between text-[#A3A3A3]">
        <span>Subtotal</span>
        <span className="text-[#F5F5F5]">{formatPrice(subtotal)}</span>
      </div>
      <div className="flex justify-between text-[#A3A3A3]">
        <span>Shipping</span>
        <span className={shipping === 0 ? "text-[#22C55E]" : "text-[#F5F5F5]"}>
          {shipping === 0 ? "Free" : formatPrice(shipping)}
        </span>
      </div>
      <div className="mt-2 flex justify-between border-t border-[#262626] pt-3 text-base font-semibold">
        <span className="text-[#F5F5F5]">Total</span>
        <span className="text-[#F97316]">{formatPrice(total)}</span>
      </div>
    </div>
  );
}
