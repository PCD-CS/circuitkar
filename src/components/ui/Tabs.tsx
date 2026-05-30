"use client";

import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  /** Set to truthy to show an orange dot (e.g. unsaved changes). */
  badge?: string;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div
      className={cn(
        "flex gap-1 overflow-x-auto border-b border-[#262626]",
        className,
      )}
      role="tablist"
    >
      {tabs.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative flex shrink-0 items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors",
              active
                ? "text-[#F97316]"
                : "text-[#A3A3A3] hover:text-[#F5F5F5]",
            )}
          >
            {tab.label}
            {tab.badge && (
              <span className="h-1.5 w-1.5 rounded-full bg-[#F97316]" />
            )}
            {active && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#F97316]" />
            )}
          </button>
        );
      })}
    </div>
  );
}
