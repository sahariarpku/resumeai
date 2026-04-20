"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useAISettings } from "@/hooks/use-ai-settings";
import type { AIProviderConfig, AISettings } from "@/lib/types";

interface AISettingsContextType {
  settings: AISettings;
  hydrated: boolean;
  saveSettings: (next: AISettings) => void;
  updateProvider: (id: string, updates: Partial<AIProviderConfig>) => void;
  addCustomProvider: (config: Omit<AIProviderConfig, "id" | "isCustom">) => string;
  removeProvider: (id: string) => void;
  setActiveProvider: (id: string | null) => void;
  activeProvider: AIProviderConfig | null;
}

const AISettingsContext = createContext<AISettingsContextType | undefined>(undefined);

export function AISettingsProvider({ children }: { children: ReactNode }) {
  const value = useAISettings();
  return (
    <AISettingsContext.Provider value={value}>
      {children}
    </AISettingsContext.Provider>
  );
}

export function useAISettingsContext(): AISettingsContextType {
  const ctx = useContext(AISettingsContext);
  if (!ctx) throw new Error("useAISettingsContext must be used within AISettingsProvider");
  return ctx;
}
