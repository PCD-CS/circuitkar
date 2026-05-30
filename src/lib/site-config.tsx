"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { LaunchMode } from "@/types";

export interface SiteConfig {
  launchMode: LaunchMode;
  freeShippingThreshold: number;
}

const SiteConfigContext = createContext<SiteConfig>({
  launchMode: "prelaunch",
  freeShippingThreshold: 499,
});

export function SiteConfigProvider({
  value,
  children,
}: {
  value: SiteConfig;
  children: ReactNode;
}) {
  return (
    <SiteConfigContext.Provider value={value}>
      {children}
    </SiteConfigContext.Provider>
  );
}

export function useSiteConfig() {
  return useContext(SiteConfigContext);
}
