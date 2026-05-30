import {
  Cpu,
  Radio,
  Monitor,
  Zap,
  Settings,
  Wifi,
  Grid3x3,
  Clock,
  Lightbulb,
  Component,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  cpu: Cpu,
  radio: Radio,
  monitor: Monitor,
  zap: Zap,
  settings: Settings,
  wifi: Wifi,
  grid: Grid3x3,
  clock: Clock,
  lightbulb: Lightbulb,
};

export function getCategoryIcon(icon: string | null | undefined): LucideIcon {
  if (!icon) return Component;
  return ICONS[icon] ?? Component;
}
