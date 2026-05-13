"use client";

import { AlertTriangle, Route } from "lucide-react";
import Link from "next/link";
import { useAISettingsContext } from "@/contexts/ai-settings-context";
import { useAuth } from "@/contexts/auth-context";
import { useEffect, useState } from "react";
import { isUserAdmin } from "@/lib/admin";

export function NoProviderBanner() {
  const { hasActiveCombo, hydrated } = useAISettingsContext();
  const { currentUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (currentUser) isUserAdmin(currentUser.uid).then(setIsAdmin);
  }, [currentUser]);

  if (!hydrated || hasActiveCombo || !isAdmin) return null;

  return (
    <div
      className="mb-6 flex items-start gap-3 px-4 py-3 rounded-lg text-sm"
      style={{ background: 'rgba(192,133,50,0.08)', border: '1px solid rgba(192,133,50,0.25)', color: '#26251e' }}
    >
      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#c08532' }} />
      <span>
        <span className="font-semibold" style={{ color: '#c08532' }}>AI router not configured.</span>{" "}
        Go to{" "}
        <Link href="/admin" className="underline underline-offset-2 font-medium transition-colors duration-150" style={{ color: '#c08532' }}>
          AI Router settings
        </Link>{" "}
        and connect a provider to enable AI for all users.
      </span>
    </div>
  );
}

export function AdminProviderBanner() {
  const { hasActiveCombo, activeComboName, strategy, modelCount, hydrated } = useAISettingsContext();
  if (!hydrated || !hasActiveCombo) return null;

  return (
    <div
      className="mb-6 flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm"
      style={{ background: 'rgba(31,138,101,0.06)', border: '1px solid rgba(31,138,101,0.2)', color: '#26251e' }}
    >
      <Route className="h-4 w-4 flex-shrink-0" style={{ color: '#1f8a65' }} />
      <span>
        AI router active:{" "}
        <span className="font-semibold">{activeComboName}</span>
        <span style={{ color: 'rgba(38,37,30,0.45)' }}> · {strategy} · {modelCount} model{modelCount !== 1 ? "s" : ""}</span>
      </span>
    </div>
  );
}
