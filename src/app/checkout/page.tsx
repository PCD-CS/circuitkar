"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, MapPin, Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useCart } from "@/lib/cart-context";
import { INDIAN_STATES } from "@/lib/indian-states";
import type { CustomerAddress } from "@/types";

export const dynamic = "force-dynamic";

type Step = "address" | "review";

interface CheckoutSummary {
  subtotal: number;
  shipping: number;
  gst: number;
  total: number;
  launchMode: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, itemCount } = useCart();

  const [step, setStep] = useState<Step>("address");
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [summary, setSummary] = useState<CheckoutSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  // GST state
  const [wantGst, setWantGst] = useState(false);
  const [gstin, setGstin] = useState("");
  const [businessName, setBusinessName] = useState("");

  // New address form
  const [newAddr, setNewAddr] = useState({
    label: "Home", full_name: "", phone: "", line1: "", line2: "",
    city: "", state: "", pincode: "", is_default: false,
  });
  const [pincodeLoading, setPincodeLoading] = useState(false);

  useEffect(() => {
    if (itemCount === 0) { router.push("/cart"); return; }
    Promise.all([
      fetch("/api/account/addresses").then(r => r.json()),
      fetch("/api/checkout", { method: "POST" }).then(r => r.json()),
    ]).then(([addrData, checkoutData]) => {
      setAddresses(addrData.addresses ?? []);
      const def = addrData.addresses?.find((a: CustomerAddress) => a.is_default);
      if (def) setSelectedAddressId(def.id);
      setSummary(checkoutData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [itemCount, router]);

  async function handlePincodeBlur() {
    if (newAddr.pincode.length !== 6) return;
    setPincodeLoading(true);
    try {
      const res = await fetch(`/api/pincode/${newAddr.pincode}`);
      const data = await res.json();
      if (data.city) setNewAddr(p => ({ ...p, city: data.city, state: data.state }));
    } catch { /* ignore */ }
    setPincodeLoading(false);
  }

  async function saveNewAddress(): Promise<string | null> {
    const res = await fetch("/api/account/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newAddr),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Failed to save address."); return null; }
    return data.address.id;
  }

  async function handleContinue() {
    setError("");
    let addressId = selectedAddressId;
    if (useNewAddress) {
      if (!newAddr.full_name || !newAddr.phone || !newAddr.line1 || !newAddr.city || !newAddr.state || !newAddr.pincode) {
        setError("Please fill all required address fields."); return;
      }
      const id = await saveNewAddress();
      if (!id) return;
      addressId = id;
    }
    if (!addressId) { setError("Please select or add a delivery address."); return; }
    setSelectedAddressId(addressId);
    setStep("review");
    window.scrollTo(0, 0);
  }

  async function handlePlaceOrder() {
    if (!summary) return;
    setError(""); setPlacing(true);
    try {
      if (summary.launchMode === "live") {
        // Razorpay flow
        const rzpRes = await fetch("/api/razorpay/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: summary.total, receipt: `order_${Date.now()}` }),
        });
        const rzpData = await rzpRes.json();
        if (!rzpRes.ok) { setError(rzpData.error || "Payment setup failed."); setPlacing(false); return; }

        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        document.body.appendChild(script);
        await new Promise(r => { script.onload = r; });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rzp = new (window as any).Razorpay({
          key: rzpData.keyId,
          amount: rzpData.amount,
          currency: "INR",
          order_id: rzpData.orderId,
          name: "Circuitkar",
          description: "Electronic Components",
          handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
            const verifyRes = await fetch("/api/razorpay/verify", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });
            if (!verifyRes.ok) { setError("Payment verification failed."); setPlacing(false); return; }
            await createOrder(response.razorpay_order_id, response.razorpay_payment_id, summary);
          },
          modal: { ondismiss: () => setPlacing(false) },
        });
        rzp.open();
      } else {
        setError("Checkout is not yet live. Your cart is saved!");
        setPlacing(false);
      }
    } catch {
      setError("Something went wrong. Please try again."); setPlacing(false);
    }
  }

  async function createOrder(rzpOrderId: string, rzpPaymentId: string, sum: CheckoutSummary) {
    const res = await fetch("/api/orders/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        addressId: selectedAddressId, gstin: wantGst ? gstin : undefined,
        businessName: wantGst ? businessName : undefined,
        razorpayOrderId: rzpOrderId, razorpayPaymentId: rzpPaymentId,
        subtotal: sum.subtotal, shipping: sum.shipping, gst: sum.gst, total: sum.total,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      router.push(`/checkout/success?order=${data.orderNumber}`);
    } else {
      setError(data.error || "Failed to create order."); setPlacing(false);
    }
  }

  const selectedAddress = addresses.find(a => a.id === selectedAddressId);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Steps */}
        <div className="flex items-center gap-2 mb-8 text-sm">
          <span className={step === "address" ? "text-[#F97316] font-semibold" : "text-[#A3A3A3]"}>
            1. Delivery Address
          </span>
          <ChevronRight className="w-4 h-4 text-[#525252]" />
          <span className={step === "review" ? "text-[#F97316] font-semibold" : "text-[#A3A3A3]"}>
            2. Review & Pay
          </span>
        </div>

        {error && (
          <div className="mb-6 bg-[#EF444415] border border-[#EF4444]/30 rounded-lg px-4 py-3 text-sm text-[#EF4444] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {step === "address" && (
              <>
                {/* Saved addresses */}
                {addresses.map(addr => (
                  <button
                    key={addr.id}
                    onClick={() => { setSelectedAddressId(addr.id); setUseNewAddress(false); }}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      selectedAddressId === addr.id && !useNewAddress
                        ? "border-[#F97316] bg-[#F9731615]"
                        : "border-[#262626] bg-[#161616] hover:border-[#F97316]/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                        selectedAddressId === addr.id && !useNewAddress ? "border-[#F97316] bg-[#F97316]" : "border-[#525252]"
                      }`} />
                      <div>
                        <p className="text-xs font-mono text-[#F97316] mb-1">{addr.label}</p>
                        <p className="text-sm text-[#F5F5F5] font-medium">{addr.full_name}</p>
                        <p className="text-sm text-[#A3A3A3]">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
                        <p className="text-sm text-[#A3A3A3]">{addr.city}, {addr.state} — {addr.pincode}</p>
                        <p className="text-sm text-[#A3A3A3]">{addr.phone}</p>
                      </div>
                    </div>
                  </button>
                ))}

                {/* New address toggle */}
                <button
                  onClick={() => { setUseNewAddress(!useNewAddress); setSelectedAddressId(""); }}
                  className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-all ${
                    useNewAddress ? "border-[#F97316] bg-[#F9731615]" : "border-[#262626] bg-[#161616] hover:border-[#F97316]/50"
                  }`}
                >
                  <Plus className="w-5 h-5 text-[#F97316]" />
                  <span className="text-sm text-[#F5F5F5]">Use a new address</span>
                </button>

                {useNewAddress && (
                  <div className="bg-[#161616] border border-[#262626] rounded-lg p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="Full Name *" value={newAddr.full_name} onChange={e => setNewAddr(p => ({ ...p, full_name: e.target.value }))} />
                      <Input label="Phone *" value={newAddr.phone} onChange={e => setNewAddr(p => ({ ...p, phone: e.target.value }))} />
                    </div>
                    <Input label="Address Line 1 *" value={newAddr.line1} onChange={e => setNewAddr(p => ({ ...p, line1: e.target.value }))} />
                    <Input label="Address Line 2" value={newAddr.line2} onChange={e => setNewAddr(p => ({ ...p, line2: e.target.value }))} />
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-[#A3A3A3] mb-1.5 font-mono uppercase tracking-wider">Pincode *</label>
                        <input value={newAddr.pincode} onChange={e => setNewAddr(p => ({ ...p, pincode: e.target.value }))}
                          onBlur={handlePincodeBlur} maxLength={6} placeholder="400001"
                          className="w-full bg-[#111111] border border-[#262626] rounded-lg px-3 py-2.5 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#F97316]" />
                        {pincodeLoading && <p className="text-xs text-[#525252] mt-1">Looking up...</p>}
                      </div>
                      <Input label="City *" value={newAddr.city} onChange={e => setNewAddr(p => ({ ...p, city: e.target.value }))} />
                      <div>
                        <label className="block text-xs text-[#A3A3A3] mb-1.5 font-mono uppercase tracking-wider">State *</label>
                        <select value={newAddr.state} onChange={e => setNewAddr(p => ({ ...p, state: e.target.value }))}
                          className="w-full bg-[#111111] border border-[#262626] rounded-lg px-3 py-2.5 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#F97316]">
                          <option value="">Select</option>
                          {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* GST */}
                <div className="bg-[#161616] border border-[#262626] rounded-lg p-5">
                  <label className="flex items-center gap-3 cursor-pointer mb-3">
                    <div className="relative">
                      <input type="checkbox" className="sr-only" checked={wantGst} onChange={e => setWantGst(e.target.checked)} />
                      <div className={`w-10 h-5 rounded-full transition-colors ${wantGst ? "bg-[#F97316]" : "bg-[#262626]"}`} />
                      <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${wantGst ? "translate-x-5" : "translate-x-0"}`} />
                    </div>
                    <span className="text-sm text-[#F5F5F5]">I want a GST invoice</span>
                  </label>
                  {wantGst && (
                    <div className="space-y-3 pt-2 border-t border-[#262626]">
                      <Input label="GSTIN" value={gstin} onChange={e => setGstin(e.target.value.toUpperCase())} placeholder="22AAAAA0000A1Z5" />
                      <Input label="Business Name" value={businessName} onChange={e => setBusinessName(e.target.value)} />
                      <p className="text-xs text-[#525252]">GST invoice will be emailed after order is placed.</p>
                    </div>
                  )}
                </div>

                <Button onClick={handleContinue} className="w-full">
                  Continue to Review <ChevronRight className="w-4 h-4" />
                </Button>
              </>
            )}

            {step === "review" && summary && (
              <>
                {/* Address summary */}
                <div className="bg-[#161616] border border-[#262626] rounded-lg p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#F97316]" />
                      <span className="text-sm font-semibold text-[#F5F5F5]">Delivering to</span>
                    </div>
                    <button onClick={() => setStep("address")} className="text-xs text-[#F97316] hover:underline">Change</button>
                  </div>
                  {selectedAddress && (
                    <div className="text-sm text-[#A3A3A3]">
                      <p className="text-[#F5F5F5] font-medium">{selectedAddress.full_name}</p>
                      <p>{selectedAddress.line1}{selectedAddress.line2 ? `, ${selectedAddress.line2}` : ""}</p>
                      <p>{selectedAddress.city}, {selectedAddress.state} — {selectedAddress.pincode}</p>
                      <p>{selectedAddress.phone}</p>
                    </div>
                  )}
                </div>

                {/* Items */}
                <div className="bg-[#161616] border border-[#262626] rounded-lg p-5">
                  <h3 className="text-sm font-semibold text-[#F5F5F5] mb-4">Items ({itemCount})</h3>
                  <div className="space-y-3">
                    {items.map(item => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-[#1E1E1E] flex-shrink-0 overflow-hidden">
                          {item.product.images?.[0]
                            ? <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-[#525252] text-xs">{item.product.name[0]}</div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#F5F5F5] truncate">{item.product.name}</p>
                          <p className="text-xs text-[#525252]">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-mono text-[#F97316] font-semibold">₹{(item.product.price * item.quantity).toLocaleString("en-IN")}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment */}
                {summary.launchMode !== "live" ? (
                  <div className="bg-[#F97316]/10 border border-[#F97316]/30 rounded-lg p-5 text-center">
                    <p className="text-[#F97316] font-semibold mb-1">Almost there!</p>
                    <p className="text-sm text-[#A3A3A3]">We&apos;re in pre-launch mode. Payments will go live soon. Your cart is saved.</p>
                    <Button variant="secondary" className="mt-4 w-full" disabled>Coming Soon</Button>
                  </div>
                ) : (
                  <Button onClick={handlePlaceOrder} loading={placing} className="w-full" size="lg">
                    Pay ₹{summary.total.toLocaleString("en-IN")} with Razorpay
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Order summary sidebar */}
          {summary && (
            <div className="bg-[#161616] border border-[#262626] rounded-lg p-5 h-fit">
              <h3 className="text-sm font-semibold text-[#F5F5F5] mb-4 font-mono">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-[#A3A3A3]">
                  <span>Subtotal ({itemCount} items)</span>
                  <span>₹{summary.subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-[#A3A3A3]">
                  <span>Shipping</span>
                  <span className={summary.shipping === 0 ? "text-[#22C55E]" : ""}>
                    {summary.shipping === 0 ? "Free" : `₹${summary.shipping}`}
                  </span>
                </div>
                <div className="flex justify-between text-[#A3A3A3]">
                  <span>GST (18%)</span>
                  <span>₹{summary.gst.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between font-bold text-[#F5F5F5] pt-2 border-t border-[#262626]">
                  <span>Total</span>
                  <span className="text-[#F97316]">₹{summary.total.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
