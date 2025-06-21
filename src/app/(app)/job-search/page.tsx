
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search } from "lucide-react";

export default function JobSearchPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold flex items-center">
          <Search className="mr-3 h-8 w-8 text-primary" /> AI Job Search
        </h1>
        <p className="text-muted-foreground">
          This feature is currently under development.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Feature Unavailable</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">The job search functionality is being reworked. Please check back later!</p>
        </CardContent>
      </Card>
    </div>
  );
}
