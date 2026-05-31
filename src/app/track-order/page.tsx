"use client";

import { useState } from "react";
import Link from "next/link";
import { Package, Search, CheckCircle, Truck, Clock, XCircle, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  pending:   { label: "Pending",   icon: Clock,        color: "text-[#F59E0B]" },
  confirmed: { label: "Confirmed", icon: CheckCircle,  color: "text-[#3B82F6]" },
  accepted:  { label: "Accepted",  icon: ShoppingBag,  color: "text-[#8B5CF6]" },
  packed:    { label: "Packed",    icon: Package,      color: "text-[#F97316]" },
  shipped:   { label: "Shipped",   icon: Truck,        color: "text-[#06B6D4]" },
  delivered: { label: "Delivered", icon: CheckCircle,  color: "text-[#22C55E]" },
  cancelled: { label: "Cancelled", icon: XCircle,      color: "text-[#EF4444]" },
};

// Full forward-order timeline shown to customers
const TIMELINE_STEPS = ["confirmed", "accepted", "packed", "shipped", "delivered"];
const TIMELINE_LABELS: Record<string, string> = {
  confirmed: "Confirmed",
  accepted:  "Accepted",
  packed:    "Packed",
  shipped:   "Shipped",
  delivered: "Delivered",
};

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
  courier_name: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  created_at: string;
}

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState("");

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true); setOrder(null);
    const res = await fetch(`/api/track?orderNumber=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent(email)}`);
    const data = await res.json();
    if (res.ok) {
      setOrder(data.order);
      setWhatsappNumber(data.whatsappNumber ?? "");
    } else {
      setError(data.error || "Order not found. Please check your details.");
    }
    setLoading(false);
  }

  const currentStepIndex = order ? TIMELINE_STEPS.indexOf(order.status) : -1;
  const waHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi Circuitkar, I have a query about order #${order?.order_number}`)}`
    : undefined;

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
              placeholder="CK-310526-0001"
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
            {/* Status header */}
            <div className="bg-[#161616] border border-[#262626] rounded-lg p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-xs text-[#525252] font-mono">Order</p>
                  <p className="text-lg font-mono font-bold text-[#F97316]">{order.order_number}</p>
                  <p className="text-xs text-[#525252] mt-0.5">
                    Placed {new Date(order.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>
                {(() => {
                  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
                  const Icon = cfg.icon;
                  return (
                    <div className="flex items-center gap-2">
                      <Icon className={`w-5 h-5 ${cfg.color}`} />
                      <span className={`font-semibold text-sm ${cfg.color}`}>{cfg.label}</span>
                    </div>
                  );
                })()}
              </div>

              {/* Full timeline */}
              {order.status !== "cancelled" && (
                <>
                  <div className="flex items-center">
                    {TIMELINE_STEPS.map((step, i) => {
                      const done = currentStepIndex >= i;
                      const active = currentStepIndex === i;
                      return (
                        <div key={step} className="flex items-center flex-1">
                          <div className={`w-3 h-3 rounded-full flex-shrink-0 border-2 transition-colors ${
                            done
                              ? active
                                ? "bg-[#F97316] border-[#F97316]"
                                : "bg-[#22C55E] border-[#22C55E]"
                              : "bg-[#0A0A0A] border-[#525252]"
                          }`} />
                          {i < TIMELINE_STEPS.length - 1 && (
                            <div className={`flex-1 h-0.5 ${done && currentStepIndex > i ? "bg-[#22C55E]" : "bg-[#262626]"}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-1.5">
                    {TIMELINE_STEPS.map(step => (
                      <span key={step} className={`text-[10px] ${TIMELINE_STEPS.indexOf(step) <= currentStepIndex ? "text-[#A3A3A3]" : "text-[#525252]"}`}>
                        {TIMELINE_LABELS[step]}
                      </span>
                    ))}
                  </div>
                </>
              )}

              {order.status === "cancelled" && (
                <div className="mt-3 text-sm text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-lg px-4 py-3">
                  This order has been cancelled.
                </div>
              )}
            </div>

            {/* Tracking info */}
            {(order.shiprocket_tracking || order.tracking_number) && (
              <div className="bg-[#161616] border border-[#262626] rounded-lg p-5">
                <p className="text-xs font-mono text-[#525252] uppercase tracking-wider mb-2">Shipment</p>
                {order.courier_name && (
                  <p className="text-sm text-[#A3A3A3] mb-1">Courier: <span className="text-[#F5F5F5]">{order.courier_name}</span></p>
                )}
                {(order.tracking_number || order.shiprocket_tracking) && (
                  <p className="font-mono text-sm text-[#F5F5F5] mb-3">
                    Tracking: {order.tracking_number || order.shiprocket_tracking}
                  </p>
                )}
                {order.tracking_url ? (
                  <a href={order.tracking_url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#F97316] hover:underline">
                    Track shipment →
                  </a>
                ) : order.shiprocket_tracking ? (
                  <a
                    href={`https://shiprocket.co/tracking/${order.shiprocket_tracking}`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-xs text-[#F97316] hover:underline"
                  >
                    Track on Shiprocket →
                  </a>
                ) : null}
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

            {waHref && (
              <div className="text-center">
                <Link
                  href={waHref}
                  target="_blank" rel="noopener noreferrer"
                  className="text-sm text-[#F97316] hover:underline"
                >
                  Need help? WhatsApp us about this order →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
