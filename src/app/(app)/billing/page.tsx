"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useSubscription } from "@/hooks/use-subscription";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  CheckCircle2, Sparkles, Zap, Loader2, CreditCard, ExternalLink,
  Calendar, ShieldCheck, Infinity,
} from "lucide-react";

// ─── Plan data ────────────────────────────────────────────────────────────────

const FREE_FEATURES = [
  "5 AI resume tailorings per month",
  "Cover letter generation",
  "Job description matching & scoring",
  "Profile extraction from uploaded CV",
  "LaTeX CV export",
  "Job search with AI-generated queries",
  "All AI providers supported",
];

const PRO_FEATURES = [
  "Unlimited AI resume tailorings",
  "Unlimited cover letter generation",
  "Priority AI routing",
  "Unlimited job applications tracked",
  "Advanced profile matching",
  "Early access to new features",
  "Email support",
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const sub = useSubscription();
  const searchParams = useSearchParams();

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  // Handle return from Stripe
  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");
    if (success === "1") {
      toast({ title: "Subscription active!", description: "Welcome to Pro. Your plan is now active." });
      window.history.replaceState({}, "", "/billing");
    } else if (canceled === "1") {
      toast({ title: "Checkout canceled", description: "You haven't been charged.", variant: "destructive" });
      window.history.replaceState({}, "", "/billing");
    }
  }, [searchParams, toast]);

  async function handleUpgrade() {
    if (!currentUser) return;
    const priceId = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID;
    if (!priceId) {
      toast({ title: "Billing not configured", description: "NEXT_PUBLIC_STRIPE_PRO_PRICE_ID is not set.", variant: "destructive" });
      return;
    }
    setCheckoutLoading(true);
    try {
      const tok = await currentUser.getIdToken();
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
        body: JSON.stringify({
          priceId,
          uid: currentUser.uid,
          email: currentUser.email ?? "",
        }),
      });
      const d = await res.json() as { url?: string; error?: string };
      if (!res.ok || !d.url) throw new Error(d.error ?? "Failed to create checkout session");
      window.location.href = d.url;
    } catch (err) {
      toast({ title: "Checkout failed", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
      setCheckoutLoading(false);
    }
  }

  async function handlePortal() {
    if (!currentUser) return;
    setPortalLoading(true);
    try {
      const tok = await currentUser.getIdToken();
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
        body: JSON.stringify({ uid: currentUser.uid }),
      });
      const d = await res.json() as { url?: string; error?: string };
      if (!res.ok || !d.url) throw new Error(d.error ?? "Failed to open portal");
      window.location.href = d.url;
    } catch (err) {
      toast({ title: "Portal failed", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
      setPortalLoading(false);
    }
  }

  const periodEnd = sub.currentPeriodEnd
    ? new Date(sub.currentPeriodEnd * 1000).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="font-headline text-3xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground mt-1">Manage your plan and subscription.</p>
      </div>

      {/* Current plan status */}
      {!sub.loading && (
        <div className={`rounded-xl border p-5 mb-6 flex items-center justify-between gap-4 flex-wrap ${sub.isPro ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}>
          <div className="flex items-center gap-4">
            {sub.isPro
              ? <Zap className="h-9 w-9 text-primary shrink-0" />
              : <Sparkles className="h-9 w-9 text-muted-foreground shrink-0" />}
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-semibold text-lg">{sub.isPro ? "Pro Plan" : "Free Plan"}</span>
                <Badge className={sub.isPro ? "bg-primary/20 text-primary border-primary/30" : "bg-muted text-muted-foreground"}>
                  {sub.isPro ? "Active" : "Free"}
                </Badge>
                {sub.status === "past_due" && <Badge variant="destructive">Past Due</Badge>}
              </div>
              {sub.isPro && periodEnd && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />Renews {periodEnd}
                </p>
              )}
              {!sub.isPro && (
                <p className="text-xs text-muted-foreground">Upgrade to unlock unlimited AI features</p>
              )}
            </div>
          </div>
          {sub.isPro ? (
            <Button variant="outline" size="sm" onClick={handlePortal} disabled={portalLoading} className="gap-1.5 shrink-0">
              {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
              Manage subscription
            </Button>
          ) : (
            <Button onClick={handleUpgrade} disabled={checkoutLoading} className="gap-1.5 shrink-0">
              {checkoutLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Upgrade to Pro
            </Button>
          )}
        </div>
      )}

      {/* Plan comparison */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">

        {/* Free */}
        <Card className={`relative ${!sub.isPro ? "border-primary/30 ring-1 ring-primary/20" : ""}`}>
          {!sub.isPro && (
            <span className="absolute -top-2.5 left-4 text-[10px] font-semibold px-2 py-0.5 bg-primary text-primary-foreground rounded-full">Current</span>
          )}
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Free</CardTitle>
            <CardDescription>
              <span className="text-2xl font-bold text-foreground">$0</span>
              <span className="text-sm text-muted-foreground"> / month</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {FREE_FEATURES.map((f) => (
              <div key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                {f}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Pro */}
        <Card className={`relative ${sub.isPro ? "border-primary/30 ring-1 ring-primary/20" : ""}`}>
          {sub.isPro && (
            <span className="absolute -top-2.5 left-4 text-[10px] font-semibold px-2 py-0.5 bg-primary text-primary-foreground rounded-full">Current</span>
          )}
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-1">
              <CardTitle className="text-base font-semibold">Pro</CardTitle>
              <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">Most Popular</Badge>
            </div>
            <CardDescription>
              <span className="text-2xl font-bold text-foreground">$9.99</span>
              <span className="text-sm text-muted-foreground"> / month</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {PRO_FEATURES.map((f) => (
              <div key={f} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                {f}
              </div>
            ))}
            {!sub.isPro && (
              <Button className="w-full mt-4 gap-1.5" onClick={handleUpgrade} disabled={checkoutLoading}>
                {checkoutLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                Upgrade to Pro
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-lg border p-4 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Secure payments</p>
            <p className="text-xs text-muted-foreground mt-0.5">Powered by Stripe. We never store your card details.</p>
          </div>
        </div>
        <div className="rounded-lg border p-4 flex items-start gap-3">
          <Infinity className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Cancel anytime</p>
            <p className="text-xs text-muted-foreground mt-0.5">No lock-in. Cancel from the billing portal and keep access until the period ends.</p>
          </div>
        </div>
      </div>

      {sub.isPro && (
        <>
          <Separator className="my-6" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium flex items-center gap-2"><CreditCard className="h-4 w-4" />Payment method</p>
              <p className="text-xs text-muted-foreground mt-0.5">Manage cards, invoices, and subscription details in the Stripe portal.</p>
            </div>
            <Button variant="outline" size="sm" onClick={handlePortal} disabled={portalLoading} className="gap-1.5">
              {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
              Open portal
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
