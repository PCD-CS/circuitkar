"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
}

export function Stepper({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
  className,
}: StepperProps) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg border border-[#262626] bg-[#111111]",
        className,
      )}
    >
      <button
        type="button"
        onClick={dec}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
        className="flex h-11 w-11 items-center justify-center rounded-l-lg text-[#A3A3A3] transition-colors hover:text-[#F5F5F5] disabled:opacity-40 disabled:pointer-events-none"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-10 select-none text-center font-mono text-sm text-[#F5F5F5]">
        {value}
      </span>
      <button
        type="button"
        onClick={inc}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
        className="flex h-11 w-11 items-center justify-center rounded-r-lg text-[#A3A3A3] transition-colors hover:text-[#F5F5F5] disabled:opacity-40 disabled:pointer-events-none"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
