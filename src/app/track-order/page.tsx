import { Metadata } from "next";
import Link from "next/link";
import { Package, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Track Order",
  description: "Track your Circuitkar order.",
};

export default function TrackOrderPage() {
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "91XXXXXXXXXX";

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-[#161616] border border-[#262626] flex items-center justify-center mx-auto mb-6">
          <Package className="w-9 h-9 text-[#525252]" />
        </div>

        <h1 className="text-2xl font-mono font-bold text-[#F5F5F5] mb-3">
          Order Tracking
        </h1>
        <p className="text-[#A3A3A3] text-sm mb-8">
          Online order tracking is coming soon. In the meantime, contact us directly
          for order updates.
        </p>

        <div className="bg-[#161616] border border-[#262626] rounded-lg p-5 text-left space-y-4 mb-8">
          <div className="flex items-center gap-2 text-xs font-mono text-[#525252] uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" />
            Current Status
          </div>
          <p className="text-sm text-[#A3A3A3]">
            We&apos;re in pre-launch mode. Order placement via Razorpay will be active
            soon. Once live, this page will let you track shipments via Shiprocket.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={`https://wa.me/${whatsapp}?text=Hi, I want to track my order`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 h-11 px-5 text-sm rounded-lg bg-[#F97316] hover:bg-[#EA6C0A] text-white font-medium transition-colors"
          >
            WhatsApp for Update
          </a>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 h-11 px-5 text-sm rounded-lg border border-[#262626] text-[#A3A3A3] hover:text-[#F5F5F5] hover:border-[#F97316] transition-colors"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}
