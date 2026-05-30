import { Metadata } from "next";
import { ShoppingCart, Clock } from "lucide-react";

export const metadata: Metadata = { title: "Orders" };

export default function AdminOrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold font-mono text-[#F5F5F5]">Orders</h1>
        <p className="text-sm text-[#525252] mt-1">Order management</p>
      </div>

      <div className="bg-[#161616] border border-[#262626] rounded-lg flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-[#1E1E1E] flex items-center justify-center mb-4">
          <ShoppingCart className="w-8 h-8 text-[#525252]" />
        </div>
        <h2 className="text-lg font-semibold text-[#F5F5F5] mb-2">Coming in Phase 2</h2>
        <p className="text-sm text-[#525252] max-w-sm">
          Order management will be activated once Razorpay payments go live.
          The database table is ready and waiting.
        </p>
        <div className="flex items-center gap-2 mt-6 text-xs text-[#525252] font-mono">
          <Clock className="w-3.5 h-3.5" />
          <span>Activate by setting RAZORPAY_LIVE=true</span>
        </div>
      </div>
    </div>
  );
}
