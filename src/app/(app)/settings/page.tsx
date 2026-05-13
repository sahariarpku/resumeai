"use client";

import React, { useState, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Settings, Copy, Check } from "lucide-react";

// ─── General tab ──────────────────────────────────────────────────────────────

function GeneralTab() {
  const { currentUser } = useAuth();
  const [copied, setCopied] = useState(false);

  const handleCopyUid = useCallback(() => {
    if (!currentUser?.uid) return;
    navigator.clipboard.writeText(currentUser.uid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [currentUser]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
          <CardDescription>Your account info and display settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentUser && (
            <>
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{currentUser.email}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start justify-between py-2 gap-4">
                <div className="min-w-0 flex-1">
                  <Label className="text-sm font-medium">Your User ID</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Needed to grant admin access in Firestore
                  </p>
                  <p className="text-xs font-mono text-foreground/80 mt-1.5 break-all">
                    {currentUser.uid}
                  </p>
                </div>
                <button
                  onClick={handleCopyUid}
                  className="mt-1 shrink-0 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded border border-border hover:border-border/80"
                >
                  {copied ? (
                    <><Check className="h-3.5 w-3.5 text-emerald-400" /> Copied</>
                  ) : (
                    <><Copy className="h-3.5 w-3.5" /> Copy</>
                  )}
                </button>
              </div>
              <Separator />
            </>
          )}
          <div className="flex items-center justify-between py-2">
            <div>
              <Label className="text-sm font-medium">Theme</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Application appearance</p>
            </div>
            <Badge variant="secondary">Dark</Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <div>
              <Label className="text-sm font-medium">Language</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Display language</p>
            </div>
            <Badge variant="secondary">English</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Privacy</CardTitle>
          <CardDescription>Control how your data is used.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">Analytics</Label>
              <p className="text-xs text-muted-foreground">
                Help improve the app with anonymous usage data
              </p>
            </div>
            <Switch defaultChecked={false} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Settings className="h-6 w-6" />
          <h1 className="font-headline text-3xl font-bold tracking-tight md:text-4xl">Settings</h1>
        </div>
        <p className="text-muted-foreground">Manage your account and preferences.</p>
      </div>
      <GeneralTab />
    </div>
  );
}
