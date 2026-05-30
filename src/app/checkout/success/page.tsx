"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle, Package } from "lucide-react";

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order") || "";
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    setShowConfetti(true);
    const t = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4 relative overflow-hidden">
      {/* CSS Confetti */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none" aria-hidden>
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-${10 + Math.random() * 20}px`,
                width: `${6 + Math.random() * 8}px`,
                height: `${6 + Math.random() * 8}px`,
                backgroundColor: ["#F97316", "#22C55E", "#F5F5F5", "#F59E0B"][Math.floor(Math.random() * 4)],
                borderRadius: Math.random() > 0.5 ? "50%" : "0",
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-[#22C55E]" />
        </div>

        <h1 className="text-3xl font-mono font-bold text-[#F5F5F5] mb-2">
          Order Placed!
        </h1>
        <p className="text-[#A3A3A3] mb-2">Your order has been confirmed.</p>

        {orderNumber && (
          <div className="bg-[#161616] border border-[#262626] rounded-lg px-4 py-3 inline-block mb-6">
            <p className="text-xs text-[#525252] font-mono uppercase tracking-wider mb-1">Order Number</p>
            <p className="text-lg font-mono font-bold text-[#F97316]">{orderNumber}</p>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-sm text-[#A3A3A3] mb-8">
          <Package className="w-4 h-4" />
          <span>Estimated delivery: 3–5 business days</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {orderNumber && (
            <Link
              href={`/account/orders/${orderNumber}`}
              className="inline-flex items-center justify-center h-11 px-6 text-sm rounded-lg bg-[#F97316] hover:bg-[#EA6C0A] text-white font-medium transition-colors"
            >
              View Order
            </Link>
          )}
          <Link
            href="/products"
            className="inline-flex items-center justify-center h-11 px-6 text-sm rounded-lg border border-[#262626] text-[#A3A3A3] hover:text-[#F5F5F5] hover:border-[#F97316] transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>

      <style jsx global>{`
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti {
          animation: confettiFall linear forwards;
        }
      `}</style>
    </div>
  );
}
