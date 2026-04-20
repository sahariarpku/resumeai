import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CreditCard, CheckCircle2, Sparkles } from "lucide-react";

const FREE_FEATURES = [
  "Unlimited AI resume tailoring (with your own API key)",
  "Cover letter generation",
  "Job description matching & scoring",
  "Profile extraction from uploaded CV",
  "LaTeX CV export",
  "Job search with AI-generated queries",
  "All AI providers supported (OpenAI, Gemini, Claude, Groq…)",
  "Data stored securely in your Firebase account",
];

export default function BillingPage() {
  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="font-headline text-3xl font-bold tracking-tight md:text-4xl">Billing</h1>
        <p className="text-muted-foreground mt-1">Manage your plan and understand what&apos;s included.</p>
      </div>

      <div className="space-y-6">
        {/* Current plan */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle className="font-headline text-xl">Free Plan</CardTitle>
                  <CardDescription>Your current plan</CardDescription>
                </div>
              </div>
              <Badge className="bg-primary/20 text-primary border-primary/30">Active</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold mb-1">$0 <span className="text-base font-normal text-muted-foreground">/ month</span></p>
            <p className="text-sm text-muted-foreground mb-4">
              ResumeForge is free because you bring your own AI API key. You pay your AI provider directly — we never charge for usage.
            </p>
            <Separator className="my-4" />
            <p className="text-sm font-medium mb-3">Everything included:</p>
            <ul className="space-y-2">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Payment methods placeholder */}
        <Card className="opacity-60">
          <CardHeader>
            <CreditCard className="h-6 w-6 text-muted-foreground mb-1" />
            <CardTitle className="font-headline text-base">Payment Methods</CardTitle>
            <CardDescription>No payment method required on the free plan.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
