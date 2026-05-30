"use client";

import { useState } from "react";
import { Mail, MessageCircle, MapPin, Clock, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ContactPage() {
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "91XXXXXXXXXX";
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSubmitting(true);
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setSuccess(true);
      setForm({ name: "", email: "", subject: "", message: "" });
    } else {
      const data = await res.json();
      setError(data.error || "Failed to send. Please try WhatsApp instead.");
    }
    setSubmitting(false);
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <p className="text-xs font-mono text-[#F97316] uppercase tracking-widest mb-3">Get in Touch</p>
          <h1 className="text-4xl font-mono font-bold text-[#F5F5F5] leading-tight">Contact Us</h1>
          <p className="text-[#A3A3A3] mt-4 max-w-lg">Have a question about a component, bulk pricing, or anything else? We&apos;re here to help.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact form */}
          <div className="bg-[#161616] border border-[#262626] rounded-lg p-6">
            <h2 className="text-sm font-semibold text-[#F5F5F5] mb-5">Send a Message</h2>
            {success ? (
              <div className="bg-[#22C55E15] border border-[#22C55E]/30 rounded-lg p-6 text-center">
                <p className="text-[#22C55E] font-semibold mb-1">Message sent!</p>
                <p className="text-sm text-[#A3A3A3]">We&apos;ll get back to you within 2–4 hours.</p>
                <button onClick={() => setSuccess(false)} className="mt-3 text-xs text-[#F97316] hover:underline">Send another</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-[#EF444415] border border-[#EF4444]/30 rounded-lg px-4 py-3 text-sm text-[#EF4444]">{error}</div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Your Name *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                  <Input label="Email *" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
                </div>
                <Input label="Subject *" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} required />
                <div>
                  <label className="block text-xs text-[#A3A3A3] mb-1.5 font-mono uppercase tracking-wider">Message *</label>
                  <textarea
                    value={form.message}
                    onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                    required rows={5}
                    placeholder="Tell us what you need..."
                    className="w-full bg-[#111111] border border-[#262626] rounded-lg px-3 py-2.5 text-sm text-[#F5F5F5] placeholder:text-[#525252] focus:outline-none focus:border-[#F97316] resize-y"
                  />
                </div>
                <Button type="submit" loading={submitting} className="w-full">
                  <Send className="w-4 h-4" /> Send Message
                </Button>
              </form>
            )}
          </div>

          {/* Info */}
          <div className="space-y-4">
            <a
              href={`https://wa.me/${whatsapp}?text=Hi Circuitkar, I have a query`}
              target="_blank" rel="noopener noreferrer"
              className="group flex items-start gap-4 bg-[#161616] border border-[#262626] rounded-lg p-5 hover:border-l-2 hover:border-l-[#F97316] transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-[#22C55E]/10 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-5 h-5 text-[#22C55E]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#F5F5F5] mb-0.5">WhatsApp — Fastest</h3>
                <p className="text-xs text-[#525252] mb-2">Usually respond within 2–4 hours</p>
                <span className="text-xs font-mono text-[#F97316] group-hover:underline">Chat now →</span>
              </div>
            </a>

            <a
              href="mailto:hello@circuitkar.in"
              className="group flex items-start gap-4 bg-[#161616] border border-[#262626] rounded-lg p-5 hover:border-l-2 hover:border-l-[#F97316] transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-[#F97316]/10 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-[#F97316]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#F5F5F5] mb-0.5">Email</h3>
                <p className="text-xs text-[#525252] mb-2">For orders, invoices & business queries</p>
                <span className="text-xs font-mono text-[#F97316] group-hover:underline">hello@circuitkar.in →</span>
              </div>
            </a>

            <div className="bg-[#161616] border border-[#262626] rounded-lg p-5 space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#525252] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-[#F5F5F5]">Silvassa, Dadra & Nagar Haveli</p>
                  <p className="text-xs text-[#525252]">Union Territory, India — 396230</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-[#525252] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-[#F5F5F5]">Mon – Sat, 10am – 7pm IST</p>
                  <p className="text-xs text-[#525252]">Closed on public holidays</p>
                </div>
              </div>
              <div className="pt-3 border-t border-[#262626]">
                <p className="text-xs text-[#525252]">GST Registered · Pan-India shipping · Bulk orders welcome</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
