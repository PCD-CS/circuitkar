"use client";

import { useState, useMemo } from "react";
import { CalculatorLayout } from "@/components/tools/CalculatorLayout";
import { CopyButton } from "@/components/tools/CopyButton";

type Mode = "vout" | "r2" | "r1";

function Field({ label, unit, value, onChange, readOnly, highlight }:
  { label: string; unit: string; value: string; onChange?: (v: string) => void; readOnly?: boolean; highlight?: boolean }) {
  return (
    <div>
      <label className="block text-xs text-[#A3A3A3] font-mono uppercase tracking-wider mb-1.5">{label}</label>
      <div className="flex">
        <input
          type="number"
          value={value}
          readOnly={readOnly}
          onChange={e => onChange?.(e.target.value)}
          className={`flex-1 rounded-l-lg border px-3 py-2.5 text-sm focus:outline-none ${
            highlight
              ? "border-[#F97316] bg-[#F97316]/5 text-[#F97316] font-mono font-bold"
              : "border-[#262626] bg-[#111111] text-[#F5F5F5] focus:border-[#F97316]"
          } ${readOnly ? "cursor-default" : ""}`}
        />
        <span className="rounded-r-lg border border-l-0 border-[#262626] bg-[#1E1E1E] px-3 py-2.5 text-sm text-[#525252]">{unit}</span>
      </div>
    </div>
  );
}

