"use client";

import { useState } from "react";
import Link from "next/link";
import { Package, Search, CheckCircle, Truck, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  pending: { label: "Pending", icon: Clock, color: "text-[#F59E0B]" },
  confirmed: { label: "Confirmed", icon: CheckCircle, color: "text-[#22C55E]" },
  shipped: { label: "Shipped", icon: Truck, color: "text-[#F97316]" },
  delivered: { label: "Delivered", icon: CheckCircle, color: "text-[#22C55E]" },
  cancelled: { label: "Cancelled", icon: XCircle, color: "text-[#EF4444]" },
};

const TIMELINE_STEPS = ["confirmed", "shipped", "delivered"];

interface TrackedOrder {
  order_number: string;
  status: string;
  payment_status: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  shipping_address: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: any[];
  subtotal: number;
  shipping_charge: number;
  total: number;
  shiprocket_tracking: string | null;
  created_at: string;
}

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true); setOrder(null);
    const res = await fetch(`/api/track?orderNumber=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent(email)}`);
    const data = await res.json();
    if (res.ok) {
      setOrder(data.order);
    } else {
      setError(data.error || "Order not found. Please check your details.");
    }
    setLoading(false);
  }

  const currentStepIndex = order ? TIMELINE_STEPS.indexOf(order.status) : -1;

  return (
    <div className="min-h-screen bg-[#0A0A0A] py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-full bg-[#161616] border border-[#262626] flex items-center justify-center mx-auto mb-4">
            <Package className="w-7 h-7 text-[#F97316]" />
          </div>
          <h1 className="text-2xl font-mono font-bold text-[#F5F5F5] mb-2">Track Your Order</h1>
          <p className="text-sm text-[#A3A3A3]">Enter your order number and email to see the latest status.</p>
        </div>

        <form onSubmit={handleSearch} className="bg-[#161616] border border-[#262626] rounded-lg p-6 mb-6">
          <div className="space-y-4">
            <Input
              label="Order Number"
              value={orderNumber}
              onChange={e => setOrderNumber(e.target.value.toUpperCase())}
              placeholder="CK-ABC123-XY9Z"
              required
            />
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            {error && (
              <div className="bg-[#EF444415] border border-[#EF4444]/30 rounded-lg px-4 py-3 text-sm text-[#EF4444]">{error}</div>
            )}
            <Button type="submit" loading={loading} className="w-full">
              <Search className="w-4 h-4" /> Track Order
            </Button>
          </div>
        </form>

        {order && (
          <div className="space-y-4">
            {/* Status */}
            <div className="bg-[#161616] border border-[#262626] rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-[#525252] font-mono">Order</p>
                  <p className="text-lg font-mono font-bold text-[#F97316]">{order.order_number}</p>
                </div>
                {(() => {
                  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                  const Icon = cfg.icon;
                  return (
                    <div className="flex items-center gap-2">
                      <Icon className={`w-5 h-5 ${cfg.color}`} />
                      <span className={`font-semibold text-sm ${cfg.color}`}>{cfg.label}</span>
                    </div>
                  );
                })()}
              </div>

              {/* Timeline */}
              {order.status !== "cancelled" && (
                <div className="flex items-center gap-2 mt-4">
                  {TIMELINE_STEPS.map((step, i) => {
                    const done = i <= currentStepIndex;
                    const active = i === currentStepIndex;
                    return (
                      <div key={step} className="flex items-center flex-1">
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 border-2 transition-colors ${
                          done ? "bg-[#F97316] border-[#F97316]" : active ? "border-[#F97316]" : "border-[#525252]"
                        }`} />
                        {i < TIMELINE_STEPS.length - 1 && (
                          <div className={`flex-1 h-0.5 ${done && i < currentStepIndex ? "bg-[#F97316]" : "bg-[#262626]"}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="flex justify-between mt-1">
                {TIMELINE_STEPS.map(step => (
                  <span key={step} className="text-xs text-[#525252] capitalize">{step}</span>
                ))}
              </div>
            </div>

            {/* Tracking */}
            {order.shiprocket_tracking && (
              <div className="bg-[#161616] border border-[#262626] rounded-lg p-5">
                <p className="text-xs font-mono text-[#525252] uppercase tracking-wider mb-2">Tracking ID</p>
                <p className="font-mono text-sm text-[#F5F5F5] mb-3">{order.shiprocket_tracking}</p>
                <a
                  href={`https://shiprocket.co/tracking/${order.shiprocket_tracking}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-xs text-[#F97316] hover:underline"
                >
                  Track on Shiprocket →
                </a>
              </div>
            )}

            {/* Items */}
            <div className="bg-[#161616] border border-[#262626] rounded-lg p-5">
              <p className="text-xs font-mono text-[#525252] uppercase tracking-wider mb-3">Items</p>
              <div className="space-y-2">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-[#A3A3A3]">{item.name} × {item.qty}</span>
                    <span className="font-mono text-[#F5F5F5]">₹{(item.price * item.qty).toLocaleString("en-IN")}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-[#262626]">
                  <span className="text-[#F5F5F5]">Total</span>
                  <span className="text-[#F97316] font-mono">₹{order.total?.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Link
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=Hi, query about order ${order.order_number}`}
                target="_blank" rel="noopener noreferrer"
                className="text-sm text-[#F97316] hover:underline"
              >
                Need help? WhatsApp us about this order →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
