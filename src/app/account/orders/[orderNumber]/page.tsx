import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ExternalLink, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils";
import { getSettings } from "@/lib/settings";
import type { Order, OrderItem, ShippingAddress } from "@/types";

export const dynamic = "force-dynamic";

const TIMELINE: { key: Order["status"]; label: string }[] = [
  { key: "pending", label: "Order Placed" },
  { key: "confirmed", label: "Confirmed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

const statusVariant: Record<string, "accent" | "success" | "warning" | "status"> = {
  pending: "warning",
  confirmed: "accent",
  shipped: "accent",
  delivered: "success",
  cancelled: "status",
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
  const currentIndex = TIMELINE.findIndex((t) => t.key === order.status);
  const cancelled = order.status === "cancelled";

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
        <Badge variant={statusVariant[order.status] ?? "category"}>
          {order.status}
        </Badge>
      </div>

      {/* Timeline */}
      {!cancelled && (
        <div className="rounded-lg border border-[#262626] bg-[#161616] p-5">
          <div className="flex items-center justify-between">
            {TIMELINE.map((step, i) => {
              const done = i <= currentIndex;
              return (
                <div key={step.key} className="flex flex-1 flex-col items-center">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                      done
                        ? "bg-[#F97316] text-white"
                        : "bg-[#262626] text-[#525252]"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <span
                    className={`mt-1.5 text-center text-[10px] ${
                      done ? "text-[#F5F5F5]" : "text-[#525252]"
                    }`}
                  >
                    {step.label}
                  </span>
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
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-[#A3A3A3]">
            <span>Shipping</span>
            <span>
              {Number(order.shipping_charge) === 0
                ? "Free"
                : formatPrice(order.shipping_charge)}
            </span>
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
          <h3 className="mb-2 text-sm font-semibold text-[#F5F5F5]">
            Tracking &amp; GST
          </h3>
          {order.shiprocket_tracking ? (
            <a
              href={order.shiprocket_tracking}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-[#F97316] hover:text-[#EA6C0A]"
            >
              Track shipment <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : (
            <p className="text-sm text-[#525252]">
              Tracking will appear once shipped.
            </p>
          )}
          {order.gstin && (
            <p className="mt-2 text-xs text-[#A3A3A3]">
              GSTIN: <span className="font-mono">{order.gstin}</span>
            </p>
          )}
          {order.business_name && (
            <p className="text-xs text-[#A3A3A3]">{order.business_name}</p>
          )}
          <p className="mt-2 text-xs text-[#525252]">
            Payment: {order.payment_status}
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
