"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useRouterStatus, type RouterStatus } from "@/hooks/use-ai-settings";

const RouterStatusContext = createContext<RouterStatus | undefined>(undefined);

export function AISettingsProvider({ children }: { children: ReactNode }) {
  const value = useRouterStatus();
  return (
    <RouterStatusContext.Provider value={value}>
      {children}
    </RouterStatusContext.Provider>
  );
}

export function useAISettingsContext(): RouterStatus {
  const ctx = useContext(RouterStatusContext);
  if (!ctx) throw new Error("useAISettingsContext must be used within AISettingsProvider");
  return ctx;
}
