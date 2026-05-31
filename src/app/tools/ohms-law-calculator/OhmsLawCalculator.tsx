"use client";

import { useState, useMemo } from "react";
import { CalculatorLayout } from "@/components/tools/CalculatorLayout";
import { CopyButton } from "@/components/tools/CopyButton";

type Solve = "V" | "I" | "R" | "P";

interface Values { V: string; I: string; R: string; P: string; }

const UNITS: Record<Solve, string> = { V: "V", I: "mA", R: "Ω", P: "mW" };
const LABELS: Record<Solve, string> = { V: "Voltage (V)", I: "Current (I)", R: "Resistance (R)", P: "Power (P)" };
const COLORS_MAP: Record<Solve, string> = { V: "#F97316", I: "#3B82F6", R: "#22C55E", P: "#8B5CF6" };

function fmtV(v: number) { return `${v.toFixed(4).replace(/\.?0+$/,"")} V`; }
function fmtI(i: number) { return `${(i*1000).toFixed(4).replace(/\.?0+$/,"")} mA`; }
function fmtR(r: number) {
  if (r >= 1e6) return `${(r/1e6).toFixed(3).replace(/\.?0+$/,"")} MΩ`;
  if (r >= 1000) return `${(r/1000).toFixed(3).replace(/\.?0+$/,"")} kΩ`;
  return `${r.toFixed(3).replace(/\.?0+$/,"")} Ω`;
}
function fmtP(p: number) {
  if (p >= 1000) return `${(p/1000).toFixed(3).replace(/\.?0+$/,"")} W`;
  return `${p.toFixed(4).replace(/\.?0+$/,"")} mW`;
}

