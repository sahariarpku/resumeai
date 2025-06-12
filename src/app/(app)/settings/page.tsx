import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="font-headline text-3xl font-bold tracking-tight md:text-4xl">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>
      <Card>
        <CardHeader>
          <SettingsIcon className="h-12 w-12 text-primary mb-4" />
          <CardTitle className="font-headline">Coming Soon</CardTitle>
          <CardDescription>
            Account settings, preferences, and integrations will be available here in a future update.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Stay tuned for more features!</p>
        </CardContent>
      </Card>
    </div>
  );
}
