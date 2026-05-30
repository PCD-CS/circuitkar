import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Order, OrderItem, ShippingAddress } from "@/types";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-[#F59E0B20] text-[#F59E0B] border-[#F59E0B]/40",
  confirmed: "bg-[#22C55E20] text-[#22C55E] border-[#22C55E]/40",
  shipped: "bg-[#F9731620] text-[#F97316] border-[#F97316]/40",
  delivered: "bg-[#22C55E20] text-[#22C55E] border-[#22C55E]/40",
  cancelled: "bg-[#EF444420] text-[#EF4444] border-[#EF4444]/40",
};

function inr(n: number | null) {
  return `₹${Number(n ?? 0).toLocaleString("en-IN")}`;
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("orders")
    .select("*")
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (!data) notFound();
  const order = data as Order;
  const items = (order.items ?? []) as OrderItem[];
  const addr = order.shipping_address as ShippingAddress;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1 text-sm text-[#A3A3A3] hover:text-[#F5F5F5]"
      >
        <ChevronLeft className="h-4 w-4" /> Back to orders
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-mono text-lg font-bold text-[#F5F5F5]">
            #{order.order_number}
          </h1>
          <p className="text-xs text-[#525252]">
            Placed on{" "}
            {new Date(order.created_at).toLocaleString("en-IN")}
          </p>
        </div>
        <span
          className={`inline-block rounded-md border px-2.5 py-1 text-xs ${
            STATUS_STYLE[order.status] ??
            "bg-[#262626] text-[#A3A3A3] border-[#262626]"
          }`}
        >
          {order.status}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Items + totals */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-lg border border-[#262626] bg-[#161616] p-5">
            <h3 className="mb-3 text-sm font-semibold text-[#F5F5F5]">Items</h3>
            <div className="divide-y divide-[#262626]">
              {items.map((it, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2.5 text-sm"
                >
                  <div>
                    <p className="text-[#F5F5F5]">{it.name}</p>
                    <p className="text-xs text-[#525252]">
                      Qty {it.qty} × {inr(it.price)}
                    </p>
                  </div>
                  <span className="text-[#A3A3A3]">
                    {inr(it.price * it.qty)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-1 border-t border-[#262626] pt-3 text-sm">
              <div className="flex justify-between text-[#A3A3A3]">
                <span>Subtotal</span>
                <span>{inr(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-[#A3A3A3]">
                <span>Shipping</span>
                <span>
                  {Number(order.shipping_charge) === 0
                    ? "Free"
                    : inr(order.shipping_charge)}
                </span>
              </div>
              <div className="flex justify-between pt-1 text-base font-semibold">
                <span className="text-[#F5F5F5]">Total</span>
                <span className="text-[#F97316]">{inr(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer / address / meta */}
        <div className="space-y-4">
          <div className="rounded-lg border border-[#262626] bg-[#161616] p-5">
            <h3 className="mb-2 text-sm font-semibold text-[#F5F5F5]">
              Customer
            </h3>
            <p className="text-sm text-[#A3A3A3]">{order.customer_name}</p>
            <p className="text-sm text-[#A3A3A3]">{order.customer_email}</p>
            {order.customer_phone && (
              <p className="text-sm text-[#A3A3A3]">{order.customer_phone}</p>
            )}
          </div>

          <div className="rounded-lg border border-[#262626] bg-[#161616] p-5">
            <h3 className="mb-2 text-sm font-semibold text-[#F5F5F5]">
              Shipping Address
            </h3>
            <p className="text-sm text-[#A3A3A3]">
              {addr?.line1}
              {addr?.line2 ? `, ${addr.line2}` : ""}
            </p>
            <p className="text-sm text-[#A3A3A3]">
              {addr?.city}, {addr?.state} — {addr?.pincode}
            </p>
            <p className="text-sm text-[#A3A3A3]">{addr?.country}</p>
          </div>

          <div className="rounded-lg border border-[#262626] bg-[#161616] p-5">
            <h3 className="mb-2 text-sm font-semibold text-[#F5F5F5]">
              Payment &amp; Shipping
            </h3>
            <p className="text-xs text-[#A3A3A3]">
              Payment: {order.payment_status}
            </p>
            {order.razorpay_payment_id && (
              <p className="mt-1 text-xs text-[#525252]">
                Razorpay: {order.razorpay_payment_id}
              </p>
            )}
            {order.shiprocket_order_id && (
              <p className="mt-1 text-xs text-[#525252]">
                Shiprocket: {order.shiprocket_order_id}
              </p>
            )}
            {order.shiprocket_tracking ? (
              <a
                href={order.shiprocket_tracking}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-sm text-[#F97316] hover:text-[#EA6C0A]"
              >
                Track shipment <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : (
              <p className="mt-2 text-xs text-[#525252]">No tracking yet.</p>
            )}
            {order.gstin && (
              <p className="mt-2 text-xs text-[#A3A3A3]">
                GSTIN: <span className="font-mono">{order.gstin}</span>
              </p>
            )}
            {order.business_name && (
              <p className="text-xs text-[#A3A3A3]">{order.business_name}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
