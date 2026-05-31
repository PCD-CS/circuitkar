import type { Metadata } from "next";
import { OhmsLawCalculator } from "./OhmsLawCalculator";

export const metadata: Metadata = {
  title: "Ohm's Law Calculator — Voltage, Current, Resistance, Power",
  description: "Calculate voltage, current, resistance, and power using Ohm's Law. Enter any two known values to instantly solve for the others.",
  openGraph: { title: "Ohm's Law Calculator | Circuitkar", description: "V=IR calculator with power (P=IV) — enter any two values." },
};

export default function Page() {
  return <OhmsLawCalculator />;
}
