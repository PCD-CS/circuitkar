import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const textSize =
    size === "sm" ? "text-lg" : size === "lg" ? "text-3xl" : "text-2xl";
  return (
    <Link
      href="/"
      className={cn("group inline-flex flex-col leading-none", className)}
      aria-label="Circuitkar home"
    >
      <span className={cn("font-display font-bold tracking-tight", textSize)}>
        <span className="text-[#A3A3A3]">CIRCUIT</span>
        <span className="text-[#F97316]">KAR</span>
      </span>
      {/* Circuit-trace underline */}
      <svg
        viewBox="0 0 120 8"
        className="mt-1 h-2 w-full"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <line
          x1="2"
          y1="4"
          x2="118"
          y2="4"
          stroke="#F97316"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="2" cy="4" r="2.5" fill="#F97316" />
        <circle cx="60" cy="4" r="2.5" fill="#F97316" />
        <circle cx="118" cy="4" r="2.5" fill="#F97316" />
      </svg>
    </Link>
  );
}