export function VoltageDividerCalculator() {
  const [mode, setMode] = useState<Mode>("vout");
  const [vin, setVin] = useState("5");
  const [r1, setR1] = useState("10000");
  const [r2, setR2] = useState("10000");
  const [vout, setVout] = useState("2.5");

  const result = useMemo(() => {
    const vinN = parseFloat(vin), r1N = parseFloat(r1), r2N = parseFloat(r2), voutN = parseFloat(vout);

    if (mode === "vout") {
      if (!vinN || !r1N || !r2N) return null;
      const out = vinN * r2N / (r1N + r2N);
      const i = vinN / (r1N + r2N);
      return { vout: out, vin: vinN, r1: r1N, r2: r2N, current: i * 1000, power: vinN * i * 1000 };
    }
    if (mode === "r2") {
      if (!vinN || !r1N || !voutN || voutN >= vinN) return null;
      const r2Calc = r1N * voutN / (vinN - voutN);
      const i = vinN / (r1N + r2Calc);
      return { vout: voutN, vin: vinN, r1: r1N, r2: r2Calc, current: i * 1000, power: vinN * i * 1000 };
    }
    if (mode === "r1") {
      if (!vinN || !r2N || !voutN || voutN >= vinN) return null;
      const r1Calc = r2N * (vinN - voutN) / voutN;
      const i = vinN / (r1Calc + r2N);
      return { vout: voutN, vin: vinN, r1: r1Calc, r2: r2N, current: i * 1000, power: vinN * i * 1000 };
    }
    return null;
  }, [mode, vin, r1, r2, vout]);

  function fmtR(ohms: number) {
    if (ohms >= 1e6) return `${(ohms/1e6).toFixed(2).replace(/\.?0+$/,"")} MΩ`;
    if (ohms >= 1000) return `${(ohms/1000).toFixed(2).replace(/\.?0+$/,"")} kΩ`;
    return `${ohms.toFixed(1)} Ω`;
  }

  const copyText = result
    ? `Vout = ${result.vout.toFixed(3)}V, R1 = ${fmtR(result.r1)}, R2 = ${fmtR(result.r2)}, I = ${result.current.toFixed(3)}mA`
    : "";

  const modes: { key: Mode; label: string }[] = [
    { key: "vout", label: "Solve for Vout" },
    { key: "r2", label: "Solve for R2" },
    { key: "r1", label: "Solve for R1" },
  ];

  return (
    <CalculatorLayout
      title="Voltage Divider Calculator"
      description="Vout = Vin × R2 / (R1 + R2) — calculate any unknown in the voltage divider formula."
      icon="⚡"
    >
      {/* Mode tabs */}
      <div className="flex gap-2 mb-6">
        {modes.map(m => (
          <button key={m.key} type="button" onClick={() => setMode(m.key)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${mode === m.key ? "bg-[#F97316] border-[#F97316] text-white" : "border-[#262626] text-[#A3A3A3] hover:border-[#525252]"}`}>
            {m.label}
          </button>
        ))}
      </div>

      {/* Circuit SVG */}
      <div className="flex justify-center mb-6">
        <svg width="180" height="120" viewBox="0 0 180 120" className="text-[#525252]">
          <line x1="90" y1="5" x2="90" y2="25" stroke="#525252" strokeWidth="1.5"/>
          <text x="100" y="18" fill="#F97316" fontSize="11" fontFamily="monospace">Vin</text>
          <rect x="70" y="25" width="40" height="30" rx="3" fill="none" stroke="#6b7280" strokeWidth="1.5"/>
          <text x="90" y="44" fill="#A3A3A3" fontSize="10" textAnchor="middle" fontFamily="monospace">R1</text>
          <line x1="90" y1="55" x2="90" y2="75" stroke="#525252" strokeWidth="1.5"/>
          <text x="148" y="70" fill="#22C55E" fontSize="10" fontFamily="monospace">Vout</text>
          <line x1="90" y1="65" x2="145" y2="65" stroke="#22C55E" strokeWidth="1" strokeDasharray="3,2"/>
          <rect x="70" y="75" width="40" height="30" rx="3" fill="none" stroke="#6b7280" strokeWidth="1.5"/>
          <text x="90" y="94" fill="#A3A3A3" fontSize="10" textAnchor="middle" fontFamily="monospace">R2</text>
          <line x1="90" y1="105" x2="90" y2="115" stroke="#525252" strokeWidth="1.5"/>
          <line x1="75" y1="115" x2="105" y2="115" stroke="#525252" strokeWidth="2"/>
          <text x="90" y="115" fill="#525252" fontSize="10" textAnchor="middle">⏚</text>
        </svg>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Field label="Input Voltage (Vin)" unit="V" value={vin} onChange={setVin} />
        <Field label="R1" unit="Ω" value={mode === "r1" ? (result ? result.r1.toFixed(1) : "") : r1}
          onChange={mode === "r1" ? undefined : setR1} readOnly={mode === "r1"} highlight={mode === "r1"} />
        <Field label="R2" unit="Ω" value={mode === "r2" ? (result ? result.r2.toFixed(1) : "") : r2}
          onChange={mode === "r2" ? undefined : setR2} readOnly={mode === "r2"} highlight={mode === "r2"} />
        <Field label="Output Voltage (Vout)" unit="V" value={mode === "vout" ? (result ? result.vout.toFixed(4) : "") : vout}
          onChange={mode === "vout" ? undefined : setVout} readOnly={mode === "vout"} highlight={mode === "vout"} />
      </div>

      {result && (
        <div className="bg-[#0A0A0A] border border-[#262626] rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#525252] font-mono uppercase tracking-wider">Results</p>
            <CopyButton value={copyText} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              ["Vout", `${result.vout.toFixed(3)} V`],
              ["R1", fmtR(result.r1)],
              ["R2", fmtR(result.r2)],
              ["Current", `${result.current.toFixed(3)} mA`],
              ["Power (R1+R2)", `${result.power.toFixed(1)} mW`],
              ["Ratio Vout/Vin", `${(result.vout/result.vin*100).toFixed(1)}%`],
            ].map(([k,v]) => (
              <div key={k}>
                <p className="text-xs text-[#525252]">{k}</p>
                <p className="text-sm font-mono text-[#F5F5F5]">{v}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {mode !== "vout" && result === null && (parseFloat(vout) >= parseFloat(vin)) && (
        <p className="text-sm text-[#EF4444]">Vout must be less than Vin.</p>
      )}
    </CalculatorLayout>
  );
}
