"use client";

import { BarChart3 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function InterestBadge({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  const [animate, setAnimate] = useState(false);
  const prev = useRef(count);

  useEffect(() => {
    if (count !== prev.current) {
      setAnimate(true);
      prev.current = count;
      const t = setTimeout(() => setAnimate(false), 400);
      return () => clearTimeout(t);
    }
  }, [count]);

  if (count <= 0) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs text-[#A3A3A3]",
        className,
      )}
    >
      <BarChart3 className="h-3.5 w-3.5 text-[#F97316]" />
      <span
        className={cn(
          "inline-block font-mono text-[#F5F5F5]",
          animate && "animate-count-pop",
        )}
      >
        {count}
      </span>
      {count === 1 ? "person interested" : "people interested"}
    </span>
  );
}
