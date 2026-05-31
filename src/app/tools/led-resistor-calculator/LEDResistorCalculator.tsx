"use client";

import { useState, useMemo } from "react";
import { CalculatorLayout } from "@/components/tools/CalculatorLayout";
import { CopyButton } from "@/components/tools/CopyButton";

const LED_PRESETS = [
  { label: "Red (2.0V)",    vf: 2.0 },
  { label: "Yellow (2.1V)", vf: 2.1 },
  { label: "Green (2.2V)",  vf: 2.2 },
  { label: "Blue (3.2V)",   vf: 3.2 },
  { label: "White (3.3V)",  vf: 3.3 },
  { label: "IR (1.2V)",     vf: 1.2 },
];

function nearestE12(r: number): number {
  const e12 = [1.0,1.2,1.5,1.8,2.2,2.7,3.3,3.9,4.7,5.6,6.8,8.2];
  let best = Infinity, bestVal = r;
  const powers = [-1,0,1,2,3,4,5];
  for (const p of powers) {
    for (const base of e12) {
      const v = base * Math.pow(10, p);
      if (Math.abs(v - r) < Math.abs(best - r)) { best = v; bestVal = v; }
    }
  }
  return bestVal;
}

function fmtR(ohms: number) {
  if (ohms >= 1000) return `${(ohms/1000).toFixed(1).replace(/\.0$/,"")} kΩ`;
  return `${Math.round(ohms)} Ω`;
}

function FieldRow({ label, unit, value, onChange, hint }: { label: string; unit: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <div>
      <label className="block text-xs text-[#A3A3A3] font-mono uppercase tracking-wider mb-1.5">{label}</label>
      <div className="flex">
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 rounded-l-lg border border-[#262626] bg-[#111111] px-3 py-2.5 text-sm text-[#F5F5F5] focus:border-[#F97316] focus:outline-none"
        />
        <span className="rounded-r-lg border border-l-0 border-[#262626] bg-[#1E1E1E] px-3 py-2.5 text-sm text-[#525252] whitespace-nowrap">{unit}</span>
      </div>
      {hint && <p className="text-xs text-[#525252] mt-1">{hint}</p>}
    </div>
  );
}

export function LEDResistorCalculator() {
  const [vs, setVs] = useState("5");
  const [vf, setVf] = useState("2.0");
  const [current, setCurrent] = useState("20");
  const [leds, setLeds] = useState("1");

  const result = useMemo(() => {
    const vsN = parseFloat(vs), vfN = parseFloat(vf), iN = parseFloat(current) / 1000, ledsN = parseInt(leds) || 1;
    if (!vsN || !vfN || !iN || iN <= 0) return null;
    const totalVf = vfN * ledsN;
    if (vsN <= totalVf) return { error: `Supply voltage (${vsN}V) must be greater than total LED voltage (${totalVf}V)` };
    const exact = (vsN - totalVf) / iN;
    const standard = nearestE12(exact);
    const actualCurrent = (vsN - totalVf) / standard * 1000;
    const power = (vsN - totalVf) * (vsN - totalVf) / standard;
    return { exact, standard, actualCurrent, power, totalVf };
  }, [vs, vf, current, leds]);

  const copyText = result && !("error" in result)
    ? `${fmtR(result.standard)} resistor (exact: ${result.exact.toFixed(1)}Ω, ${result.actualCurrent.toFixed(1)}mA actual)`
    : "";

  return (
    <CalculatorLayout
      title="LED Resistor Calculator"
      description="Find the correct current-limiting resistor to protect your LED."
      icon="💡"
    >
      {/* LED preset */}
      <div className="mb-5">
        <label className="block text-xs text-[#A3A3A3] font-mono uppercase tracking-wider mb-1.5">LED Type (preset Vf)</label>
        <div className="flex flex-wrap gap-2">
          {LED_PRESETS.map(p => (
            <button key={p.label} type="button" onClick={() => setVf(String(p.vf))}
              className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${parseFloat(vf) === p.vf ? "bg-[#F97316]/15 border-[#F97316] text-[#F97316]" : "border-[#262626] text-[#A3A3A3] hover:border-[#525252]"}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <FieldRow label="Supply Voltage (Vs)" unit="V" value={vs} onChange={setVs} hint="e.g. 3.3, 5, 9, 12" />
        <FieldRow label="LED Forward Voltage (Vf)" unit="V" value={vf} onChange={setVf} hint="Typical: Red 2V, Blue/White 3.2V" />
        <FieldRow label="LED Current" unit="mA" value={current} onChange={setCurrent} hint="Typical: 10–20 mA" />
        <FieldRow label="LEDs in Series" unit="pcs" value={leds} onChange={setLeds} hint="All share same current" />
      </div>

      {result && (
        "error" in result ? (
          <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-lg px-4 py-3 text-sm text-[#EF4444]">{result.error}</div>
        ) : (
          <div className="bg-[#0A0A0A] border border-[#262626] rounded-lg p-5 space-y-4">
            <p className="text-xs text-[#525252] font-mono uppercase tracking-wider">Result</p>

            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <p className="text-3xl font-bold font-mono text-[#F97316]">{fmtR(result.standard)}</p>
                <p className="text-xs text-[#525252] mt-0.5">Nearest E12 standard value</p>
              </div>
              <CopyButton value={copyText} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-[#262626]">
              {[
                ["Exact value", `${result.exact.toFixed(1)} Ω`],
                ["Actual current", `${result.actualCurrent.toFixed(1)} mA`],
                ["Power dissipated", `${(result.power * 1000).toFixed(0)} mW`],
                ["Total LED Vf", `${result.totalVf}V`],
                ["Resistor ≥", `${result.power > 0.25 ? "0.5W" : "0.25W (1/4W)"}`],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-xs text-[#525252]">{k}</p>
                  <p className="text-sm font-mono text-[#F5F5F5]">{v}</p>
                </div>
              ))}
            </div>

            {/* Circuit diagram text */}
            <div className="bg-[#111111] rounded-lg p-3 font-mono text-xs text-[#525252] whitespace-pre">
              {`+${vs}V ─── [${fmtR(result.standard)}] ─── [LED${parseInt(leds) > 1 ? ` ×${leds}` : ""}] ─── GND`}
            </div>
          </div>
        )
      )}
    </CalculatorLayout>
  );
}
