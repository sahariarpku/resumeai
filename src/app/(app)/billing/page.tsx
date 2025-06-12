import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";

export default function BillingPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="font-headline text-3xl font-bold tracking-tight md:text-4xl">Billing</h1>
        <p className="text-muted-foreground">Manage your subscription and payment methods.</p>
      </div>
      <Card>
        <CardHeader>
          <CreditCard className="h-12 w-12 text-primary mb-4" />
          <CardTitle className="font-headline">Billing Management - Coming Soon</CardTitle>
          <CardDescription>
            Subscription details, payment history, and plan management will be available here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Currently, all users are on the free plan. Check back later for premium features!</p>
        </CardContent>
      </Card>
    </div>
  );
}
