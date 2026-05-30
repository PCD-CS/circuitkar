"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CartItem } from "@/components/cart/CartItem";
import { CartSummary } from "@/components/cart/CartSummary";
import { useCart } from "@/lib/cart-context";
import { useSiteConfig } from "@/lib/site-config";

export default function CartPage() {
  const { items, subtotal, isLoading } = useCart();
  const { launchMode, freeShippingThreshold, shippingCharge } = useSiteConfig();
  const router = useRouter();
  const isLive = launchMode === "live";

  const [coupon, setCoupon] = useState("");
  const [couponMsg, setCouponMsg] = useState("");

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-[#F97316]" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-2xl flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1E1E1E]">
          <ShoppingCart className="h-7 w-7 text-[#525252]" />
        </div>
        <h1 className="text-xl font-bold text-[#F5F5F5]">Your cart is empty</h1>
        <p className="text-sm text-[#A3A3A3]">
          Browse our components and add a few to get started.
        </p>
        <Link href="/products">
          <Button>Browse Products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-[#F5F5F5]">Your Cart</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
        <div className="rounded-lg border border-[#262626] bg-[#161616] px-4">
          <div className="divide-y divide-[#262626]">
            {items.map((item) => (
              <CartItem key={item.id} item={item} />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-[#262626] bg-[#161616] p-5">
            <h2 className="mb-4 text-sm font-semibold text-[#F5F5F5]">
              Order Summary
            </h2>
            <CartSummary
              subtotal={subtotal}
              freeShippingThreshold={freeShippingThreshold}
              shippingCharge={shippingCharge}
            />

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setCouponMsg("No coupons available yet.");
              }}
              className="mt-4 flex gap-2"
            >
              <input
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                placeholder="Coupon code"
                className="flex-1 rounded-lg border border-[#262626] bg-[#111111] px-3 py-2 text-sm text-[#F5F5F5] placeholder:text-[#525252] focus:border-[#F97316] focus:outline-none"
              />
              <Button type="submit" variant="secondary" size="sm">
                Apply
              </Button>
            </form>
            {couponMsg && (
              <p className="mt-2 text-xs text-[#525252]">{couponMsg}</p>
            )}

            <div className="mt-4">
              {isLive ? (
                <Button
                  className="w-full"
                  onClick={() => router.push("/checkout")}
                >
                  Proceed to Checkout
                </Button>
              ) : (
                <Button className="w-full" disabled>
                  Checkout opens at launch
                </Button>
              )}
            </div>
          </div>

          <Link
            href="/products"
            className="block text-center text-sm text-[#A3A3A3] hover:text-[#F5F5F5]"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
