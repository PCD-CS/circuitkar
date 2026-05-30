import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  accent?: boolean;
}

export function StatsCard({ title, value, subtitle, icon, accent }: StatsCardProps) {
  return (
    <div
      className={cn(
        "bg-[#161616] border border-[#262626] rounded-lg p-5 flex flex-col gap-3",
        accent && "border-l-2 border-l-[#F97316]"
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#A3A3A3] uppercase tracking-wider font-mono">{title}</p>
        {icon && <div className="text-[#525252]">{icon}</div>}
      </div>
      <p className="text-3xl font-bold text-[#F5F5F5] font-mono">{value}</p>
      {subtitle && <p className="text-xs text-[#525252]">{subtitle}</p>}
    </div>
  );
}
