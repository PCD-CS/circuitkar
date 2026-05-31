import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSettings } from "@/lib/settings";
import type { Order, OrderItem, ShippingAddress } from "@/types";

export const dynamic = "force-dynamic";

function inr(n: number | null | undefined) {
  return `₹${Number(n ?? 0).toLocaleString("en-IN")}`;
}

export default async function OrderInvoicePage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const supabase = createAdminClient();

  const { data } = await supabase.from("orders").select("*").eq("order_number", orderNumber).maybeSingle();
  if (!data) notFound();

  const order = data as Order;
  const items = (order.items ?? []) as OrderItem[];
  const addr = order.shipping_address as ShippingAddress;
  const settings = await getSettings();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://circuitkar.in";

  const invoiceDate = new Date(order.created_at).toLocaleDateString("en-IN", {
    day: "2-digit", month: "long", year: "numeric",
  });

  const discount = (order as unknown as Record<string, number>).discount_amount ?? 0;
  const effectiveTotal = Math.max(0, (order.total ?? 0) - discount);

  return (
    <div className="min-h-screen bg-white text-black p-8 max-w-4xl mx-auto print:p-4">
      {/* Print button — hidden in print */}
      <div className="mb-6 flex gap-3 print:hidden">
        <button
          onClick={() => window.print()}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600"
        >
          Print / Save as PDF
        </button>
        <a
          href={`/admin/orders/${orderNumber}`}
          className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
        >
          ← Back to Order
        </a>
      </div>

      {/* Invoice header */}
      <div className="flex justify-between items-start border-b-2 border-orange-500 pb-6 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-orange-500 font-mono">CIRCUITKAR</h1>
          <p className="text-sm text-gray-500 mt-1">{siteUrl}</p>
          <p className="text-sm text-gray-500">{settings.store_email || "hello@circuitkar.in"}</p>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold text-gray-800">TAX INVOICE</h2>
          <p className="text-sm text-gray-500 mt-1">Invoice #: <span className="font-mono font-bold text-gray-800">{order.order_number}</span></p>
          <p className="text-sm text-gray-500">Date: {invoiceDate}</p>
          {order.is_test_order && (
            <span className="inline-block mt-1 bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded border border-amber-300 font-mono font-bold">TEST ORDER — NOT A REAL INVOICE</span>
          )}
        </div>
      </div>

      {/* Billing & Shipping */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Bill To</h3>
          <p className="font-semibold text-gray-800">{order.customer_name}</p>
          <p className="text-sm text-gray-600">{order.customer_email}</p>
          {order.customer_phone && <p className="text-sm text-gray-600">{order.customer_phone}</p>}
          {order.gstin && (
            <div className="mt-2">
              <p className="text-sm text-gray-600"><span className="font-medium">GSTIN:</span> <span className="font-mono">{order.gstin}</span></p>
              {order.business_name && <p className="text-sm text-gray-600">{order.business_name}</p>}
            </div>
          )}
        </div>
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Ship To</h3>
          <p className="font-semibold text-gray-800">{addr?.full_name || order.customer_name}</p>
          <p className="text-sm text-gray-600">{addr?.line1}{addr?.line2 ? `, ${addr.line2}` : ""}</p>
          <p className="text-sm text-gray-600">{addr?.city}, {addr?.state} — {addr?.pincode}</p>
          {addr?.phone && <p className="text-sm text-gray-600">{addr.phone}</p>}
        </div>
      </div>

      {/* Items table */}
      <table className="w-full mb-6 border-collapse">
        <thead>
          <tr className="bg-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
            <th className="text-left py-2 px-3 border border-gray-200">#</th>
            <th className="text-left py-2 px-3 border border-gray-200">Item</th>
            <th className="text-center py-2 px-3 border border-gray-200">Qty</th>
            <th className="text-right py-2 px-3 border border-gray-200">Unit Price</th>
            <th className="text-right py-2 px-3 border border-gray-200">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="py-3 px-3 text-sm text-gray-500 border border-gray-200">{i + 1}</td>
              <td className="py-3 px-3 border border-gray-200">
                <p className="font-medium text-gray-800 text-sm">{item.name}</p>
                {item.product_id && <p className="text-xs text-gray-400 font-mono">{item.product_id}</p>}
              </td>
              <td className="py-3 px-3 text-center text-sm text-gray-700 border border-gray-200">{item.qty}</td>
              <td className="py-3 px-3 text-right font-mono text-sm text-gray-700 border border-gray-200">{inr(item.price)}</td>
              <td className="py-3 px-3 text-right font-mono text-sm font-semibold text-gray-800 border border-gray-200">{inr(item.price * item.qty)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-72 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span><span className="font-mono">{inr(order.subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount {(order as unknown as Record<string, string>).coupon_code ? `(${(order as unknown as Record<string, string>).coupon_code})` : ""}</span>
              <span className="font-mono">−{inr(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-gray-600">
            <span>Shipping</span>
            <span className="font-mono">{Number(order.shipping_charge) === 0 ? "Free" : inr(order.shipping_charge)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600 border-t pt-2">
            <span>GST (18% incl.)</span>
            <span className="font-mono">{inr(effectiveTotal * 0.18 / 1.18)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t-2 border-gray-800 pt-2">
            <span>Total</span><span className="font-mono text-orange-500">{inr(effectiveTotal)}</span>
          </div>
        </div>
      </div>

      {/* Payment info */}
      <div className="border-t border-gray-200 pt-4 mb-6">
        <p className="text-xs text-gray-500">Payment Status: <span className="font-medium text-gray-700 capitalize">{order.payment_status}</span></p>
        {order.razorpay_payment_id && <p className="text-xs text-gray-500 font-mono">Payment ID: {order.razorpay_payment_id}</p>}
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-400 border-t border-gray-200 pt-4">
        <p>Thank you for your order! For queries: <span className="text-gray-600">{settings.store_email || "hello@circuitkar.in"}</span></p>
        <p className="mt-1">This is a computer-generated invoice and does not require a signature.</p>
      </div>

      <style>{`
        @media print {
          @page { margin: 1cm; }
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}
