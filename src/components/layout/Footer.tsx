import { MessageCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Logo } from "./Logo";

const LINKS = [
  { label: "Products", href: "/products" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Track Order", href: "/track-order" },
];

export function Footer({ whatsappNumber }: { whatsappNumber: string }) {
  return (
    <footer className="border-t border-[#262626] bg-[#0A0A0A]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-sm text-[#A3A3A3]">Components for Builders.</p>
            <div className="mt-5 flex items-center gap-3">
              <a
                href="https://instagram.com/circuitkar"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#262626] text-[#A3A3A3] transition-colors hover:border-[#F97316] hover:text-[#F97316] font-mono text-xs"
              >
                IG
              </a>
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#262626] text-[#A3A3A3] transition-colors hover:border-[#F97316] hover:text-[#F97316]"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#525252]">
              Explore
            </h4>
            <ul className="space-y-2.5">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-[#A3A3A3] transition-colors hover:text-[#F5F5F5]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="max-w-xs">
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#525252]">
              Payments
            </h4>
            <div className="inline-flex items-center gap-2 rounded-lg border border-[#262626] bg-[#161616] px-3 py-2">
              <ShieldCheck className="h-4 w-4 text-[#22C55E]" />
              <span className="font-display text-sm text-[#F5F5F5]">
                Secured by Razorpay
              </span>
            </div>
            <p className="mt-4 text-xs text-[#525252]">
              UPI, Cards, Net Banking & Wallets supported at launch.
            </p>
          </div>
        </div>

        <div className="mt-10 border-t border-[#262626] pt-6">
          <p className="text-xs text-[#525252]">
            © 2025 Circuitkar. GST Registered. Silvassa, India.
          </p>
        </div>
      </div>
    </footer>
  );
}
