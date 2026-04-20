"use client";

import { useState, useEffect, useCallback } from "react";
import type { AISettings, AIProviderConfig } from "@/lib/types";

const STORAGE_KEY = "resumeai_ai_settings";

export const DEFAULT_PROVIDERS: AIProviderConfig[] = [
  {
    id: "google-gemini",
    name: "Google Gemini",
    enabled: false,
    apiKey: "",
    baseUrl: "https://generativelanguage.googleapis.com",
    model: "gemini-2.0-flash",
  },
  {
    id: "openai",
    name: "OpenAI",
    enabled: false,
    apiKey: "",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    enabled: false,
    apiKey: "",
    baseUrl: "https://api.anthropic.com/v1",
    model: "claude-sonnet-4-6",
  },
  {
    id: "groq",
    name: "Groq",
    enabled: false,
    apiKey: "",
    baseUrl: "https://api.groq.com/openai/v1",
    model: "llama-3.3-70b-versatile",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    enabled: false,
    apiKey: "",
    baseUrl: "https://openrouter.ai/api/v1",
    model: "openai/gpt-4o",
  },
  {
    id: "mistral",
    name: "Mistral AI",
    enabled: false,
    apiKey: "",
    baseUrl: "https://api.mistral.ai/v1",
    model: "mistral-large-latest",
  },
  {
    id: "ollama",
    name: "Ollama (Local)",
    enabled: false,
    apiKey: "",
    baseUrl: "http://localhost:11434/v1",
    model: "llama3.2",
  },
];

const DEFAULT_SETTINGS: AISettings = {
  activeProviderId: null,
  providers: DEFAULT_PROVIDERS,
};

function loadSettings(): AISettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed: AISettings = JSON.parse(raw);
    // Merge in any new default providers that aren't saved yet
    const existingIds = new Set(parsed.providers.map((p) => p.id));
    const merged = [
      ...parsed.providers,
      ...DEFAULT_PROVIDERS.filter((p) => !existingIds.has(p.id) && !p.isCustom),
    ];
    return { ...parsed, providers: merged };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function useAISettings() {
  const [settings, setSettings] = useState<AISettings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
    setHydrated(true);
  }, []);

  const saveSettings = useCallback((next: AISettings) => {
    setSettings(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  }, []);

  const updateProvider = useCallback(
    (id: string, updates: Partial<AIProviderConfig>) => {
      setSettings((prev) => {
        const next: AISettings = {
          ...prev,
          providers: prev.providers.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        };
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        }
        return next;
      });
    },
    []
  );

  const addCustomProvider = useCallback(
    (config: Omit<AIProviderConfig, "id" | "isCustom">) => {
      const id = `custom-${Date.now()}`;
      const newProvider: AIProviderConfig = { ...config, id, isCustom: true };
      setSettings((prev) => {
        const next: AISettings = {
          ...prev,
          providers: [...prev.providers, newProvider],
        };
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        }
        return next;
      });
      return id;
    },
    []
  );

  const removeProvider = useCallback((id: string) => {
    setSettings((prev) => {
      const next: AISettings = {
        ...prev,
        activeProviderId: prev.activeProviderId === id ? null : prev.activeProviderId,
        providers: prev.providers.filter((p) => p.id !== id),
      };
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const setActiveProvider = useCallback((id: string | null) => {
    setSettings((prev) => {
      const next: AISettings = { ...prev, activeProviderId: id };
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const activeProvider = settings.providers.find(
    (p) => p.id === settings.activeProviderId
  ) ?? null;

  return {
    settings,
    hydrated,
    saveSettings,
    updateProvider,
    addCustomProvider,
    removeProvider,
    setActiveProvider,
    activeProvider,
  };
}
