
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Rss, Search, Loader2, Briefcase, Building, FileText as FileTextIcon, CalendarDays, Percent, Sparkles as SparklesIcon, AlertTriangle, Link as LinkIcon, MapPin, ExternalLink } from "lucide-react";
import { useRouter } from 'next/navigation';
import type { JobPostingItem, UserProfile } from "@/lib/types";
import { z } from "zod"; 
import { extractJobDetailsFromRssItem } from "@/ai/flows/extract-rss-item-flow";
import { calculateProfileJdMatch } from "@/ai/flows/calculate-profile-jd-match-flow";
import { profileToResumeText } from '@/lib/profile-utils';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const USER_PROFILE_STORAGE_KEY = "userProfile";
const TAILOR_RESUME_PREFILL_JD_KEY = "tailorResumePrefillJD";
const LAST_RSS_URL_STORAGE_KEY = "lastRssUrl";


const RssFormSchema = z.object({ 
  rssUrl: z.string().url("Please enter a valid RSS feed URL."),
});
type RssFormData = z.infer<typeof RssFormSchema>;


export default function JobsRssPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [jobPostings, setJobPostings] = useState<JobPostingItem[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);
  const [isProcessingItems, setIsProcessingItems] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [totalItemsToProcess, setTotalItemsToProcess] = useState(0);
  
  const rssForm = useForm<RssFormData>({
    resolver: zodResolver(RssFormSchema),
    defaultValues: {
      rssUrl: "",
    },
  });

  useEffect(() => {
    try {
      const storedProfileString = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
      if (storedProfileString) {
        setUserProfile(JSON.parse(storedProfileString));
      }
    } catch (error) {
      console.error("Failed to load user profile from localStorage:", error);
      toast({ title: "Profile Load Error", description: "Could not load your profile for CV matching.", variant: "destructive" });
    }
    setProfileLoaded(true);

    try {
        const lastUrl = localStorage.getItem(LAST_RSS_URL_STORAGE_KEY);
        if (lastUrl) {
            rssForm.setValue("rssUrl", lastUrl);
        }
    } catch (error) {
        console.error("Failed to load last RSS URL from localStorage:", error);
    }

  }, [toast, rssForm]);

  const handleFetchAndProcessRss = async (data: RssFormData) => {
    setIsLoadingFeed(true);
    setIsProcessingItems(false);
    setJobPostings([]);
    setProcessingProgress(0);
    setTotalItemsToProcess(0);
    toast({ title: "Fetching RSS Feed...", description: `Fetching content from ${data.rssUrl}` });

    try {
        localStorage.setItem(LAST_RSS_URL_STORAGE_KEY, data.rssUrl);
    } catch (error) {
        console.warn("Could not save last RSS URL to localStorage", error);
    }

    let rawRssContentString = "";
    try {
      const fetchResponse = await fetch(`/api/fetch-rss?url=${encodeURIComponent(data.rssUrl)}`);
      
      let responseBodyAsText;
      try {
        responseBodyAsText = await fetchResponse.text(); // Always get text first
      } catch (textError) {
        setIsLoadingFeed(false);
        throw new Error(`Failed to read response from API: ${textError instanceof Error ? textError.message : String(textError)}`);
      }

      if (!fetchResponse.ok) {
        // Try to parse the error body as JSON, but fallback if it's not (e.g. HTML error page)
        try {
          const errorData = JSON.parse(responseBodyAsText);
          throw new Error(errorData.error || `API Error (${fetchResponse.status}): ${fetchResponse.statusText}`);
        } catch (e) {
          throw new Error(`API Error (${fetchResponse.status}): ${fetchResponse.statusText}. Response: ${responseBodyAsText.substring(0, 300)}...`);
        }
      }

      // If response.ok is true, try to parse as JSON, assuming success path from API
      try {
        const responseData = JSON.parse(responseBodyAsText);
        if (responseData.error) { // Our API might return 200 OK with a JSON error object
          throw new Error(responseData.error);
        }
        if (!responseData.rawRssContent) {
          throw new Error("API returned success but no rawRssContent found.");
        }
        rawRssContentString = responseData.rawRssContent;
      } catch (e) {
        setIsLoadingFeed(false);
        throw new Error(`Failed to parse successful API response. Expected JSON with rawRssContent. Received: ${responseBodyAsText.substring(0,300)}...`);
      }
      
      setIsLoadingFeed(false);

      if (!rawRssContentString) {
        toast({ title: "No Content Fetched", description: "The RSS URL did not return any content via the API.", variant: "default" });
        return;
      }
      
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      let match;
      const itemXmls: string[] = [];
      while ((match = itemRegex.exec(rawRssContentString)) !== null) {
        itemXmls.push(match[0]);
      }

      if (itemXmls.length === 0) {
        toast({ title: "No Job Items Found", description: "The RSS feed does not seem to contain any job items in the expected format.", variant: "default" });
        return;
      }

      toast({ title: "Feed Fetched!", description: `Found ${itemXmls.length} items. Processing them with AI...` });
      setIsProcessingItems(true);
      setTotalItemsToProcess(itemXmls.length);
      
      const processedJobs: JobPostingItem[] = [];
      for (let i = 0; i < itemXmls.length; i++) {
        const itemXml = itemXmls[i];
        try {
          const extractedDetails = await extractJobDetailsFromRssItem({ rssItemXml: itemXml });
          if (extractedDetails.role && extractedDetails.jobUrl) { // Basic validation
            processedJobs.push({
              ...extractedDetails,
              id: `job-${Date.now()}-${i}`,
              isCalculatingMatch: !!userProfile, 
            });
          } else {
             console.warn("Skipped RSS item due to missing role or jobUrl after AI extraction:", itemXml.substring(0,100));
          }
        } catch (extractionError) {
          console.error("Error processing RSS item with AI:", extractionError, itemXml.substring(0,100));
          toast({ title: `AI Processing Error (Item ${i+1})`, description: `Could not process an item. Skipping. ${extractionError instanceof Error ? extractionError.message : ''}`, variant: "destructive", duration: 5000 });
        }
        setProcessingProgress(i + 1);
      }
      
      setJobPostings(processedJobs);
      toast({ title: "Jobs Processed!", description: `${processedJobs.length} jobs extracted and displayed.` });

    } catch (err) {
      console.error("Error in handleFetchAndProcessRss:", err);
      let errorMessage = "Could not process the RSS feed.";
      if (err instanceof Error) errorMessage = err.message;
      toast({ title: "RSS Processing Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoadingFeed(false);
      setIsProcessingItems(false);
    }
  };

  const calculateMatchForJob = useCallback(async (job: JobPostingItem, profileText: string) => {
    if (!profileText.trim()) {
      setJobPostings(prev => prev.map(j => j.id === job.id ? { ...j, matchPercentage: 0, matchSummary: "Profile is empty. Cannot calculate match.", matchCategory: "Poor Match", isCalculatingMatch: false } : j));
      return;
    }
    if(!job.requirementsSummary || job.requirementsSummary.trim().length < 10){
       setJobPostings(prev => prev.map(j => j.id === job.id ? { ...j, matchPercentage: 0, matchSummary: "Job requirements summary is too short or missing.", matchCategory: "Poor Match", isCalculatingMatch: false } : j));
      return;
    }
    
    try {
      const matchResult = await calculateProfileJdMatch({
        profileText: profileText,
        jobDescriptionText: job.requirementsSummary,
      });
      setJobPostings(prev =>
        prev.map(j =>
          j.id === job.id
            ? { ...j, ...matchResult, isCalculatingMatch: false }
            : j
        )
      );
    } catch (error) {
      console.error(`Error calculating match score for job ${job.id}:`, error);
      setJobPostings(prev =>
        prev.map(j =>
          j.id === job.id
            ? { ...j, matchPercentage: 0, matchSummary: "Error calculating match.", matchCategory: "Poor Match", isCalculatingMatch: false }
            : j
        )
      );
    }
  }, []);

  useEffect(() => {
    if (jobPostings.length > 0 && userProfile && profileLoaded) {
      const profileText = profileToResumeText(userProfile);
      jobPostings.forEach(job => {
        if (job.isCalculatingMatch && typeof job.matchPercentage === 'undefined') {
          calculateMatchForJob(job, profileText);
        }
      });
    }
  }, [jobPostings, userProfile, profileLoaded, calculateMatchForJob]);

  const handleTailorResume = (job: JobPostingItem) => {
    if(!job.requirementsSummary) {
        toast({title: "Cannot Tailor", description: "Job requirements summary is missing for this item.", variant: "destructive"});
        return;
    }
    localStorage.setItem(TAILOR_RESUME_PREFILL_JD_KEY, job.requirementsSummary);
    router.push('/tailor-resume');
  };

  const getMatchBadgeVariant = (category?: JobPostingItem['matchCategory']): "default" | "secondary" | "destructive" | "outline" => {
    if (!category) return "outline";
    switch (category) {
        case "Excellent Match": return "default";
        case "Good Match": return "secondary";
        case "Fair Match": return "outline";
        case "Poor Match": return "destructive";
        default: return "outline";
    }
  };

  if (!profileLoaded) { 
     return (
      <div className="container mx-auto py-8 text-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold flex items-center">
          <Rss className="mr-3 h-8 w-8 text-primary" /> AI Powered RSS Job Feed
        </h1>
        <p className="text-muted-foreground">
          Paste a job RSS feed URL. AI will parse the items, and you can match them with your profile and tailor applications.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center"><Search className="mr-2 h-5 w-5" />Enter RSS Feed URL</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...rssForm}>
            <form onSubmit={rssForm.handleSubmit(handleFetchAndProcessRss)} className="flex flex-col sm:flex-row items-start gap-2">
              <FormField
                control={rssForm.control}
                name="rssUrl"
                render={({ field }) => (
                  <FormItem className="flex-grow w-full sm:w-auto">
                    <FormLabel htmlFor="rssUrlInput" className="sr-only">RSS Feed URL</FormLabel>
                    <FormControl>
                      <Input id="rssUrlInput" placeholder="https://example.com/jobs.rss" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoadingFeed || isProcessingItems} size="lg" className="w-full sm:w-auto">
                {(isLoadingFeed || isProcessingItems) ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Search className="mr-2 h-5 w-5" />
                )}
                {(isLoadingFeed) ? "Fetching..." : (isProcessingItems ? `Processing ${processingProgress}/${totalItemsToProcess}` : "Fetch Jobs")}
              </Button>
            </form>
          </Form>
           {!profileLoaded && <p className="text-sm text-muted-foreground mt-2">Loading profile for matching...</p>}
           {profileLoaded && !userProfile && (
                <p className="text-sm text-amber-600 mt-3 flex items-center">
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Your profile is not set up. CV matching will be disabled. <Button variant="link" size="sm" className="p-0 h-auto ml-1" onClick={() => router.push('/profile')}>Set up profile</Button>
                </p>
            )}
        </CardContent>
      </Card>

      {isProcessingItems && totalItemsToProcess > 0 && (
        <div className="w-full bg-muted rounded-full h-2.5 dark:bg-gray-700 my-4">
            <div className="bg-primary h-2.5 rounded-full" style={{ width: `${(processingProgress / totalItemsToProcess) * 100}%` }}></div>
        </div>
      )}

      {jobPostings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Jobs from Feed</CardTitle>
            <CardDescription>Review the jobs extracted from the RSS feed.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead><Briefcase className="inline-block mr-1 h-4 w-4" />Role</TableHead>
                    <TableHead><Building className="inline-block mr-1 h-4 w-4" />Company</TableHead>
                    <TableHead><MapPin className="inline-block mr-1 h-4 w-4" />Location</TableHead>
                    <TableHead><FileTextIcon className="inline-block mr-1 h-4 w-4" />Requirements</TableHead>
                    <TableHead><CalendarDays className="inline-block mr-1 h-4 w-4" />Deadline/Posted</TableHead>
                    <TableHead className="text-center"><Percent className="inline-block mr-1 h-4 w-4" />CV Match</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobPostings.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">
                        {job.jobUrl ? (
                          <a 
                            href={job.jobUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="hover:underline text-primary flex items-center"
                            title={`View job: ${job.role}`}
                          >
                            {job.role || <span className="text-muted-foreground/70">N/A</span>} <ExternalLink className="inline-block ml-1.5 h-3.5 w-3.5 opacity-70" />
                          </a>
                        ) : (
                          job.role || <span className="text-muted-foreground/70">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>{job.company || <span className="text-muted-foreground/70">N/A</span>}</TableCell>
                      <TableCell>{job.location || <span className="text-muted-foreground/70">N/A</span>}</TableCell>
                      <TableCell className="max-w-xs">
                         <Tooltip>
                            <TooltipTrigger asChild>
                                <p className="truncate hover:whitespace-normal cursor-help">
                                  {job.requirementsSummary || <span className="text-muted-foreground/70">N/A</span>}
                                </p>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-md p-2 bg-popover text-popover-foreground">
                                <p className="text-sm font-medium">Full Requirements Summary:</p>
                                <p className="text-xs">{job.requirementsSummary || "Not available."}</p>
                            </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell>{job.deadlineText || <span className="text-muted-foreground/70">N/A</span>}</TableCell>
                      <TableCell className="text-center">
                        {job.isCalculatingMatch ? (
                          <Loader2 className="h-4 w-4 animate-spin mx-auto text-primary" />
                        ) : typeof job.matchPercentage === 'number' ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                                <Badge variant={getMatchBadgeVariant(job.matchCategory)} className="cursor-default">
                                    {job.matchCategory}: {job.matchPercentage}%
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs p-2">
                                <p className="text-sm font-medium">Match Summary:</p>
                                <p className="text-xs text-muted-foreground">{job.matchSummary || "No summary available."}</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          userProfile ? <span className="text-xs text-muted-foreground">-</span> : 
                          <Tooltip>
                            <TooltipTrigger asChild>
                               <Badge variant="outline" className="cursor-help">N/A</Badge>
                            </TooltipTrigger>
                             <TooltipContent side="top"><p className="text-xs">Profile not set up for matching.</p></TooltipContent>
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleTailorResume(job)}
                          disabled={!userProfile || !profileLoaded || !job.requirementsSummary}
                          title={(!userProfile || !profileLoaded) ? "Set up your profile to enable tailoring" : (!job.requirementsSummary ? "Requirements summary missing" : "Tailor your resume for this job")}
                        >
                          <SparklesIcon className="mr-2 h-4 w-4" /> Tailor
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

       {(isLoadingFeed || (isProcessingItems && jobPostings.length === 0)) && (
         <div className="text-center py-12">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">
                {isLoadingFeed ? "Fetching RSS feed..." : `Processing job items: ${processingProgress} / ${totalItemsToProcess}...`}
            </p>
        </div>
      )}

      {!isLoadingFeed && !isProcessingItems && jobPostings.length === 0 && rssForm.formState.isSubmitted && (
         <Card className="text-center py-12">
            <CardHeader>
                <Rss className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <CardTitle className="font-headline text-2xl">No Jobs Found in Feed</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    The RSS feed was fetched, but no job items could be extracted, or the feed was empty. Please check the URL or try a different feed.
                </p>
            </CardContent>
        </Card>
      )}
       {!isLoadingFeed && !isProcessingItems && jobPostings.length === 0 && !rssForm.formState.isSubmitted && (
         <Card className="text-center py-12">
            <CardHeader>
                <Rss className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <CardTitle className="font-headline text-2xl">Enter an RSS Feed URL</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    Paste a job RSS feed URL above to start discovering opportunities.
                </p>
            </CardContent>
        </Card>
      )}
    </div>
    </TooltipProvider>
  );
}
