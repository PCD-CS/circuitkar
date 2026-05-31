import type { Metadata } from "next";
import { ResistorColorCodeCalculator } from "./ResistorColorCodeCalculator";

export const metadata: Metadata = {
  title: "Resistor Color Code Calculator — 4 & 5 Band",
  description: "Decode resistor color bands instantly. Supports 4-band and 5-band resistors. Get resistance value, tolerance, and multiplier — free online tool.",
  openGraph: { title: "Resistor Color Code Calculator | Circuitkar", description: "Decode 4-band and 5-band resistor color codes." },
};

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Resistor Color Code Calculator",
    description: "Decode 4-band and 5-band resistor color codes. Get resistance value, tolerance, and multiplier.",
    applicationCategory: "UtilitiesApplication",
    url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://circuitkar.in"}/tools/resistor-color-code-calculator`,
    offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
  };

  return (
    <>
      <ResistorColorCodeCalculator />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
