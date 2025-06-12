
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Rss, Search, Loader2, Briefcase, Building, FileText as FileTextIcon, CalendarDays, Percent, Sparkles as SparklesIcon, AlertTriangle, Link as LinkIcon, MapPin, ExternalLink, Filter, Tag, XCircle } from "lucide-react";
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
import { 
    PREDEFINED_RSS_FEEDS, 
    type RssFeed, 
    getFeedsByType, 
    getFeedCategoriesByType,
    getFeedDetailsByCategoryAndType,
    ALL_SUBJECT_AREAS_URL,
    ALL_LOCATIONS_URL
} from '@/lib/job-rss-feeds';

const USER_PROFILE_STORAGE_KEY = "userProfile";
const TAILOR_RESUME_PREFILL_JD_KEY = "tailorResumePrefillJD";

const LAST_SELECTED_SUBJECT_URL_KEY = "lastSelectedSubjectUrl_v2";
const LAST_SELECTED_LOCATION_URL_KEY = "lastSelectedLocationUrl_v2";
const LAST_KEYWORDS_KEY = "lastKeywords_v2";


const RssFiltersSchema = z.object({ 
  selectedSubjectUrl: z.string().optional(),
  selectedLocationUrl: z.string().optional(),
  keywords: z.string().optional(),
});
type RssFiltersData = z.infer<typeof RssFiltersSchema>;


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
  
  const [areFiltersLoaded, setAreFiltersLoaded] = useState(false);

  const filtersForm = useForm<RssFiltersData>({
    resolver: zodResolver(RssFiltersSchema),
    defaultValues: {
      selectedSubjectUrl: "",
      selectedLocationUrl: "",
      keywords: "",
    },
  });

  const subjectAreaFeeds = useMemo(() => getFeedCategoriesByType('subjectArea'), []);
  const locationFeeds = useMemo(() => getFeedCategoriesByType('location'), []);


  useEffect(() => {
    try {
      const storedProfileString = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
      if (storedProfileString) setUserProfile(JSON.parse(storedProfileString));
    } catch (error) {
      console.error("Failed to load user profile:", error);
      toast({ title: "Profile Load Error", variant: "destructive" });
    }
    setProfileLoaded(true);

    try {
      const lastSubject = localStorage.getItem(LAST_SELECTED_SUBJECT_URL_KEY);
      const lastLocation = localStorage.getItem(LAST_SELECTED_LOCATION_URL_KEY);
      const lastKeywords = localStorage.getItem(LAST_KEYWORDS_KEY);

      if (lastSubject) filtersForm.setValue("selectedSubjectUrl", lastSubject);
      if (lastLocation) filtersForm.setValue("selectedLocationUrl", lastLocation);
      if (lastKeywords) filtersForm.setValue("keywords", lastKeywords);
      
    } catch (error) {
      console.error("Failed to load last filters:", error);
    }
    setAreFiltersLoaded(true);
  }, [toast, filtersForm]);


  useEffect(() => {
    if (areFiltersLoaded) {
      const subscription = filtersForm.watch((value, { name }) => {
        try {
          if (name === "selectedSubjectUrl") localStorage.setItem(LAST_SELECTED_SUBJECT_URL_KEY, value.selectedSubjectUrl || "");
          if (name === "selectedLocationUrl") localStorage.setItem(LAST_SELECTED_LOCATION_URL_KEY, value.selectedLocationUrl || "");
          if (name === "keywords") localStorage.setItem(LAST_KEYWORDS_KEY, value.keywords || "");
        } catch (error) {
          console.warn("Could not save filters to localStorage", error);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [filtersForm, areFiltersLoaded]);


  const handleFetchAndProcessRss = async (data: RssFiltersData) => {
    setIsLoadingFeed(true);
    setIsProcessingItems(false);
    setJobPostings([]);
    setProcessingProgress(0);
    setTotalItemsToProcess(0);

    let targetRssUrl = "";
    let feedDescription = "";

    if (data.selectedSubjectUrl && data.selectedLocationUrl) {
        // This is complex. For now, we might prioritize subject or use a very general feed.
        // Or see if a combination exists (future improvement for job-rss-feeds.ts)
        // For now, let's try using subject if specific, else location, else general
        const subjectFeed = PREDEFINED_RSS_FEEDS.find(f => f.url === data.selectedSubjectUrl);
        const locationFeed = PREDEFINED_RSS_FEEDS.find(f => f.url === data.selectedLocationUrl);
        
        if (subjectFeed && subjectFeed.url !== ALL_SUBJECT_AREAS_URL) {
            targetRssUrl = subjectFeed.url;
            feedDescription = `subject: ${subjectFeed.name}`;
            if (locationFeed && locationFeed.url !== ALL_LOCATIONS_URL) {
                 feedDescription += ` & location: ${locationFeed.name} (location applied via keywords if possible)`;
            }
        } else if (locationFeed && locationFeed.url !== ALL_LOCATIONS_URL) {
            targetRssUrl = locationFeed.url;
            feedDescription = `location: ${locationFeed.name}`;
        } else {
            targetRssUrl = ALL_LOCATIONS_URL; // Most general if both are "Any" or error
            feedDescription = "general feed (all jobs)";
        }
    } else if (data.selectedSubjectUrl) {
        const feed = PREDEFINED_RSS_FEEDS.find(f => f.url === data.selectedSubjectUrl) || {url: ALL_SUBJECT_AREAS_URL, name: "Any Subject Area"};
        targetRssUrl = feed.url;
        feedDescription = `subject: ${feed.name}`;
    } else if (data.selectedLocationUrl) {
        const feed = PREDEFINED_RSS_FEEDS.find(f => f.url === data.selectedLocationUrl) || {url: ALL_LOCATIONS_URL, name: "Any Location"};
        targetRssUrl = feed.url;
        feedDescription = `location: ${feed.name}`;
    } else {
        targetRssUrl = ALL_LOCATIONS_URL; // Default to the most general feed
        feedDescription = "general feed (all jobs)";
    }
    
    if (!targetRssUrl) {
        toast({ title: "No Feed Selected", description: "Please select a subject area or location, or enter a URL manually.", variant: "default" });
        setIsLoadingFeed(false);
        return;
    }

    toast({ title: "Fetching RSS Feed...", description: `Fetching from ${feedDescription}` });

    let rawRssContentString = "";
    try {
      const fetchResponse = await fetch(`/api/fetch-rss?url=${encodeURIComponent(targetRssUrl)}`);
      let responseBodyAsText = '';
      try {
        responseBodyAsText = await fetchResponse.text();
      } catch (textError) {
        setIsLoadingFeed(false);
        throw new Error(`Failed to read response from API: ${textError instanceof Error ? textError.message : String(textError)}`);
      }

      if (!fetchResponse.ok) {
        try {
          const errorData = JSON.parse(responseBodyAsText);
          throw new Error(errorData.error || `API Error (${fetchResponse.status}): ${fetchResponse.statusText}`);
        } catch (e) {
          throw new Error(`API Error (${fetchResponse.status}): ${fetchResponse.statusText}. Response: ${responseBodyAsText.substring(0, 300)}...`);
        }
      }
      
      const contentType = fetchResponse.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        setIsLoadingFeed(false);
        throw new Error(`Expected JSON response from API, but received ${contentType || 'unknown content type'}. Response: ${responseBodyAsText.substring(0,500)}...`);
      }
      
      const responseData = JSON.parse(responseBodyAsText); 
      if (responseData.error) {
        setIsLoadingFeed(false);
        throw new Error(responseData.error);
      }
      if (!responseData.rawRssContent) {
        setIsLoadingFeed(false);
        throw new Error("API returned success but no rawRssContent found.");
      }
      rawRssContentString = responseData.rawRssContent;
      
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
        toast({ title: "No Job Items Found", description: "The RSS feed does not seem to contain any job items.", variant: "default" });
        return;
      }

      toast({ title: "Feed Fetched!", description: `Found ${itemXmls.length} items. Processing with AI...` });
      setIsProcessingItems(true);
      setTotalItemsToProcess(itemXmls.length);
      
      const initialProcessedJobs: JobPostingItem[] = [];
      for (let i = 0; i < itemXmls.length; i++) {
        const itemXml = itemXmls[i];
        try {
          const extractedDetails = await extractJobDetailsFromRssItem({ rssItemXml: itemXml });
          if (extractedDetails.role && extractedDetails.jobUrl) { 
            initialProcessedJobs.push({
              ...extractedDetails,
              id: `job-${Date.now()}-${i}`,
              isCalculatingMatch: !!userProfile, 
            });
          }
        } catch (extractionError) {
          console.error("Error processing RSS item with AI:", extractionError, itemXml.substring(0,100));
          toast({ title: `AI Error (Item ${i+1})`, description: `Skipping. ${extractionError instanceof Error ? extractionError.message : ''}`, variant: "destructive", duration: 3000 });
        }
        setProcessingProgress(i + 1);
      }
      
      let finalJobs = initialProcessedJobs;
      const keywordsToFilter = data.keywords?.trim().toLowerCase();
      if (keywordsToFilter) {
        const keywordArray = keywordsToFilter.split(/\s*,\s*|\s+/).filter(Boolean); 
        if (keywordArray.length > 0) {
            finalJobs = initialProcessedJobs.filter(job => {
            const searchableText = [
              job.role?.toLowerCase() || "",
              job.company?.toLowerCase() || "",
              job.requirementsSummary?.toLowerCase() || "",
              job.location?.toLowerCase() || "",
            ].join(" ");
            return keywordArray.every(kw => searchableText.includes(kw));
          });
          toast({ title: "Keywords Applied", description: `Filtered ${initialProcessedJobs.length} jobs down to ${finalJobs.length}.` });
        }
      }
      
      setJobPostings(finalJobs);
      toast({ title: "Jobs Processed!", description: `${finalJobs.length} jobs displayed from ${feedDescription}.` });

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
      setJobPostings(prev => prev.map(j => j.id === job.id ? { ...j, matchPercentage: 0, matchSummary: "Profile is empty.", matchCategory: "Poor Match", isCalculatingMatch: false } : j));
      return;
    }
    if(!job.requirementsSummary || job.requirementsSummary.trim().length < 10){
       setJobPostings(prev => prev.map(j => j.id === job.id ? { ...j, matchPercentage: 0, matchSummary: "Job summary missing.", matchCategory: "Poor Match", isCalculatingMatch: false } : j));
      return;
    }
    try {
      const matchResult = await calculateProfileJdMatch({ profileText, jobDescriptionText: job.requirementsSummary });
      setJobPostings(prev => prev.map(j => j.id === job.id ? { ...j, ...matchResult, isCalculatingMatch: false } : j));
    } catch (error) {
      console.error(`Error calculating match for job ${job.id}:`, error);
      setJobPostings(prev => prev.map(j => j.id === job.id ? { ...j, matchPercentage: 0, matchSummary: "Error calculating match.", matchCategory: "Poor Match", isCalculatingMatch: false } : j));
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
        toast({title: "Cannot Tailor", description: "Job requirements summary is missing.", variant: "destructive"});
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

  if (!profileLoaded || !areFiltersLoaded) { 
     return (
      <div className="container mx-auto py-8 text-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading settings...</p>
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
          Select a subject area and/or location to fetch jobs from `jobs.ac.uk` RSS feeds. Then add keywords to filter the results.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center"><Filter className="mr-2 h-5 w-5" />Configure Job Feed Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...filtersForm}>
            <form onSubmit={filtersForm.handleSubmit(handleFetchAndProcessRss)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={filtersForm.control}
                  name="selectedSubjectUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Filter by Subject Area</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || ""} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Any Subject Area" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-[400px] overflow-y-auto">
                            <SelectItem value="">Any Subject Area (General Feed)</SelectItem>
                            {subjectAreaFeeds.map(category => (
                                <SelectGroup key={category}>
                                    <SelectLabel>{category}</SelectLabel>
                                    {getFeedDetailsByCategoryAndType('subjectArea', category).map((feed) => (
                                        <SelectItem key={feed.url} value={feed.url}>
                                            {feed.categoryDetail}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={filtersForm.control}
                  name="selectedLocationUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Filter by Location</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || ""} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Any Location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-[400px] overflow-y-auto">
                           <SelectItem value="">Any Location (General Feed)</SelectItem>
                           {locationFeeds.map(category => (
                                <SelectGroup key={category}>
                                    <SelectLabel>{category}</SelectLabel>
                                    {getFeedDetailsByCategoryAndType('location', category).map((feed) => (
                                        <SelectItem key={feed.url} value={feed.url}>
                                            {feed.categoryDetail}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={filtersForm.control}
                name="keywords"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="keywordsInput">Add Keywords (comma or space separated)</FormLabel>
                    <FormControl>
                      <Input id="keywordsInput" placeholder="e.g. research, python, remote, lecturer" {...field} />
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
                {(isLoadingFeed) ? "Fetching..." : (isProcessingItems ? `Processing ${processingProgress}/${totalItemsToProcess}` : "Fetch & Display Jobs")}
              </Button>
            </form>
          </Form>
           {profileLoaded && !userProfile && (
                <p className="text-sm text-amber-600 mt-4 flex items-center">
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Your profile is not set up. CV matching will be disabled. <Button variant="link" size="sm" className="p-0 h-auto ml-1" onClick={() => router.push('/profile')}>Set up profile</Button>
                </p>
            )}
        </CardContent>
      </Card>

      {isProcessingItems && totalItemsToProcess > 0 && (
        <div className="w-full bg-muted rounded-full h-2.5 my-4">
            <div className="bg-primary h-2.5 rounded-full" style={{ width: `${(processingProgress / totalItemsToProcess) * 100}%` }}></div>
        </div>
      )}

      {jobPostings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Jobs from Feed</CardTitle>
            <CardDescription>
                Review jobs from the selected feed
                {filtersForm.getValues("keywords") ? ` (filtered by: "${filtersForm.getValues("keywords")}")` : ""}.
            </CardDescription>
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
                      <TableCell className="font-medium max-w-xs">
                        {job.jobUrl ? (
                          <a 
                            href={job.jobUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="hover:underline text-primary flex items-center group"
                            title={`View job: ${job.role}`}
                          >
                            <span className="truncate group-hover:whitespace-normal">{job.role || <span className="text-muted-foreground/70">N/A</span>}</span>
                             <ExternalLink className="inline-block ml-1.5 h-3.5 w-3.5 opacity-70 flex-shrink-0" />
                          </a>
                        ) : (
                          <span className="truncate">{job.role || <span className="text-muted-foreground/70">N/A</span>}</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">{job.company || <span className="text-muted-foreground/70">N/A</span>}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{job.location || <span className="text-muted-foreground/70">N/A</span>}</TableCell>
                      <TableCell className="max-w-xs">
                         <Tooltip>
                            <TooltipTrigger asChild>
                                <p className="truncate hover:whitespace-normal cursor-help">
                                  {job.requirementsSummary || <span className="text-muted-foreground/70">N/A</span>}
                                </p>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-md p-2 bg-popover text-popover-foreground">
                                <p className="text-sm font-medium">Full Requirements Summary:</p>
                                <p className="text-xs whitespace-pre-wrap">{job.requirementsSummary || "Not available."}</p>
                            </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="max-w-[120px] truncate">{job.deadlineText || <span className="text-muted-foreground/70">N/A</span>}</TableCell>
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
                                <p className="text-xs text-muted-foreground">{job.matchSummary || "No summary."}</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          userProfile ? <span className="text-xs text-muted-foreground">-</span> : 
                          <Tooltip><TooltipTrigger asChild><Badge variant="outline" className="cursor-help">N/A</Badge></TooltipTrigger><TooltipContent side="top"><p className="text-xs">Profile not set up.</p></TooltipContent></Tooltip>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleTailorResume(job)}
                          disabled={!userProfile || !profileLoaded || !job.requirementsSummary}
                          title={(!userProfile || !profileLoaded) ? "Set up profile to tailor" : (!job.requirementsSummary ? "Summary missing" : "Tailor resume")}
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

      {!isLoadingFeed && !isProcessingItems && jobPostings.length === 0 && filtersForm.formState.isSubmitted && (
         <Card className="text-center py-12">
            <CardHeader>
                <Rss className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <CardTitle className="font-headline text-2xl">No Jobs Found</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    No jobs were found in the feed for the selected criteria, or none matched your keywords: "{filtersForm.getValues("keywords")}". Please adjust filters or try different keywords.
                </p>
            </CardContent>
        </Card>
      )}
       {!isLoadingFeed && !isProcessingItems && jobPostings.length === 0 && !filtersForm.formState.isSubmitted && (
         <Card className="text-center py-12">
            <CardHeader>
                <Rss className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <CardTitle className="font-headline text-2xl">Select Filters to Begin</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    Choose a subject area and/or location, add keywords, then click "Fetch & Display Jobs".
                </p>
            </CardContent>
        </Card>
      )}
    </div>
    </TooltipProvider>
  );
}
