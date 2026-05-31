"use client";

export function InvoiceActions({ orderNumber }: { orderNumber: string }) {
  return (
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
  );
}
