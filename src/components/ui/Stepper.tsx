"use client";

import { Minus, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
  // Own local state so rapid clicks are never blocked by a stale render.
  const [local, setLocal] = useState(value);
  // Timer that prevents the parent value from overwriting local state while
  // the user is still clicking (i.e. before the server has caught up).
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInteracting = useRef(false);

  // Sync from parent only when the user is not mid-interaction.
  useEffect(() => {
    if (!isInteracting.current) {
      setLocal(value);
    }
  }, [value]);

  function step(delta: -1 | 1) {
    setLocal(curr => {
      const next = Math.min(max, Math.max(min, curr + delta));
      onChange(next);
      return next;
    });
    // Mark as interacting so parent re-sync doesn't stomp our local state.
    isInteracting.current = true;
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      isInteracting.current = false;
      idleTimer.current = null;
    }, 1200);
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg border border-[#262626] bg-[#111111]",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => step(-1)}
        disabled={disabled || local <= min}
        aria-label="Decrease quantity"
        className="flex h-11 w-11 items-center justify-center rounded-l-lg text-[#A3A3A3] transition-colors hover:text-[#F5F5F5] disabled:opacity-40 disabled:pointer-events-none"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-10 select-none text-center font-mono text-sm text-[#F5F5F5]">
        {local}
      </span>
      <button
        type="button"
        onClick={() => step(1)}
        disabled={disabled || local >= max}
        aria-label="Increase quantity"
        className="flex h-11 w-11 items-center justify-center rounded-r-lg text-[#A3A3A3] transition-colors hover:text-[#F5F5F5] disabled:opacity-40 disabled:pointer-events-none"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
