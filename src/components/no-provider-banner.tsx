"use client";

import Link from "next/link";
import { AlertTriangle, Settings } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAISettingsContext } from "@/contexts/ai-settings-context";

export function NoProviderBanner() {
  const { activeProvider, hydrated } = useAISettingsContext();

  if (!hydrated || activeProvider) return null;

  return (
    <Alert className="mb-6 border-amber-500/30 bg-amber-500/10 text-amber-200">
      <AlertTriangle className="h-4 w-4 text-amber-400" />
      <AlertDescription className="flex items-center justify-between gap-4 flex-wrap">
        <span className="text-sm">
          <span className="font-medium text-amber-300">No AI provider configured.</span>{" "}
          AI features won&apos;t work until you add and activate a provider.
        </span>
        <Button size="sm" variant="outline" className="border-amber-500/40 text-amber-300 hover:bg-amber-500/20 shrink-0" asChild>
          <Link href="/settings?tab=ai">
            <Settings className="h-3.5 w-3.5 mr-1.5" />
            Configure AI
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
