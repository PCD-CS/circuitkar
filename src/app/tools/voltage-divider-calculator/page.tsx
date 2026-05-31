import type { Metadata } from "next";
import { VoltageDividerCalculator } from "./VoltageDividerCalculator";

export const metadata: Metadata = {
  title: "Voltage Divider Calculator",
  description: "Calculate Vout, R1, R2, or current for a resistive voltage divider. Enter any known values and solve for the rest.",
  openGraph: { title: "Voltage Divider Calculator | Circuitkar", description: "Calculate resistive voltage divider circuits." },
};

export default function Page() {
  return <VoltageDividerCalculator />;
}
