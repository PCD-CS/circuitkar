"use client";

import { MessageCircle } from "lucide-react";

interface MaintenanceOverlayProps {
  mode: string;
  message: string;
  whatsappNumber?: string;
  children: React.ReactNode;
}

export function MaintenanceOverlay({
  mode,
  message,
  whatsappNumber,
  children,
}: MaintenanceOverlayProps) {
  if (mode !== "maintenance") {
    return <>{children}</>;
  }

  const waHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        "Hi Circuitkar, when will the site be back?",
      )}`
    : null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#0A0A0A] px-6 text-center">
      <div className="mb-8 font-mono text-2xl font-bold tracking-tight">
        <span className="text-[#F5F5F5]">CIRCUIT</span>
        <span className="text-[#F97316]">KAR</span>
      </div>

      <h1 className="text-2xl font-bold text-[#F5F5F5] sm:text-3xl">
        Under Maintenance
      </h1>

      <p className="mt-4 max-w-md text-sm leading-relaxed text-[#A3A3A3]">
        {message || "We'll be back shortly. Thanks for your patience."}
      </p>

      {waHref && (
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#22C55E] px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-95"
        >
          <MessageCircle className="h-4 w-4" />
          Contact us on WhatsApp
        </a>
      )}

      <div className="absolute bottom-6 left-0 right-0 text-xs text-[#525252]">
        circuitkar.in
      </div>
    </div>
  );
}
