
"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, ExternalLink, Briefcase, Sparkles } from "lucide-react";
import { jobSearch } from "@/ai/flows/job-search-flow";
import { jobSearchFormSchema } from "@/lib/schemas";
import type { JobSearchInput, JobExtractionResult } from "@/lib/schemas";
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { UserProfile } from '@/lib/types';
import { db } from '@/lib/firebase';
import { doc, getDoc, enableNetwork } from 'firebase/firestore';
import { profileToResumeText } from '@/lib/profile-utils';
import { calculateProfileJdMatch } from '@/ai/flows/calculate-profile-jd-match-flow';

const TAILOR_RESUME_PREFILL_JD_KEY = "tailorResumePrefillJD";
const TAILOR_RESUME_PREFILL_RESUME_KEY = "tailorResumePrefillResume";

// Extend search result type to include UI state
type JobSearchResultWithUiState = JobExtractionResult & {
  isCalculatingMatch?: boolean;
  matchPercentage?: number;
  matchSummary?: string;
  matchCategory?: 'Excellent Match' | 'Good Match' | 'Fair Match' | 'Poor Match';
};

export default function JobSearchPage() {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<JobSearchResultWithUiState[]>([]);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<JobSearchInput>({
    resolver: zodResolver(jobSearchFormSchema),
    defaultValues: {
      prompt: "",
    },
  });

  const onSubmit = async (data: JobSearchInput) => {
    setIsLoading(true);
    setError(null);
    setSearchResults([]);
    try {
      const result = await jobSearch(data);
      if (result.jobs && result.jobs.length > 0) {
        setSearchResults(result.jobs);
        toast({ title: "Search Complete", description: `Found ${result.jobs.length} potential jobs.` });
      } else {
        toast({ title: "No Results", description: "Your search did not return any results. Try a different query." });
      }
    } catch (err) {
      console.error("Job search failed:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMessage);
      toast({ title: "Search Error", description: `Job search failed: ${errorMessage}`, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTailorResume = async (job: JobExtractionResult) => {
    if (!currentUser) { toast({ title: "Not Authenticated", variant: "destructive" }); return; }
    try {
        await enableNetwork(db);
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (!userDocSnap.exists()) {
            toast({ title: "Profile Not Found", description: "Please complete your profile first.", variant: "default" });
            router.push('/profile'); return;
        }
        const userProfile = userDocSnap.data() as UserProfile;
        const baseResumeText = profileToResumeText(userProfile);
        localStorage.setItem(TAILOR_RESUME_PREFILL_RESUME_KEY, baseResumeText);
        localStorage.setItem(TAILOR_RESUME_PREFILL_JD_KEY, job.markdown);
        router.push('/tailor-resume');
    } catch (error) {
        console.error("Error preparing for tailoring:", error);
        toast({ title: "Error", description: "Could not prepare data for resume tailoring.", variant: "destructive" });
    }
  };

  const handleCalculateMatch = async (jobUrl: string) => {
    if (!currentUser) { toast({ title: "Not Authenticated", variant: "destructive" }); return; }

    setSearchResults(prev => prev.map(job => job.url === jobUrl ? { ...job, isCalculatingMatch: true } : job));

    try {
        await enableNetwork(db);
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (!userDocSnap.exists()) {
            toast({ title: "Profile Not Found", description: "Complete your profile to calculate match scores.", variant: "default" });
            router.push('/profile');
            return;
        }
        const userProfile = userDocSnap.data() as UserProfile;
        const profileText = profileToResumeText(userProfile);
        const jobToMatch = searchResults.find(job => job.url === jobUrl);
        if (!jobToMatch) throw new Error("Job not found in results.");

        const matchResult = await calculateProfileJdMatch({ profileText, jobDescriptionText: jobToMatch.markdown });
        
        setSearchResults(prev => prev.map(job =>
            job.url === jobUrl ? { ...job, isCalculatingMatch: false, ...matchResult } : job
        ));

        toast({ title: "Match Score Calculated!", description: `${matchResult.matchCategory}: ${matchResult.matchPercentage}%` });

    } catch (error) {
        console.error("Error calculating match score:", error);
        toast({ title: "Match Calculation Error", description: error instanceof Error ? error.message : "An unknown error occurred.", variant: "destructive" });
        setSearchResults(prev => prev.map(job => job.url === jobUrl ? { ...job, isCalculatingMatch: false } : job));
    }
  };


  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold flex items-center">
          <Search className="mr-3 h-8 w-8 text-primary" /> AI Job Search
        </h1>
        <p className="text-muted-foreground">
          Use a natural language prompt to search for jobs across the web. Results powered by Firecrawl.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">New Job Search</CardTitle>
          <CardDescription>
            Enter a descriptive prompt to find relevant job postings. For example: "Find senior javascript roles in London posted in the last week".
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
                    <FormLabel>Search Prompt</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Research assistant jobs in neuroscience" {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} size="lg">
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Search className="mr-2 h-5 w-5" />}
                Search for Jobs
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive">
            <CardHeader>
                <CardTitle className="text-destructive">Search Failed</CardTitle>
                <CardDescription>{error}</CardDescription>
            </CardHeader>
        </Card>
      )}

      {searchResults.length > 0 && (
        <div className="space-y-6">
            <h2 className="font-headline text-2xl font-bold text-center">Search Results</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {searchResults.map((job, index) => (
                <Card key={job.url || index} className="flex flex-col">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <Briefcase className="h-8 w-8 text-primary mb-2" />
                        {job.url && (
                            <Button variant="ghost" size="icon" asChild>
                                <a href={job.url} target="_blank" rel="noopener noreferrer" title="View original posting">
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            </Button>
                        )}
                    </div>
                    <CardTitle className="font-headline text-xl">{job.title || 'Untitled Job Posting'}</CardTitle>
                    <CardDescription>{job.company || 'Company not specified'}</CardDescription>
                     {job.matchPercentage !== undefined && (
                        <div className="pt-2">
                           <p className="text-sm font-bold">{job.matchCategory}: {job.matchPercentage}%</p>
                           <p className="text-xs text-muted-foreground">{job.matchSummary}</p>
                        </div>
                    )}
                </CardHeader>
                <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground line-clamp-4">{job.markdown}</p>
                </CardContent>
                <CardFooter className="flex flex-col gap-2 items-stretch">
                    <Button 
                      variant="outline" 
                      onClick={() => handleCalculateMatch(job.url!)}
                      disabled={!currentUser || job.isCalculatingMatch || !job.url}
                    >
                      {job.isCalculatingMatch ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />}
                      Calculate CV Match
                    </Button>
                    <Button onClick={() => handleTailorResume(job)} disabled={!currentUser}>
                        <Sparkles className="mr-2 h-4 w-4" /> Tailor Resume
                    </Button>
                </CardFooter>
                </Card>
            ))}
            </div>
        </div>
      )}
    </div>
  );
}
