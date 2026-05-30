import { Metadata } from "next";
import { Mail, MessageCircle, MapPin, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with Circuitkar — electronic components store based in Silvassa, India.",
};

export default function ContactPage() {
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "91XXXXXXXXXX";

  return (
    <div className="min-h-screen bg-[#0A0A0A] py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-12">
          <p className="text-xs font-mono text-[#F97316] uppercase tracking-widest mb-3">
            Get in Touch
          </p>
          <h1 className="text-4xl font-mono font-bold text-[#F5F5F5] leading-tight">
            Contact Us
          </h1>
          <p className="text-[#A3A3A3] mt-4 max-w-lg">
            Have a question about a component? Need bulk pricing? We&apos;re here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <a
            href={`https://wa.me/${whatsapp}?text=Hi Circuitkar, I have a query`}
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-[#161616] border border-[#262626] rounded-lg p-6 hover:border-l-2 hover:border-l-[#F97316] transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-[#22C55E]/10 flex items-center justify-center mb-4">
              <MessageCircle className="w-5 h-5 text-[#22C55E]" />
            </div>
            <h2 className="text-sm font-semibold text-[#F5F5F5] mb-1">WhatsApp</h2>
            <p className="text-xs text-[#525252] mb-3">Fastest response — usually within hours</p>
            <span className="text-xs font-mono text-[#F97316] group-hover:underline">
              Chat on WhatsApp →
            </span>
          </a>

          <a
            href="mailto:hello@circuitkar.in"
            className="group bg-[#161616] border border-[#262626] rounded-lg p-6 hover:border-l-2 hover:border-l-[#F97316] transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-[#F97316]/10 flex items-center justify-center mb-4">
              <Mail className="w-5 h-5 text-[#F97316]" />
            </div>
            <h2 className="text-sm font-semibold text-[#F5F5F5] mb-1">Email</h2>
            <p className="text-xs text-[#525252] mb-3">For orders, invoices & business queries</p>
            <span className="text-xs font-mono text-[#F97316] group-hover:underline">
              hello@circuitkar.in →
            </span>
          </a>
        </div>

        <div className="bg-[#161616] border border-[#262626] rounded-lg p-6 space-y-5">
          <h2 className="text-sm font-semibold text-[#F5F5F5] font-mono uppercase tracking-wider">
            Info
          </h2>
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-[#525252] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-[#F5F5F5]">Silvassa, Dadra & Nagar Haveli</p>
              <p className="text-xs text-[#525252]">Union Territory, India</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="w-4 h-4 text-[#525252] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-[#F5F5F5]">Mon – Sat, 10am – 7pm IST</p>
              <p className="text-xs text-[#525252]">Closed on public holidays</p>
            </div>
          </div>
          <div className="pt-4 border-t border-[#262626]">
            <p className="text-xs text-[#525252]">
              GST Registered · Pan-India shipping · Bulk orders welcome
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
