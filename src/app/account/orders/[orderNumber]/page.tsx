import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ExternalLink, MessageCircle, CheckCircle2, Truck, Package, Home, ShoppingBag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/utils";
import { getSettings } from "@/lib/settings";
import type { Order, OrderItem, ShippingAddress } from "@/types";

export const dynamic = "force-dynamic";

const TIMELINE: { key: Order["status"]; label: string; icon: React.ElementType }[] = [
  { key: "confirmed",  label: "Order Confirmed", icon: CheckCircle2 },
  { key: "accepted",   label: "Accepted",         icon: ShoppingBag },
  { key: "packed",     label: "Packed",            icon: Package },
  { key: "shipped",    label: "Shipped",           icon: Truck },
  { key: "delivered",  label: "Delivered",         icon: Home },
];

const STATUS_ORDER = ["confirmed", "accepted", "packed", "shipped", "delivered"];

const STATUS_COLORS: Record<string, string> = {
  confirmed: "text-[#3B82F6] bg-[#3B82F6]/10 border-[#3B82F6]/30",
  accepted:  "text-[#8B5CF6] bg-[#8B5CF6]/10 border-[#8B5CF6]/30",
  packed:    "text-[#F97316] bg-[#F97316]/10 border-[#F97316]/30",
  shipped:   "text-[#06B6D4] bg-[#06B6D4]/10 border-[#06B6D4]/30",
  delivered: "text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/30",
  cancelled: "text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/30",
  pending:   "text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const { data } = await admin
    .from("orders")
    .select("*")
    .eq("order_number", orderNumber)
    .eq("customer_id", user!.id)
    .maybeSingle();

  if (!data) notFound();
  const order = data as Order;
  const items = (order.items ?? []) as OrderItem[];
  const addr = order.shipping_address as ShippingAddress;
  const cancelled = order.status === "cancelled";
  const currentStatusIndex = STATUS_ORDER.indexOf(order.status);
  const discount = (order as unknown as Record<string, number>).discount_amount ?? 0;

  const settings = await getSettings();
  const waHref = `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(
    `Hi Circuitkar, I need help with order #${order.order_number}`,
  )}`;

  return (
    <div className="space-y-6">
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-1 text-sm text-[#A3A3A3] hover:text-[#F5F5F5]"
      >
        <ChevronLeft className="h-4 w-4" /> Back to orders
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-mono text-lg font-bold text-[#F5F5F5]">
            #{order.order_number}
          </h2>
          <p className="text-xs text-[#525252]">
            Placed on {new Date(order.created_at).toLocaleDateString("en-IN")}
          </p>
        </div>
        <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium capitalize ${STATUS_COLORS[order.status] ?? "text-[#A3A3A3] bg-[#1E1E1E] border-[#262626]"}`}>
          {order.status}
        </span>
      </div>

      {/* Timeline */}
      {cancelled ? (
        <div className="rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 p-4 text-sm text-[#EF4444]">
          This order was cancelled. {order.payment_status === "refunded" ? "Your refund has been processed." : "If payment was made, a refund will be processed within 5–7 business days."}
        </div>
      ) : (
        <div className="rounded-lg border border-[#262626] bg-[#161616] p-5">
          <div className="flex items-center">
            {TIMELINE.map((step, i) => {
              const stepIndex = STATUS_ORDER.indexOf(step.key);
              const done = stepIndex <= currentStatusIndex;
              const isCurrent = step.key === order.status;
              const Icon = done ? CheckCircle2 : step.icon;
              return (
                <div key={step.key} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                      isCurrent ? "border-[#F97316] bg-[#F97316]/15 text-[#F97316]"
                      : done ? "border-[#22C55E] bg-[#22C55E]/15 text-[#22C55E]"
                      : "border-[#262626] bg-[#1A1A1A] text-[#525252]"
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className={`mt-1 text-center text-[10px] leading-tight max-w-[56px] ${isCurrent ? "text-[#F97316] font-medium" : done ? "text-[#A3A3A3]" : "text-[#525252]"}`}>
                      {step.label}
                    </span>
                  </div>
                  {i < TIMELINE.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 ${stepIndex < currentStatusIndex ? "bg-[#22C55E]/50" : "bg-[#262626]"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Items */}
      <div className="rounded-lg border border-[#262626] bg-[#161616] p-5">
        <h3 className="mb-3 text-sm font-semibold text-[#F5F5F5]">Items</h3>
        <div className="divide-y divide-[#262626]">
          {items.map((it, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 text-sm">
              <div>
                <p className="text-[#F5F5F5]">{it.name}</p>
                <p className="text-xs text-[#525252]">Qty {it.qty}</p>
              </div>
              <span className="text-[#A3A3A3]">
                {formatPrice(it.price * it.qty)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 space-y-1 border-t border-[#262626] pt-3 text-sm">
          <div className="flex justify-between text-[#A3A3A3]">
            <span>Subtotal</span><span>{formatPrice(order.subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-[#22C55E]">
              <span>Discount</span><span>−{formatPrice(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-[#A3A3A3]">
            <span>Shipping</span>
            <span>{Number(order.shipping_charge) === 0 ? "Free" : formatPrice(order.shipping_charge)}</span>
          </div>
          <div className="flex justify-between pt-1 text-base font-semibold">
            <span className="text-[#F5F5F5]">Total</span>
            <span className="text-[#F97316]">{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-[#262626] bg-[#161616] p-5">
          <h3 className="mb-2 text-sm font-semibold text-[#F5F5F5]">
            Shipping Address
          </h3>
          <p className="text-sm text-[#A3A3A3]">{order.customer_name}</p>
          <p className="text-sm text-[#A3A3A3]">
            {addr?.line1}
            {addr?.line2 ? `, ${addr.line2}` : ""}
          </p>
          <p className="text-sm text-[#A3A3A3]">
            {addr?.city}, {addr?.state} — {addr?.pincode}
          </p>
          {order.customer_phone && (
            <p className="mt-1 text-xs text-[#525252]">{order.customer_phone}</p>
          )}
        </div>

        <div className="rounded-lg border border-[#262626] bg-[#161616] p-5">
          <h3 className="mb-2 text-sm font-semibold text-[#F5F5F5]">Shipment &amp; Payment</h3>
          {(order.tracking_url || order.shiprocket_tracking) ? (
            <a
              href={order.tracking_url || order.shiprocket_tracking || "#"}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-[#F97316] hover:text-[#EA6C0A]"
            >
              <Truck className="h-3.5 w-3.5" /> Track Shipment <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : (
            <p className="text-sm text-[#525252]">Tracking will appear once shipped.</p>
          )}
          {order.courier_name && <p className="text-xs text-[#A3A3A3] mt-1">Courier: {order.courier_name}</p>}
          {order.tracking_number && <p className="text-xs font-mono text-[#F97316] mt-0.5">AWB: {order.tracking_number}</p>}
          {order.gstin && (
            <div className="mt-2 pt-2 border-t border-[#262626]">
              <p className="text-xs text-[#A3A3A3]">GSTIN: <span className="font-mono">{order.gstin}</span></p>
              {order.business_name && <p className="text-xs text-[#A3A3A3]">{order.business_name}</p>}
            </div>
          )}
          <p className="mt-2 text-xs text-[#525252]">
            Payment: <span className={order.payment_status === "paid" ? "text-[#22C55E]" : "text-[#F59E0B]"}>{order.payment_status}</span>
          </p>
        </div>
      </div>

      {/* Need help */}
      <div className="rounded-lg border border-[#262626] bg-[#161616] p-5">
        <h3 className="mb-1 text-sm font-semibold text-[#F5F5F5]">Need help?</h3>
        <p className="mb-3 text-sm text-[#A3A3A3]">
          Questions about this order? Reach us on WhatsApp.
        </p>
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-[#22C55E] px-4 py-2 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-95"
        >
          <MessageCircle className="h-4 w-4" />
          Chat on WhatsApp
        </a>
      </div>
    </div>
  );
}
