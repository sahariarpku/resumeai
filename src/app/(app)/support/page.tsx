import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SupportPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="font-headline text-3xl font-bold tracking-tight md:text-4xl">Support</h1>
        <p className="text-muted-foreground">Find help and resources for using ResumeForge.</p>
      </div>
      <Card>
        <CardHeader>
          <LifeBuoy className="h-12 w-12 text-primary mb-4" />
          <CardTitle className="font-headline">Need Help?</CardTitle>
          <CardDescription>
            Browse our FAQs or contact our support team.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Frequently Asked Questions</h3>
            <p className="text-sm text-muted-foreground">Our FAQ section is currently under development. Please check back soon!</p>
            {/* Placeholder for FAQs */}
          </div>
          <div>
            <h3 className="font-semibold mb-2">Contact Support</h3>
            <p className="text-sm text-muted-foreground mb-2">
              If you can&apos;t find an answer in our FAQs, feel free to reach out to us.
            </p>
            <Button asChild>
              <Link href="mailto:support@resumeforge.example.com">
                Email Support
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
