"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, X, Truck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { CartItem } from "./CartItem";
import { CartSummary } from "./CartSummary";
import { useCart } from "@/lib/cart-context";
import { useSiteConfig } from "@/lib/site-config";
import { formatPrice } from "@/lib/utils";

export function CartDrawer() {
  const { items, subtotal, isOpen, closeCart } = useCart();
  const { launchMode, freeShippingThreshold, shippingCharge } = useSiteConfig();
  const router = useRouter();
  const isLive = launchMode === "live";

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, closeCart]);

  if (!isOpen) return null;

  const remaining = Math.max(0, freeShippingThreshold - subtotal);
  const progress =
    freeShippingThreshold > 0
      ? Math.min(100, (subtotal / freeShippingThreshold) * 100)
      : 100;

  return (
    <div className="fixed inset-0 z-[120]" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={closeCart}
      />
      <div className="absolute right-0 top-0 flex h-full w-full max-w-md animate-slide-in flex-col border-l border-[#262626] bg-[#111111] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#262626] px-4 py-4">
          <h2 className="flex items-center gap-2 text-base font-bold text-[#F5F5F5]">
            <ShoppingCart className="h-5 w-5 text-[#F97316]" />
            Your Cart
          </h2>
          <button
            onClick={closeCart}
            aria-label="Close cart"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#525252] hover:text-[#F5F5F5]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1E1E1E]">
              <ShoppingCart className="h-7 w-7 text-[#525252]" />
            </div>
            <p className="text-[#A3A3A3]">Your cart is empty</p>
            <Link href="/products" onClick={closeCart}>
              <Button variant="secondary">Browse Products</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4">
              {freeShippingThreshold > 0 && (
                <div className="border-b border-[#262626] py-3">
                  {remaining > 0 ? (
                    <p className="mb-2 flex items-center gap-1.5 text-xs text-[#A3A3A3]">
                      <Truck className="h-3.5 w-3.5 text-[#F97316]" />
                      Add {formatPrice(remaining)} more for free shipping
                    </p>
                  ) : (
                    <p className="mb-2 flex items-center gap-1.5 text-xs text-[#22C55E]">
                      <Truck className="h-3.5 w-3.5" />
                      You&apos;ve unlocked free shipping!
                    </p>
                  )}
                  <ProgressBar value={progress} />
                </div>
              )}
              <div className="divide-y divide-[#262626]">
                {items.map((item) => (
                  <CartItem key={item.id} item={item} onNavigate={closeCart} />
                ))}
              </div>
            </div>

            <div className="space-y-4 border-t border-[#262626] p-4">
              <CartSummary
                subtotal={subtotal}
                freeShippingThreshold={freeShippingThreshold}
                shippingCharge={shippingCharge}
              />
              <div className="flex flex-col gap-2">
                {isLive ? (
                  <Button
                    className="w-full"
                    onClick={() => {
                      closeCart();
                      router.push("/checkout");
                    }}
                  >
                    Proceed to Checkout
                  </Button>
                ) : (
                  <div className="group relative">
                    <Button className="w-full" disabled>
                      Proceed to Checkout
                    </Button>
                    <span className="pointer-events-none absolute inset-x-0 -top-8 mx-auto w-max rounded-lg border border-[#262626] bg-[#1E1E1E] px-2 py-1 text-xs text-[#A3A3A3] opacity-0 transition-opacity group-hover:opacity-100">
                      Checkout opens at launch
                    </span>
                  </div>
                )}
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={closeCart}
                >
                  Continue Shopping
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
