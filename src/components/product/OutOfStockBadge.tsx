import { cn } from "@/lib/utils";

export function OutOfStockBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg bg-[#EF444415] px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-[#EF4444]",
        className,
      )}
    >
      Out of Stock
    </span>
  );
}
