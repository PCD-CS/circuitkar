"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronRight, MapPin, Plus, AlertCircle, Minus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useCart } from "@/lib/cart-context";
import { INDIAN_STATES } from "@/lib/indian-states";
import { isValidGSTIN } from "@/lib/validation";
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

/* ── Order Summary sidebar — shows on both steps ── */
function OrderSummary({
  summary,
  itemCount,
}: {
  summary: CheckoutSummary | null;
  itemCount: number;
}) {
  const { items, updateQty, removeItem } = useCart();

  return (
    <div className="bg-[#161616] border border-[#262626] rounded-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-[#262626]">
        <h3 className="text-sm font-semibold text-[#F5F5F5] font-mono">
          Order Summary ({itemCount})
        </h3>
      </div>

      {/* Product list */}
      <div className="divide-y divide-[#1A1A1A]">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 px-5 py-3">
            <div className="w-12 h-12 rounded bg-[#1E1E1E] flex-shrink-0 overflow-hidden border border-[#262626]">
              {item.product.images?.[0] ? (
                <Image
                  src={item.product.images[0]}
                  alt={item.product.name}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#525252] text-xs font-mono">
                  {item.product.name[0]}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#F5F5F5] leading-snug truncate">{item.product.name}</p>
              <p className="text-xs text-[#F97316] font-mono font-semibold mt-0.5">
                ₹{(item.product.price * item.quantity).toLocaleString("en-IN")}
              </p>
              {/* Qty controls */}
              <div className="flex items-center gap-1 mt-1.5">
                <button
                  onClick={() =>
                    item.quantity > 1
                      ? updateQty(item.id, item.quantity - 1)
                      : removeItem(item.id)
                  }
                  className="w-6 h-6 rounded border border-[#262626] flex items-center justify-center text-[#A3A3A3] hover:border-[#F97316] hover:text-[#F97316] transition-colors"
                >
                  {item.quantity === 1 ? <X className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                </button>
                <span className="w-6 text-center text-xs text-[#F5F5F5] font-mono">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQty(item.id, item.quantity + 1)}
                  disabled={item.product.in_stock && item.product.stock_count > 0 ? item.quantity >= item.product.stock_count : false}
                  className="w-6 h-6 rounded border border-[#262626] flex items-center justify-center text-[#A3A3A3] hover:border-[#F97316] hover:text-[#F97316] transition-colors disabled:opacity-40 disabled:pointer-events-none"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      {summary && (
        <div className="px-5 py-4 border-t border-[#262626] space-y-2 text-sm">
          <div className="flex justify-between text-[#A3A3A3]">
            <span>Subtotal</span>
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
            <span className="text-[#F97316] font-mono">
              ₹{summary.total.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
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

  // GST
  const [wantGst, setWantGst] = useState(false);
  const [gstin, setGstin] = useState("");
  const [gstinError, setGstinError] = useState("");
  const [businessName, setBusinessName] = useState("");

  // New address form
  const [newAddr, setNewAddr] = useState({
    label: "Home", full_name: "", phone: "", line1: "", line2: "",
    city: "", state: "", pincode: "", is_default: false,
  });
  const [pincodeLoading, setPincodeLoading] = useState(false);

  const refreshSummary = useCallback(async () => {
    const res = await fetch("/api/checkout", { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setSummary(data);
    }
  }, []);

  useEffect(() => {
    if (itemCount === 0) { router.push("/cart"); return; }
    Promise.all([
      fetch("/api/account/addresses").then(r => r.json()),
      fetch("/api/checkout", { method: "POST" }).then(r => r.json()),
      fetch("/api/account/profile").then(r => r.json()),
    ]).then(([addrData, checkoutData, profileData]) => {
      const addrs: CustomerAddress[] = addrData.addresses ?? [];
      setAddresses(addrs);
      const def = addrs.find(a => a.is_default);
      if (def) setSelectedAddressId(def.id);
      setSummary(checkoutData);
      // Prefill GST details from saved profile
      const profile = profileData.profile;
      if (profile?.gstin) {
        setGstin(profile.gstin);
        setWantGst(true);
      }
      if (profile?.business_name) setBusinessName(profile.business_name);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [itemCount, router]);

  // Refresh summary when cart changes
  useEffect(() => {
    if (!loading && itemCount > 0) refreshSummary();
  }, [items, loading, itemCount, refreshSummary]);

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

  function validateGstin(): boolean {
    if (!wantGst || !gstin) return true;
    if (!isValidGSTIN(gstin)) {
      setGstinError("Invalid GSTIN — must be 15 characters in format: 22AAAAA0000A1Z5");
      return false;
    }
    setGstinError("");
    return true;
  }

  async function saveNewAddress(): Promise<{ id: string; addr: CustomerAddress } | null> {
    const res = await fetch("/api/account/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newAddr),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Failed to save address."); return null; }
    return { id: data.address.id, addr: data.address };
  }

  async function saveGstToProfile() {
    if (!wantGst || !gstin || !isValidGSTIN(gstin)) return;
    try {
      await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gstin, business_name: businessName || null }),
      });
    } catch { /* best-effort */ }
  }

  async function handleContinue() {
    setError("");
    if (!validateGstin()) return;

    let addressId = selectedAddressId;
    let resolvedAddress: CustomerAddress | undefined = addresses.find(a => a.id === addressId);

    if (useNewAddress) {
      if (!newAddr.full_name || !newAddr.phone || !newAddr.line1 || !newAddr.city || !newAddr.state || !newAddr.pincode) {
        setError("Please fill all required address fields."); return;
      }
      const result = await saveNewAddress();
      if (!result) return;
      addressId = result.id;
      resolvedAddress = result.addr;
      // Add the new address to state so the review step can display it
      setAddresses(prev => [...prev, result.addr]);
    }

    if (!addressId) { setError("Please select or add a delivery address."); return; }
    setSelectedAddressId(addressId);
    // Save GST details to profile (best-effort, don't block)
    saveGstToProfile();
    setStep("review");
    window.scrollTo(0, 0);
  }

  async function handlePlaceOrder() {
    if (!summary) return;
    if (!validateGstin()) return;
    setError(""); setPlacing(true);
    try {
      if (summary.launchMode === "live") {
        const rzpRes = await fetch("/api/razorpay/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: summary.total, receipt: `order_${Date.now()}` }),
        });
        const rzpData = await rzpRes.json();
        if (!rzpRes.ok) {
          const msg = rzpData.error || "Payment setup failed.";
          // Give a more actionable error
          setError(
            msg.includes("not configured")
              ? "Razorpay keys are not configured. Go to Admin → Settings → Payments and save your test keys, then ensure 'Use Live Keys' matches your intent."
              : msg
          );
          setPlacing(false);
          return;
        }

        // Load Razorpay SDK
        if (!document.querySelector('script[src*="razorpay"]')) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Failed to load Razorpay"));
            document.body.appendChild(script);
          });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rzp = new (window as any).Razorpay({
          key: rzpData.keyId,
          amount: rzpData.amount,
          currency: "INR",
          order_id: rzpData.orderId,
          name: "Circuitkar",
          description: "Electronic Components",
          prefill: {
            name: addresses.find(a => a.id === selectedAddressId)?.full_name || "",
            contact: addresses.find(a => a.id === selectedAddressId)?.phone || "",
          },
          theme: { color: "#F97316" },
          handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
            const verifyRes = await fetch("/api/razorpay/verify", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });
            if (!verifyRes.ok) { setError("Payment verification failed. Contact support."); setPlacing(false); return; }
            await createOrder(response.razorpay_order_id, response.razorpay_payment_id, rzpData.keyId, summary);
          },
          modal: { ondismiss: () => setPlacing(false) },
        });
        rzp.open();
      } else {
        setError("Checkout is not yet live. Your cart is saved — we'll notify you when it opens.");
        setPlacing(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setPlacing(false);
    }
  }

  async function createOrder(rzpOrderId: string, rzpPaymentId: string, keyId: string, sum: CheckoutSummary) {
    const res = await fetch("/api/orders/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        addressId: selectedAddressId,
        gstin: wantGst && gstin ? gstin : undefined,
        businessName: wantGst && businessName ? businessName : undefined,
        razorpayOrderId: rzpOrderId,
        razorpayPaymentId: rzpPaymentId,
        isTestOrder: keyId.startsWith("rzp_test_"),
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
      <div className="max-w-5xl mx-auto">
        {/* Steps */}
        <div className="flex items-center gap-2 mb-8 text-sm">
          <button
            onClick={() => step === "review" && setStep("address")}
            className={step === "address" ? "text-[#F97316] font-semibold" : "text-[#A3A3A3] hover:text-[#F5F5F5]"}
          >
            1. Delivery Address
          </button>
          <ChevronRight className="w-4 h-4 text-[#525252]" />
          <span className={step === "review" ? "text-[#F97316] font-semibold" : "text-[#525252]"}>
            2. Review & Pay
          </span>
        </div>

        {error && (
          <div className="mb-6 bg-[#EF444415] border border-[#EF4444]/30 rounded-lg px-4 py-3 text-sm text-[#EF4444] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: steps content */}
          <div className="lg:col-span-3 space-y-4">
            {step === "address" && (
              <>
                {addresses.length === 0 && !useNewAddress && (
                  <div className="bg-[#161616] border border-[#262626] rounded-lg p-5 text-center">
                    <p className="text-sm text-[#A3A3A3]">No saved addresses. Add one below.</p>
                  </div>
                )}

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
                        selectedAddressId === addr.id && !useNewAddress
                          ? "border-[#F97316] bg-[#F97316]"
                          : "border-[#525252]"
                      }`} />
                      <div>
                        <p className="text-xs font-mono text-[#F97316] mb-1 uppercase">{addr.label}</p>
                        <p className="text-sm text-[#F5F5F5] font-medium">{addr.full_name}</p>
                        <p className="text-sm text-[#A3A3A3]">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
                        <p className="text-sm text-[#A3A3A3]">{addr.city}, {addr.state} — {addr.pincode}</p>
                        <p className="text-sm text-[#A3A3A3]">{addr.phone}</p>
                      </div>
                    </div>
                  </button>
                ))}

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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input label="Full Name *" value={newAddr.full_name} onChange={e => setNewAddr(p => ({ ...p, full_name: e.target.value }))} />
                      <Input label="Phone *" inputMode="numeric" value={newAddr.phone}
                        onChange={e => setNewAddr(p => ({ ...p, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))} placeholder="10-digit mobile" />
                    </div>
                    <Input label="Address Line 1 *" value={newAddr.line1} onChange={e => setNewAddr(p => ({ ...p, line1: e.target.value }))} placeholder="House/Flat no, Street" />
                    <Input label="Address Line 2" value={newAddr.line2} onChange={e => setNewAddr(p => ({ ...p, line2: e.target.value }))} placeholder="Landmark (optional)" />
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-[#A3A3A3] mb-1.5 font-mono uppercase tracking-wider">Pincode *</label>
                        <input value={newAddr.pincode}
                          onChange={e => setNewAddr(p => ({ ...p, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
                          onBlur={handlePincodeBlur} placeholder="400001"
                          className="w-full bg-[#111111] border border-[#262626] rounded-lg px-3 py-2.5 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#F97316]" />
                        {pincodeLoading && <p className="text-xs text-[#525252] mt-1">Looking up…</p>}
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
                    <div>
                      <label className="block text-xs text-[#A3A3A3] mb-1.5 font-mono uppercase tracking-wider">Label</label>
                      <div className="flex gap-2">
                        {["Home", "Work", "Other"].map(l => (
                          <button key={l} type="button" onClick={() => setNewAddr(p => ({ ...p, label: l }))}
                            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                              newAddr.label === l ? "border-[#F97316] text-[#F97316] bg-[#F9731615]" : "border-[#262626] text-[#A3A3A3]"
                            }`}>{l}</button>
                        ))}
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-[#A3A3A3] cursor-pointer">
                      <input type="checkbox" checked={newAddr.is_default} onChange={e => setNewAddr(p => ({ ...p, is_default: e.target.checked }))}
                        className="rounded accent-[#F97316]" />
                      Set as default address
                    </label>
                  </div>
                )}

                {/* GST */}
                <div className="bg-[#161616] border border-[#262626] rounded-lg p-5">
                  <label className="flex items-center gap-3 cursor-pointer mb-3">
                    <div className="relative">
                      <input type="checkbox" className="sr-only" checked={wantGst} onChange={e => { setWantGst(e.target.checked); setGstinError(""); }} />
                      <div className={`w-10 h-5 rounded-full transition-colors ${wantGst ? "bg-[#F97316]" : "bg-[#262626]"}`} />
                      <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${wantGst ? "translate-x-5" : "translate-x-0"}`} />
                    </div>
                    <span className="text-sm text-[#F5F5F5]">I want a GST invoice</span>
                  </label>
                  {wantGst && (
                    <div className="space-y-3 pt-3 border-t border-[#262626]">
                      <div>
                        <Input
                          label="GSTIN *"
                          value={gstin}
                          onChange={e => { setGstin(e.target.value.toUpperCase()); setGstinError(""); }}
                          onBlur={validateGstin}
                          placeholder="22AAAAA0000A1Z5"
                          maxLength={15}
                        />
                        {gstinError && <p className="text-xs text-[#EF4444] mt-1">{gstinError}</p>}
                        {gstin.length === 15 && !gstinError && isValidGSTIN(gstin) && (
                          <p className="text-xs text-[#22C55E] mt-1">✓ Valid GSTIN format</p>
                        )}
                      </div>
                      <Input label="Business Name *" value={businessName} onChange={e => setBusinessName(e.target.value)} />
                      <p className="text-xs text-[#525252]">GST invoice will be emailed after your order is confirmed.</p>
                    </div>
                  )}
                </div>

                <Button onClick={handleContinue} className="w-full" size="lg">
                  Continue to Review <ChevronRight className="w-4 h-4" />
                </Button>
              </>
            )}

            {step === "review" && summary && (
              <>
                {/* Delivering to */}
                <div className="bg-[#161616] border border-[#262626] rounded-lg p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#F97316]" />
                      <span className="text-sm font-semibold text-[#F5F5F5]">Delivering to</span>
                    </div>
                    <button onClick={() => setStep("address")} className="text-xs text-[#F97316] hover:underline">Change</button>
                  </div>
                  {selectedAddress ? (
                    <div className="text-sm text-[#A3A3A3] space-y-0.5">
                      <p className="text-[#F5F5F5] font-medium">{selectedAddress.full_name}</p>
                      <p>{selectedAddress.line1}{selectedAddress.line2 ? `, ${selectedAddress.line2}` : ""}</p>
                      <p>{selectedAddress.city}, {selectedAddress.state} — {selectedAddress.pincode}</p>
                      <p>{selectedAddress.phone}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-[#EF4444]">Address not found — please go back and reselect.</p>
                  )}
                </div>

                {/* GST details */}
                {wantGst && gstin && (
                  <div className="bg-[#161616] border border-[#262626] rounded-lg p-5">
                    <p className="text-xs font-mono text-[#525252] uppercase tracking-wider mb-2">GST Invoice Details</p>
                    <p className="text-sm text-[#F5F5F5]">{businessName}</p>
                    <p className="text-sm font-mono text-[#A3A3A3]">{gstin}</p>
                  </div>
                )}

                {/* Payment */}
                {summary.launchMode !== "live" ? (
                  <div className="bg-[#F97316]/10 border border-[#F97316]/30 rounded-lg p-5 text-center">
                    <p className="text-[#F97316] font-semibold mb-1">Almost there!</p>
                    <p className="text-sm text-[#A3A3A3]">We&apos;re in pre-launch mode. Your cart is saved — payments open soon.</p>
                    <Button variant="secondary" className="mt-4 w-full" disabled>Coming Soon</Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-[#161616] border border-[#262626] rounded-lg p-4 text-xs text-[#525252] flex items-center gap-2">
                      <span>🔒</span>
                      <span>Secure payment via Razorpay — UPI, Cards, Net Banking, Wallets accepted</span>
                    </div>
                    <Button onClick={handlePlaceOrder} loading={placing} className="w-full" size="lg">
                      Pay ₹{summary.total.toLocaleString("en-IN")} with Razorpay
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right: order summary — always visible */}
          <div className="lg:col-span-2">
            <OrderSummary summary={summary} itemCount={itemCount} />
          </div>
        </div>
      </div>
    </div>
  );
}
