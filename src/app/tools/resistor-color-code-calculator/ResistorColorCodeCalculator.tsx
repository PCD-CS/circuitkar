"use client";

import { useState, useMemo } from "react";
import { CalculatorLayout } from "@/components/tools/CalculatorLayout";
import { CopyButton } from "@/components/tools/CopyButton";

const COLORS = [
  { name: "Black",  digit: 0, multiplier: 1,         tolerance: null,   hex: "#1a1a1a", textColor: "#fff" },
  { name: "Brown",  digit: 1, multiplier: 10,         tolerance: "±1%",  hex: "#6b3a2a", textColor: "#fff" },
  { name: "Red",    digit: 2, multiplier: 100,        tolerance: "±2%",  hex: "#dc2626", textColor: "#fff" },
  { name: "Orange", digit: 3, multiplier: 1_000,      tolerance: null,   hex: "#ea580c", textColor: "#fff" },
  { name: "Yellow", digit: 4, multiplier: 10_000,     tolerance: null,   hex: "#ca8a04", textColor: "#000" },
  { name: "Green",  digit: 5, multiplier: 100_000,    tolerance: "±0.5%",hex: "#16a34a", textColor: "#fff" },
  { name: "Blue",   digit: 6, multiplier: 1_000_000,  tolerance: "±0.25%",hex: "#2563eb", textColor: "#fff" },
  { name: "Violet", digit: 7, multiplier: 10_000_000, tolerance: "±0.1%",hex: "#7c3aed", textColor: "#fff" },
  { name: "Grey",   digit: 8, multiplier: 100_000_000,tolerance: "±0.05%",hex: "#6b7280", textColor: "#fff" },
  { name: "White",  digit: 9, multiplier: 1_000_000_000,tolerance: null, hex: "#f9fafb", textColor: "#000" },
  { name: "Gold",   digit: null, multiplier: 0.1,     tolerance: "±5%",  hex: "#b45309", textColor: "#fff" },
  { name: "Silver", digit: null, multiplier: 0.01,    tolerance: "±10%", hex: "#9ca3af", textColor: "#000" },
];

function formatResistance(ohms: number): string {
  if (ohms >= 1_000_000) return `${(ohms / 1_000_000).toPrecision(3).replace(/\.?0+$/, "")} MΩ`;
  if (ohms >= 1_000) return `${(ohms / 1_000).toPrecision(3).replace(/\.?0+$/, "")} kΩ`;
  return `${ohms.toPrecision(3).replace(/\.?0+$/, "")} Ω`;
}

function BandSelect({ label, value, onChange, includeGoldSilver = false, includeTolerance = false }:
  { label: string; value: string; onChange: (v: string) => void; includeGoldSilver?: boolean; includeTolerance?: boolean }) {
  const options = COLORS.filter(c => {
    if (includeTolerance) return c.tolerance !== null;
    if (!includeGoldSilver) return c.digit !== null;
    return true;
  });

  return (
    <div className="space-y-1.5">
      <label className="block text-xs text-[#A3A3A3] font-mono uppercase tracking-wider">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full appearance-none rounded-lg border border-[#262626] bg-[#111111] px-3 py-2.5 pr-8 text-sm text-[#F5F5F5] focus:border-[#F97316] focus:outline-none"
          style={{ borderLeft: `4px solid ${COLORS.find(c => c.name === value)?.hex ?? "#262626"}` }}
        >
          {options.map(c => <option key={c.name} value={c.name}>{c.name} ({c.digit ?? "—"})</option>)}
        </select>
        <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded"
          style={{ background: COLORS.find(c => c.name === value)?.hex }} />
      </div>
    </div>
  );
}

export function ResistorColorCodeCalculator() {
  const [bands, setBands] = useState(4);
  const [b1, setB1] = useState("Brown");
  const [b2, setB2] = useState("Black");
  const [b3, setB3] = useState("Red");  // digit 3 in 5-band, multiplier in 4-band
  const [b4, setB4] = useState("Gold"); // tolerance in 4-band, multiplier in 5-band
  const [b5, setB5] = useState("Gold"); // tolerance in 5-band

  const result = useMemo(() => {
    const c = (name: string) => COLORS.find(c => c.name === name)!;
    try {
      if (bands === 4) {
        const ohms = (c(b1).digit! * 10 + c(b2).digit!) * c(b3).multiplier!;
        return { ohms, tolerance: c(b4).tolerance ?? "—" };
      } else {
        const ohms = (c(b1).digit! * 100 + c(b2).digit! * 10 + c(b3).digit!) * c(b4).multiplier!;
        return { ohms, tolerance: c(b5).tolerance ?? "—" };
      }
    } catch { return null; }
  }, [bands, b1, b2, b3, b4, b5]);

  const resultText = result
    ? `${formatResistance(result.ohms)} ${result.tolerance}`
    : "";

  return (
    <CalculatorLayout
      title="Resistor Color Code Calculator"
      description="Select the color bands on your resistor to decode its resistance value and tolerance."
      icon="🎨"
    >
      {/* Band count toggle */}
      <div className="flex gap-2 mb-6">
        {[4, 5].map(n => (
          <button key={n} type="button" onClick={() => setBands(n)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${bands === n ? "bg-[#F97316] border-[#F97316] text-white" : "border-[#262626] text-[#A3A3A3] hover:border-[#525252]"}`}>
            {n}-Band
          </button>
        ))}
      </div>

      {/* Visual resistor */}
      <div className="flex items-center justify-center gap-0 mb-6">
        <div className="h-0.5 w-8 bg-[#525252]" />
        <div className="h-8 w-20 rounded bg-[#b45309] flex items-center justify-center gap-1 px-1.5">
          {[b1, b2, ...(bands === 5 ? [b3] : []), bands === 4 ? b3 : b4, bands === 4 ? b4 : b5].map((b, i) => (
            <div key={i} className="h-6 w-2.5 rounded-sm" style={{ background: COLORS.find(c => c.name === b)?.hex }} />
          ))}
        </div>
        <div className="h-0.5 w-8 bg-[#525252]" />
      </div>

      {/* Band selectors */}
      <div className={`grid gap-3 mb-6 ${bands === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-5"}`}>
        <BandSelect label="Band 1" value={b1} onChange={setB1} />
        <BandSelect label="Band 2" value={b2} onChange={setB2} />
        {bands === 5 && <BandSelect label="Band 3" value={b3} onChange={setB3} />}
        <BandSelect label={bands === 4 ? "Multiplier" : "Multiplier"} value={bands === 4 ? b3 : b4} onChange={bands === 4 ? setB3 : setB4} includeGoldSilver />
        <BandSelect label="Tolerance" value={bands === 4 ? b4 : b5} onChange={bands === 4 ? setB4 : setB5} includeTolerance />
      </div>

      {/* Result */}
      {result && (
        <div className="bg-[#0A0A0A] border border-[#262626] rounded-lg p-5">
          <p className="text-xs text-[#525252] font-mono uppercase tracking-wider mb-3">Result</p>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-3xl font-bold font-mono text-[#F97316]">{formatResistance(result.ohms)}</p>
              <p className="text-sm text-[#A3A3A3] mt-1">Tolerance: <span className="text-[#F5F5F5]">{result.tolerance}</span></p>
              <p className="text-xs text-[#525252] mt-0.5">{result.ohms.toLocaleString("en-IN")} Ω exact</p>
            </div>
            <CopyButton value={resultText} />
          </div>
        </div>
      )}
    </CalculatorLayout>
  );
}
