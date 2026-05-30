"use client";

import {
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
  type ChangeEvent,
} from "react";

interface OTPInputProps {
  value: string;
  onChange: (val: string) => void;
  length?: number;
}

export function OTPInput({ value, onChange, length = 6 }: OTPInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const chars = value.split("").slice(0, length);
  while (chars.length < length) chars.push("");

  function setCharAt(index: number, char: string) {
    const next = chars.slice();
    next[index] = char;
    onChange(next.join("").replace(/\s/g, ""));
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>, index: number) {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) {
      setCharAt(index, "");
      return;
    }
    // Allow pasting multiple digits into one box.
    const digits = raw.split("");
    const next = chars.slice();
    let cursor = index;
    for (const d of digits) {
      if (cursor >= length) break;
      next[cursor] = d;
      cursor++;
    }
    onChange(next.join("").replace(/\s/g, ""));
    const focusIndex = Math.min(cursor, length - 1);
    refs.current[focusIndex]?.focus();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>, index: number) {
    if (e.key === "Backspace") {
      if (chars[index]) {
        setCharAt(index, "");
      } else if (index > 0) {
        refs.current[index - 1]?.focus();
        setCharAt(index - 1, "");
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      refs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (pasted) {
      onChange(pasted);
      refs.current[Math.min(pasted.length, length - 1)]?.focus();
    }
  }

  return (
    <div className="flex gap-2">
      {chars.map((char, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={char}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onPaste={handlePaste}
          className="h-12 w-12 rounded-lg border border-[#262626] bg-[#111111] text-center font-mono text-lg text-[#F5F5F5] transition-colors focus:border-[#F97316] focus:outline-none focus:ring-1 focus:ring-[#F97316]"
        />
      ))}
    </div>
  );
}
