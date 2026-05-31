import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Electronics Calculators & Tools",
  description: "Free online calculators for electronics engineers and makers — resistor color code, LED resistor, voltage divider, Ohm's law and more.",
  openGraph: {
    title: "Electronics Calculators | Circuitkar Tools",
    description: "Free online calculators for makers and electronics engineers.",
  },
};

const TOOLS = [
  {
    href: "/tools/resistor-color-code-calculator",
    icon: "🎨",
    title: "Resistor Color Code Calculator",
    description: "Decode 4-band and 5-band resistor color codes instantly. Get resistance value, tolerance, and multiplier.",
    tags: ["4-band", "5-band", "tolerance"],
  },
  {
    href: "/tools/led-resistor-calculator",
    icon: "💡",
    title: "LED Resistor Calculator",
    description: "Calculate the correct current-limiting resistor for your LED circuit. Supports multiple LEDs in series.",
    tags: ["current limiting", "series", "forward voltage"],
  },
  {
    href: "/tools/voltage-divider-calculator",
    icon: "⚡",
    title: "Voltage Divider Calculator",
    description: "Calculate output voltage, resistor values, or current for a resistive voltage divider circuit.",
    tags: ["R1", "R2", "Vout", "bias"],
  },
  {
    href: "/tools/ohms-law-calculator",
    icon: "🔢",
    title: "Ohm's Law Calculator",
    description: "Calculate voltage, current, resistance, and power — enter any two known values to solve the rest.",
    tags: ["V", "I", "R", "P", "watts"],
  },
];

export default function ToolsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Electronics Calculators | Circuitkar",
    description: "Free online electronics calculators for makers, students, and engineers.",
    url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://circuitkar.in"}/tools`,
    hasPart: TOOLS.map(t => ({
      "@type": "WebApplication",
      name: t.title,
      description: t.description,
      url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://circuitkar.in"}${t.href}`,
      applicationCategory: "UtilitiesApplication",
    })),
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm text-[#525252] mb-8">
          <Link href="/" className="hover:text-[#A3A3A3]">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-[#A3A3A3]">Tools</span>
        </nav>

        <div className="mb-10">
          <h1 className="text-3xl font-bold font-mono text-[#F5F5F5] mb-3">
            Electronics Calculators
          </h1>
          <p className="text-[#A3A3A3] max-w-xl">
            Free tools for makers, students, and engineers. Calculate resistor values, LED circuits, voltage dividers, and more — right in your browser.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TOOLS.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group bg-[#161616] border border-[#262626] rounded-xl p-6 hover:border-[#F97316]/50 hover:bg-[#1A1A1A] transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl flex-shrink-0">{tool.icon}</div>
                <div className="min-w-0">
                  <h2 className="font-semibold text-[#F5F5F5] group-hover:text-[#F97316] transition-colors leading-snug mb-2">
                    {tool.title}
                  </h2>
                  <p className="text-sm text-[#A3A3A3] leading-relaxed mb-3">
                    {tool.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {tool.tags.map(tag => (
                      <span key={tag} className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#262626] text-[#525252]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 bg-[#161616] border border-[#F97316]/20 rounded-xl p-6 text-center">
          <p className="text-sm text-[#A3A3A3] mb-3">Need components for your project?</p>
          <Link href="/products" className="inline-flex items-center gap-2 bg-[#F97316] text-white rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-[#EA6C0A] transition-colors">
            Browse Components
          </Link>
        </div>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
