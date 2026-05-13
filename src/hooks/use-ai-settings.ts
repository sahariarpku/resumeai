"use client";

import { useState, useEffect } from "react";
import { getRouterConfig } from "@/lib/admin";

export interface RouterStatus {
  hasActiveCombo: boolean;
  activeComboName: string | null;
  strategy: 'fallback' | 'round-robin' | null;
  modelCount: number;
  hydrated: boolean;
}

export function useRouterStatus(): RouterStatus {
  const [status, setStatus] = useState<RouterStatus>({
    hasActiveCombo: false,
    activeComboName: null,
    strategy: null,
    modelCount: 0,
    hydrated: false,
  });

  useEffect(() => {
    getRouterConfig()
      .then((config) => {
        if (!config) {
          setStatus({ hasActiveCombo: false, activeComboName: null, strategy: null, modelCount: 0, hydrated: true });
          return;
        }
        const combo = config.combos.find((c) => c.id === config.activeComboId);
        if (!combo) {
          setStatus({ hasActiveCombo: false, activeComboName: null, strategy: null, modelCount: 0, hydrated: true });
          return;
        }
        setStatus({
          hasActiveCombo: true,
          activeComboName: combo.name,
          strategy: combo.strategy,
          modelCount: combo.models.length,
          hydrated: true,
        });
      })
      .catch(() => {
        setStatus({ hasActiveCombo: false, activeComboName: null, strategy: null, modelCount: 0, hydrated: true });
      });
  }, []);

  return status;
}
