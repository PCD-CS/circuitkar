import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "category" | "status" | "warning" | "success" | "accent";

interface BadgeProps {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<Variant, string> = {
  category:
    "bg-[#1E1E1E] text-[#A3A3A3] border border-[#262626]",
  status:
    "bg-[#EF444415] text-[#EF4444] border border-[#EF444430]",
  warning:
    "bg-[#F59E0B15] text-[#F59E0B] border border-[#F59E0B30]",
  success:
    "bg-[#22C55E15] text-[#22C55E] border border-[#22C55E30]",
  accent:
    "bg-[#F9731615] text-[#F97316] border border-[#F9731630]",
};

export function Badge({ variant = "category", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium font-body tracking-wide",
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
