
"use client";

import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, ExternalLink } from "lucide-react";
import { jobSearch } from "@/ai/flows/job-search-flow";
import { JobSearchInputSchema } from "@/lib/schemas";
import type { JobSearchInput, JobSearchLink } from "@/lib/schemas";
import { useAuth } from '@/contexts/auth-context';
import groupBy from 'lodash.groupby';

type JobSearchLinksBySite = {
  [key: string]: JobSearchLink[];
};

export default function JobSearchPage() {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<JobSearchLinksBySite | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<JobSearchInput>({
    resolver: zodResolver(JobSearchInputSchema),
    defaultValues: {
      prompt: "",
    },
  });

  const onSubmit = async (data: JobSearchInput) => {
    if (!currentUser) {
      toast({ title: "Not Authenticated", description: "Please sign in to use job search.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setError(null);
    setSearchResults(null);
    try {
      const result = await jobSearch(data);
      if (result.links && result.links.length > 0) {
        // Group links by site name for easier display
        const groupedLinks = groupBy(result.links, 'siteName');
        setSearchResults(groupedLinks);
        toast({ title: "Search Links Generated!", description: `AI has created ${result.links.length} search links for you.` });
      } else {
        toast({ title: "No Links Generated", description: "The AI could not generate search links from your description. Please try being more specific." });
      }
    } catch (err) {
      console.error("Job search link generation failed:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMessage);
      toast({ title: "Generation Error", description: `Failed to generate search links: ${errorMessage}`, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold flex items-center">
          <Search className="mr-3 h-8 w-8 text-primary" /> AI Job Search Assistant
        </h1>
        <p className="text-muted-foreground">
          Describe the job you're looking for, and our AI will create powerful search links for top job sites.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Describe Your Ideal Job</CardTitle>
          <CardDescription>
            Enter a description of the role you want. For example: "A junior full-stack developer role in Manchester, preferably using TypeScript and Next.js."
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Job Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., A research assistant position in neuroscience at a London university..." {...field} rows={4} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading || !currentUser} size="lg">
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Search className="mr-2 h-5 w-5" />}
                Generate Search Links
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive">
            <CardHeader>
                <CardTitle className="text-destructive">Generation Failed</CardTitle>
                <CardDescription>{error}</CardDescription>
            </CardHeader>
        </Card>
      )}

      {searchResults && (
        <div className="space-y-6">
            <h2 className="font-headline text-2xl font-bold text-center">Your AI-Generated Search Links</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(searchResults).map(([siteName, links]) => (
                <Card key={siteName}>
                  <CardHeader>
                    <CardTitle className="font-headline text-xl">{siteName}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {links.map((link, index) => (
                        <li key={index}>
                          <a 
                            href={link.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3 rounded-md border text-sm font-medium text-primary hover:bg-muted/50 hover:text-primary/90 transition-colors"
                          >
                            <span>{link.query}</span>
                            <ExternalLink className="h-4 w-4 shrink-0 ml-2" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
        </div>
      )}
    </div>
  );
}