export function OhmsLawCalculator() {
  const [solve, setSolve] = useState<Solve>("V");
  const [vals, setVals] = useState<Values>({ V: "", I: "", R: "", P: "" });

  const inputs: Solve[] = ["V", "I", "R", "P"];

  function setVal(key: Solve, v: string) {
    setVals(p => ({ ...p, [key]: v }));
  }

  const result = useMemo(() => {
    const n = (k: Solve) => parseFloat(vals[k]) || 0;
    const mA = (k: "I") => n(k) / 1000; // convert mA input to A

    try {
      if (solve === "V") {
        const I = mA("I"), R = n("R"), P = n("P");
        if (I && R) return { V: I * R, I, R, P: I * I * R * 1000 };
        if (P && I) return { V: P/1000 / I, I, R: (P/1000) / (I*I), P: n("P") };
        if (P && R) { const v = Math.sqrt((P/1000) * R); return { V: v, I: v/R, R, P: n("P") }; }
      }
      if (solve === "I") {
        const V = n("V"), R = n("R"), P = n("P");
        if (V && R) return { V, I: V/R, R, P: V*V/R*1000 };
        if (V && P) return { V, I: (P/1000)/V, R: V*V/(P/1000), P };
        if (P && R) { const i = Math.sqrt((P/1000)/R); return { V: i*R, I: i, R, P }; }
      }
      if (solve === "R") {
        const V = n("V"), I = mA("I"), P = n("P");
        if (V && I) return { V, I, R: V/I, P: V*I*1000 };
        if (V && P) return { V, I: (P/1000)/V, R: V*V/(P/1000), P };
        if (P && I) return { V: (P/1000)/I, I, R: (P/1000)/(I*I), P };
      }
      if (solve === "P") {
        const V = n("V"), I = mA("I"), R = n("R");
        if (V && I) return { V, I, R: V/I, P: V*I*1000 };
        if (V && R) return { V, I: V/R, R, P: V*V/R*1000 };
        if (I && R) return { V: I*R, I, R, P: I*I*R*1000 };
      }
    } catch { /* ignore */ }
    return null;
  }, [solve, vals]);

  const copyText = result
    ? `V=${fmtV(result.V)}, I=${fmtI(result.I)}, R=${fmtR(result.R)}, P=${fmtP(result.P)}`
    : "";

  const knowns = inputs.filter(k => k !== solve);

  return (
    <CalculatorLayout
      title="Ohm's Law Calculator"
      description="V = I × R — enter any two values to calculate the rest, including power (P = V × I)."
      icon="🔢"
    >
      {/* Solve-for tabs */}
      <div className="mb-5">
        <p className="text-xs text-[#525252] font-mono uppercase tracking-wider mb-2">Solve for</p>
        <div className="flex gap-2">
          {inputs.map(k => (
            <button key={k} type="button" onClick={() => { setSolve(k); setVals({ V: "", I: "", R: "", P: "" }); }}
              className="flex-1 py-2 rounded-lg text-sm font-bold border transition-colors"
              style={solve === k
                ? { background: COLORS_MAP[k] + "20", borderColor: COLORS_MAP[k], color: COLORS_MAP[k] }
                : { background: "transparent", borderColor: "#262626", color: "#A3A3A3" }
              }>
              {k}
            </button>
          ))}
        </div>
        <p className="text-xs text-[#525252] mt-2">
          Formula: V = IR · P = VI · P = I²R · P = V²/R
        </p>
      </div>

      {/* Formula highlight */}
      <div className="bg-[#0A0A0A] rounded-lg p-3 font-mono text-sm text-center mb-6 border border-[#262626]">
        {solve === "V" && <span>V = <span className="text-[#3B82F6]">I</span> × <span className="text-[#22C55E]">R</span></span>}
        {solve === "I" && <span>I = <span className="text-[#F97316]">V</span> / <span className="text-[#22C55E]">R</span></span>}
        {solve === "R" && <span>R = <span className="text-[#F97316]">V</span> / <span className="text-[#3B82F6]">I</span></span>}
        {solve === "P" && <span>P = <span className="text-[#F97316]">V</span> × <span className="text-[#3B82F6]">I</span></span>}
      </div>

      {/* Input fields — any 2 of the 3 knowns */}
      <p className="text-xs text-[#525252] mb-3">Enter any two known values:</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {knowns.map(k => (
          <div key={k}>
            <label className="block text-xs font-mono uppercase tracking-wider mb-1.5" style={{ color: COLORS_MAP[k] }}>
              {LABELS[k]}
            </label>
            <div className="flex">
              <input
                type="number"
                value={vals[k]}
                onChange={e => setVal(k, e.target.value)}
                placeholder="—"
                className="flex-1 rounded-l-lg border border-[#262626] bg-[#111111] px-3 py-2.5 text-sm text-[#F5F5F5] focus:border-[#F97316] focus:outline-none"
              />
              <span className="rounded-r-lg border border-l-0 border-[#262626] bg-[#1E1E1E] px-3 py-2.5 text-xs text-[#525252]">{UNITS[k]}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Results */}
      {result && (
        <div className="bg-[#0A0A0A] border border-[#262626] rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#525252] font-mono uppercase tracking-wider">Results</p>
            <CopyButton value={copyText} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {([["V", fmtV(result.V)], ["I", fmtI(result.I)], ["R", fmtR(result.R)], ["P", fmtP(result.P)]] as [Solve, string][]).map(([k, v]) => (
              <div key={k} className={`rounded-lg border p-3 ${solve === k ? "border-[#F97316]/50 bg-[#F97316]/5" : "border-[#1E1E1E]"}`}>
                <p className="text-xs font-mono mb-1" style={{ color: COLORS_MAP[k] }}>{LABELS[k]}</p>
                <p className="text-xl font-bold font-mono" style={{ color: solve === k ? COLORS_MAP[k] : "#F5F5F5" }}>{v}</p>
                {solve === k && <p className="text-[10px] text-[#F97316] mt-0.5">← calculated</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ohm's law triangle reference */}
      <div className="mt-6 border border-[#1E1E1E] rounded-lg p-4">
        <p className="text-xs text-[#525252] font-mono uppercase mb-2">Quick Reference</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono text-[#525252]">
          <span>V = I × R</span><span>I = V / R</span><span>R = V / I</span><span>P = V × I</span>
          <span>P = I² × R</span><span>P = V² / R</span><span>I = P / V</span><span>V = P / I</span>
        </div>
      </div>
    </CalculatorLayout>
  );
}
