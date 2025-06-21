
"use client";

import React, { useState } from 'react';
import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, Briefcase, BarChart3, ArrowRight, ExternalLink } from "lucide-react";
import { useAuth } from '@/contexts/auth-context';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { JobPostingRssItem, JobDescriptionItem, UserProfile } from '@/lib/types';
import { profileToResumeText } from '@/lib/profile-utils';
import { PREDEFINED_RSS_FEEDS } from '@/lib/job-rss-feeds';
import { selectJobFeed } from '@/ai/flows/select-job-feed-flow';
import { extractJobDetailsFromRssItem } from '@/ai/flows/extract-rss-item-flow';
import { calculateProfileJdMatch } from '@/ai/flows/calculate-profile-jd-match-flow';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, enableNetwork, setDoc, Timestamp } from 'firebase/firestore';
import Link from 'next/link';


const TAILOR_RESUME_PREFILL_JD_KEY = "tailorResumePrefillJD";
const TAILOR_RESUME_PREFILL_RESUME_KEY = "tailorResumePrefillResume";

export default function JobSearchPage() {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [jobPostings, setJobPostings] = useState<JobPostingRssItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit } = useForm({
    defaultValues: {
      prompt: '',
    }
  });

  const parseRssXml = (xmlString: string): JobPostingRssItem[] => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, "text/xml");
      const items = xmlDoc.getElementsByTagName("item");
      const postings: JobPostingRssItem[] = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const title = item.getElementsByTagName("title")[0]?.textContent || "No Title";
        const link = item.getElementsByTagName("link")[0]?.textContent || "";
        const pubDate = item.getElementsByTagName("pubDate")[0]?.textContent || "";
        
        postings.push({
          id: `job-${Date.now()}-${i}`,
          title,
          link,
          pubDate,
          rssItemXml: new XMLSerializer().serializeToString(item),
        });
      }
      return postings;
    } catch (e) {
      console.error("Failed to parse RSS XML:", e);
      setError("The received RSS feed could not be parsed. It might not be a valid XML format.");
      return [];
    }
  };

  const processRssItemsWithAI = async (items: JobPostingRssItem[]) => {
    let processedCount = 0;
    const processingPromises = items.map(async (item) => {
      try {
        const aiDetails = await extractJobDetailsFromRssItem({ rssItemXml: item.rssItemXml });
        processedCount++;
        toast({
            title: `Processing... (${processedCount}/${items.length})`,
            description: `Extracted details for: ${aiDetails.role || 'a job'}.`,
            duration: 2000,
        });
        return {
          ...item,
          role: aiDetails.role,
          company: aiDetails.company,
          requirementsSummary: aiDetails.requirementsSummary,
          deadlineText: aiDetails.deadlineText,
          location: aiDetails.location,
          jobUrl: aiDetails.jobUrl,
        };
      } catch (aiError) {
        console.error("AI processing failed for item:", item.title, aiError);
        return { ...item, requirementsSummary: "Failed to extract details with AI." };
      }
    });

    const settledResults = await Promise.allSettled(processingPromises);
    const successfullyProcessed = settledResults
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<JobPostingRssItem>).value);
    
    setJobPostings(successfullyProcessed);
  };
  
  const onSubmit = async (data: { prompt: string }) => {
    if (!currentUser) { toast({ title: "Not Authenticated", variant: "destructive" }); return; }
    if (!data.prompt) { toast({ title: "No Prompt Provided", description: "Please describe the job you're looking for." }); return; }

    setIsLoading(true);
    setError(null);
    setJobPostings([]);
    toast({ title: "Thinking...", description: "AI is selecting the best job feed for your request." });

    try {
       // Step 1: AI selects the feed
       const feedSelection = await selectJobFeed({
         userPrompt: data.prompt,
         availableFeeds: PREDEFINED_RSS_FEEDS,
       });

       toast({ title: "Feed Selected!", description: feedSelection.reasoning || `Using feed: ${feedSelection.selectedFeedUrl}` });

       // Step 2: Fetch the selected feed
      const response = await fetch(`/api/fetch-rss?url=${encodeURIComponent(feedSelection.selectedFeedUrl)}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch RSS feed: ${response.statusText}`);
      }
      const { rawRssContent } = await response.json();
      if (!rawRssContent) {
        throw new Error("Received empty content from RSS feed.");
      }
      const parsedItems = parseRssXml(rawRssContent);
      if (parsedItems.length > 0) {
        setJobPostings(parsedItems); // Show skeletal cards immediately
        await processRssItemsWithAI(parsedItems); // Then enrich with AI
      } else {
        toast({ title: "No Jobs Found", description: "The selected feed did not contain any job postings." });
      }
    } catch (err) {
      console.error("Job search failed:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMessage);
      toast({ title: "Search Error", description: `Failed to fetch or process job feed: ${errorMessage}`, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCalculateMatchScore = async (jobId: string) => {
    if (!currentUser) { toast({ title: "Not Authenticated", variant: "destructive" }); return; }
    
    setJobPostings(prev => prev.map(job => job.id === jobId ? { ...job, isCalculatingMatch: true } : job));

    try {
      await enableNetwork(db);
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        toast({ title: "Profile Not Found", description: "Please complete your profile first.", variant: "default" });
        router.push('/profile'); return;
      }
      const userProfile = userDocSnap.data() as UserProfile;
      const profileText = profileToResumeText(userProfile);
      if (!profileText.trim()) {
         toast({ title: "Profile Incomplete", description: "Your profile is empty. Please complete it first." });
         router.push('/profile'); return;
      }

      const currentJob = jobPostings.find(job => job.id === jobId);
      if (!currentJob?.requirementsSummary) {
        toast({ title: "Job Details Missing", description: "Cannot calculate match without job details.", variant: "destructive" });
        return;
      }

      const matchResult = await calculateProfileJdMatch({ profileText, jobDescriptionText: currentJob.requirementsSummary });

      setJobPostings(prev => prev.map(job => 
        job.id === jobId 
        ? { ...job, matchPercentage: matchResult.matchPercentage, matchSummary: matchResult.matchSummary, matchCategory: matchResult.matchCategory } 
        : job
      ));
      toast({ title: "Match Score Calculated!", description: `${matchResult.matchPercentage}% for "${currentJob.role || currentJob.title}"` });

    } catch (error) {
        console.error("Error calculating match score:", error);
        toast({ title: "Match Score Error", description: `Calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`, variant: "destructive" });
    } finally {
        setJobPostings(prev => prev.map(job => job.id === jobId ? { ...job, isCalculatingMatch: false } : job));
    }
  };
  
  const handleTailorResume = async (job: JobPostingRssItem) => {
    if (!currentUser) { toast({ title: "Not Authenticated", variant: "destructive" }); return; }
    if (!job.requirementsSummary) { toast({ title: "Job Details Missing", description: "Please wait for AI to extract job details before tailoring.", variant: "default" }); return; }
    
    try {
      await enableNetwork(db);
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        toast({ title: "Profile Not Found", description: "Please complete your profile first." });
        router.push('/profile'); return;
      }
      const userProfile = userDocSnap.data() as UserProfile;
      const baseResumeText = profileToResumeText(userProfile);
      
      localStorage.setItem(TAILOR_RESUME_PREFILL_RESUME_KEY, baseResumeText);
      localStorage.setItem(TAILOR_RESUME_PREFILL_JD_KEY, job.requirementsSummary);

      const jobDataToSave: Omit<JobDescriptionItem, 'id' | 'createdAt'> & { createdAt: Timestamp, userId: string } = {
        title: job.role || job.title,
        company: job.company || 'Unknown',
        description: job.requirementsSummary,
        createdAt: Timestamp.now(),
        userId: currentUser.uid,
        matchPercentage: job.matchPercentage,
        matchSummary: job.matchSummary,
        matchCategory: job.matchCategory,
      };

      const newJdId = `jd-${Date.now()}`;
      const jdDocRef = doc(db, "users", currentUser.uid, "jobDescriptions", newJdId);
      await setDoc(jdDocRef, { ...jobDataToSave, id: newJdId });
      toast({ title: "Job Saved!", description: `Saved "${job.role || job.title}" to Jobs to Apply page.` });

      router.push('/tailor-resume');
    } catch (error) {
        console.error("Error preparing for tailoring:", error);
        toast({ title: "Error", description: `Could not prepare for tailoring: ${error instanceof Error ? error.message : 'Unknown error'}`, variant: "destructive" });
    }
  };
  
  const getMatchBadgeVariant = (category?: JobPostingRssItem['matchCategory']): "default" | "secondary" | "destructive" | "outline" => {
    if (!category) return "outline";
    switch (category) {
        case "Excellent Match": return "default";
        case "Good Match": return "secondary";
        case "Fair Match": return "outline";
        case "Poor Match": return "destructive";
        default: return "outline";
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold flex items-center">
          <Search className="mr-3 h-8 w-8 text-primary" /> AI Job Search Assistant
        </h1>
        <p className="text-muted-foreground">
          Describe the job you're looking for, and our AI assistant will find relevant openings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Find Your Next Job</CardTitle>
          <CardDescription>
            Tell us what you're looking for in natural language. For example: "I'm looking for a senior research fellow position in quantum physics in Cambridge, UK."
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="job-prompt">Your Job Request</Label>
              <Controller
                name="prompt"
                control={control}
                render={({ field }) => (
                  <Textarea
                    id="job-prompt"
                    placeholder="e.g., Post-doc in machine learning, focusing on NLP, in London..."
                    rows={3}
                    {...field}
                  />
                )}
              />
            </div>
            <Button type="submit" disabled={isLoading || !currentUser} size="lg">
              {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Search className="mr-2 h-5 w-5" />}
              Search for Jobs
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && <Card className="border-destructive"><CardHeader><CardTitle className="text-destructive">Search Failed</CardTitle><CardDescription>{error}</CardDescription></CardHeader></Card>}

      {jobPostings.length > 0 && (
        <div className="space-y-6">
          <h2 className="font-headline text-2xl font-bold text-center">Job Listings</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jobPostings.map((job) => (
              <Card key={job.id} className="flex flex-col">
                <CardHeader>
                  <Briefcase className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="font-headline text-xl">{job.role || job.title}</CardTitle>
                  <CardDescription>{job.company || (job.role ? "" : "Extracting details...")}</CardDescription>
                  {job.matchPercentage !== undefined && (
                    <span className={`px-2 py-0.5 text-xs rounded-full border ${getMatchBadgeVariant(job.matchCategory)}`}>
                        {job.matchCategory}: {job.matchPercentage}%
                    </span>
                  )}
                </CardHeader>
                <CardContent className="flex-grow">
                  {job.requirementsSummary ? (
                    <p className="text-sm text-muted-foreground line-clamp-4">{job.requirementsSummary}</p>
                  ) : (
                    <div className="space-y-2"><div className="h-2 bg-muted rounded w-full"></div><div className="h-2 bg-muted rounded w-5/6"></div><div className="h-2 bg-muted rounded w-4/6"></div></div>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col gap-2 items-stretch">
                   <Button asChild variant="secondary">
                      <Link href={job.jobUrl || job.link} target="_blank" rel="noopener noreferrer">
                        View Original Post <ExternalLink className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                   <Button variant="outline" onClick={() => handleCalculateMatchScore(job.id)} disabled={!job.requirementsSummary || !!job.isCalculatingMatch}>
                     {job.isCalculatingMatch ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <BarChart3 className="mr-2 h-4 w-4" />}
                     Calculate CV Match
                   </Button>
                   <Button onClick={() => handleTailorResume(job)} disabled={!job.requirementsSummary}>
                     Tailor Resume <ArrowRight className="ml-2 h-4 w-4"/>
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
