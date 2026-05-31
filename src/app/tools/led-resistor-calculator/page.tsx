import type { Metadata } from "next";
import { LEDResistorCalculator } from "./LEDResistorCalculator";

export const metadata: Metadata = {
  title: "LED Resistor Calculator — Current Limiting",
  description: "Calculate the correct current-limiting resistor for your LED. Enter supply voltage, LED forward voltage, and desired current to get the resistor value.",
  openGraph: { title: "LED Resistor Calculator | Circuitkar", description: "Calculate current-limiting resistors for LEDs." },
};

export default function Page() {
  return <LEDResistorCalculator />;
}
