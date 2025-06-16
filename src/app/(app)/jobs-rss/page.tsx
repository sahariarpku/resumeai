
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { Rss, Search, Loader2, Briefcase, FileText as FileTextIcon, CalendarDays, Percent, Sparkles as SparklesIcon, ExternalLink, MapPin, ArrowRight } from "lucide-react";
import { useRouter } from 'next/navigation';
import type { JobPostingRssItem, UserProfile, JobDescriptionItem } from "@/lib/types";
import { z } from "zod";
import { extractJobDetailsFromRssItem, type ExtractRssItemOutput } from "@/ai/flows/extract-rss-item-flow";
import { extractTextFromHtml } from "@/ai/flows/extract-text-from-html-flow";
import { extractJobDetails } from "@/ai/flows/extract-job-details-flow";
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
    getFeedCategoriesByType,
    getFeedDetailsByCategoryAndType,
    ALL_SUBJECT_AREAS_URL,
    ALL_LOCATIONS_URL
} from '@/lib/job-rss-feeds';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, enableNetwork } from "firebase/firestore";

const LAST_SELECTED_SUBJECT_URL_KEY = "lastSelectedSubjectUrl_v2";
const LAST_SELECTED_LOCATION_URL_KEY = "lastSelectedLocationUrl_v2";
const LAST_KEYWORDS_KEY = "lastKeywords_v2";
const TAILOR_RESUME_PREFILL_JD_KEY = "tailorResumePrefillJD";
const TAILOR_RESUME_PREFILL_RESUME_KEY = "tailorResumePrefillResume";

const RssFiltersSchema = z.object({
  selectedSubjectUrl: z.string().optional(),
  selectedLocationUrl: z.string().optional(),
  keywords: z.string().optional(),
});
type RssFiltersData = z.infer<typeof RssFiltersSchema>;

// Top-level helper function
function parseBasicRssItem(itemXml: string, clientGeneratedId: string): JobPostingRssItem {
  const extractText = (xml: string, tag: string): string | null => {
    const match = xml.match(new RegExp(`<${tag}(?:\\s+[^>]*?)?>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 's'));
    return match && match[1] ? match[1].trim() : null;
  };

  let parsedTitle = extractText(itemXml, 'title') || `Job Item ${clientGeneratedId}`;
  let parsedLink = extractText(itemXml, 'link') || '#';
  let parsedPubDate = extractText(itemXml, 'pubDate');
  let parsedGuid = extractText(itemXml, 'guid') || clientGeneratedId;

  // Ensure GUID is unique if it's just the link and doesn't have our prefix
  if (parsedGuid === parsedLink && !parsedGuid.startsWith('rssjob-')) {
      parsedGuid = `${clientGeneratedId}-${parsedGuid}`;
  }

  return {
    id: parsedGuid,
    title: parsedTitle,
    link: parsedLink,
    pubDate: parsedPubDate ? new Date(parsedPubDate).toISOString() : new Date().toISOString(),
    rssItemXml: itemXml,
    requirementsSummary: 'Select and process for full details.', // Default summary
    role: parsedTitle, // Default role to title
    company: undefined,
    deadlineText: undefined,
    location: undefined,
    jobUrl: parsedLink, // Default jobUrl to link
  };
}


export default function JobsRssPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { currentUser } = useAuth();

  const [jobPostings, setJobPostings] = useState<JobPostingRssItem[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);
  const [areFiltersLoaded, setAreFiltersLoaded] = useState(false);
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());
  const [processingProgress, setProcessingProgress] = useState(0);
  const [totalToProcess, setTotalToProcess] = useState(0);
  const [tailoringJobId, setTailoringJobId] = useState<string | null>(null);


  const filtersForm = useForm<RssFiltersData>({
    resolver: zodResolver(RssFiltersSchema),
    defaultValues: {
      selectedSubjectUrl: ALL_SUBJECT_AREAS_URL,
      selectedLocationUrl: ALL_LOCATIONS_URL,
      keywords: "",
    },
  });

  const subjectAreaFeeds = getFeedCategoriesByType('subjectArea');
  const locationFeeds = getFeedCategoriesByType('location');


  useEffect(() => {
    try {
      const lastSubject = localStorage.getItem(LAST_SELECTED_SUBJECT_URL_KEY);
      const lastLocation = localStorage.getItem(LAST_SELECTED_LOCATION_URL_KEY);
      const lastKeywords = localStorage.getItem(LAST_KEYWORDS_KEY);

      filtersForm.reset({
        selectedSubjectUrl: lastSubject || ALL_SUBJECT_AREAS_URL,
        selectedLocationUrl: lastLocation || ALL_LOCATIONS_URL,
        keywords: lastKeywords || "",
      });
    } catch (error) {
      // Non-critical error, okay to ignore for parsing
    }
    setAreFiltersLoaded(true);
  }, [filtersForm]);

  const watchedSubjectUrl = filtersForm.watch("selectedSubjectUrl");
  const watchedLocationUrl = filtersForm.watch("selectedLocationUrl");
  const watchedKeywords = filtersForm.watch("keywords");

  useEffect(() => {
    if (areFiltersLoaded) {
      try {
        localStorage.setItem(LAST_SELECTED_SUBJECT_URL_KEY, watchedSubjectUrl || ALL_SUBJECT_AREAS_URL);
        localStorage.setItem(LAST_SELECTED_LOCATION_URL_KEY, watchedLocationUrl || ALL_LOCATIONS_URL);
        localStorage.setItem(LAST_KEYWORDS_KEY, watchedKeywords || "");
      } catch (error) {
        // Non-critical error, okay to ignore for parsing
      }
    }
  }, [watchedSubjectUrl, watchedLocationUrl, watchedKeywords, areFiltersLoaded]);

  const handleFetchRssFeed = useCallback(async (data: RssFiltersData) => {
    setIsLoadingFeed(true);
    setJobPostings([]);
    setSelectedJobIds(new Set());
    setProcessingProgress(0);
    setTotalToProcess(0);
    toast({ title: "Fetching RSS Feed (Simplified for Diagnosis)..." });

    // Simulate a delay and set empty job postings for now to test parsing
    await new Promise(resolve => setTimeout(resolve, 100));
    setJobPostings([]); 
    
    setIsLoadingFeed(false);
    toast({ title: "RSS Feed Action Completed (Simplified)" });
  }, [toast, setIsLoadingFeed, setJobPostings, setSelectedJobIds, setProcessingProgress, setTotalToProcess]);


  useEffect(() => {
    if (areFiltersLoaded) {
      const currentFilters: RssFiltersData = {
        selectedSubjectUrl: watchedSubjectUrl || ALL_SUBJECT_AREAS_URL,
        selectedLocationUrl: watchedLocationUrl || ALL_LOCATIONS_URL,
        keywords: watchedKeywords || "",
      };
      // IIFE to call async function
      (async () => {
        await handleFetchRssFeed(currentFilters);
      })();
    }
  }, [areFiltersLoaded, watchedSubjectUrl, watchedLocationUrl, watchedKeywords, handleFetchRssFeed]);


  const fetchUserProfile = useCallback(async (): Promise<UserProfile | null> => {
    toast({ title: "fetchUserProfile (Simplified)"});
    if (!currentUser) { return null; }
    return { id: currentUser.uid, fullName: 'Test User', workExperiences: [], projects: [], education: [], skills: [], certifications: [], honorsAndAwards: [], publications: [], references: [], customSections: [] };
  }, [currentUser, toast]);

  const fetchAndSetJobDetailsFromRssXml = useCallback(async (jobId: string): Promise<JobPostingRssItem | null> => {
    toast({ title: "fetchAndSetJobDetailsFromRssXml (Simplified)", description: `Job ID: ${jobId}`});
    // Simulate finding and updating a job
    setJobPostings(prev => prev.map(j => j.id === jobId ? {...j, company: "Simulated Company"} : j));
    return jobPostings.find(j => j.id === jobId) || null;
  }, [toast, setJobPostings, jobPostings]);

  const handleProcessSelectedJobs = useCallback(async () => {
    toast({ title: "handleProcessSelectedJobs (Simplified)" });
    // Simulate processing
    setProcessingProgress(selectedJobIds.size);
    setTotalToProcess(selectedJobIds.size);
    await new Promise(resolve => setTimeout(resolve, 100));
    setJobPostings(prev => prev.map(j => selectedJobIds.has(j.id) ? {...j, matchPercentage: 50, matchCategory: "Fair Match", matchSummary: "Simulated match."} : j));
    setTotalToProcess(0);
  }, [toast, selectedJobIds, setProcessingProgress, setTotalToProcess, setJobPostings]);

  const handleSelectJob = (jobId: string, checked: boolean) => {
    setSelectedJobIds(prev => {
      const newSet = new Set(prev);
      if (checked) newSet.add(jobId);
      else newSet.delete(jobId);
      return newSet;
    });
  };

  const handleSelectAllJobs = (checked: boolean) => {
    if (checked) {
      setSelectedJobIds(new Set(jobPostings.map(job => job.id)));
    } else {
      setSelectedJobIds(new Set());
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

  const handleTailorCvForJob = useCallback(async (jobId: string) => {
    toast({ title: "handleTailorCvForJob (Simplified)", description: `Job ID: ${jobId}`});
    // Simulate tailoring and redirect
    localStorage.setItem(TAILOR_RESUME_PREFILL_JD_KEY, "Simulated detailed job description.");
    localStorage.setItem(TAILOR_RESUME_PREFILL_RESUME_KEY, "Simulated base resume from profile.");
    router.push('/tailor-resume');
  }, [toast, router]);

  const handleProcessSingleJobMatch = useCallback(async (jobId: string) => {
    toast({ title: "handleProcessSingleJobMatch (Simplified)", description: `Job ID: ${jobId}`});
    setJobPostings(prev => prev.map(j => j.id === jobId ? {...j, matchPercentage: 60, matchCategory: "Good Match", matchSummary: "Simulated single match."} : j));
  }, [toast, setJobPostings]);


  if (!areFiltersLoaded) {
     return (
      <div className="container mx-auto py-8 text-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  const isAllSelected = jobPostings.length > 0 && selectedJobIds.size === jobPostings.length;
  // Explicit semicolon before return
  ;

  return (
    <TooltipProvider>
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold flex items-center">
          <Rss className="mr-3 h-8 w-8 text-primary" /> Advanced RSS Job Feed
        </h1>
        <p className="text-muted-foreground">
          Select feeds, filter by keywords, then process selected jobs for detailed AI analysis and CV matching or tailor your CV directly.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger>
             <div className="flex items-center text-lg font-medium">
                <Search className="mr-2 h-5 w-5" />Configure & Fetch Feed
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card className="border-none shadow-none">
              <CardContent className="pt-6">
                <Form {...filtersForm}>
                  <form onSubmit={filtersForm.handleSubmit(handleFetchRssFeed)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={filtersForm.control}
                        name="selectedSubjectUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Filter by Subject Area</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value || ALL_SUBJECT_AREAS_URL}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Any Subject Area" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="max-h-[400px] overflow-y-auto">
                                  <SelectItem value={ALL_SUBJECT_AREAS_URL}>Any Subject Area (General Feed)</SelectItem>
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
                            <Select
                              onValueChange={field.onChange}
                              value={field.value || ALL_LOCATIONS_URL}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Any Location" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="max-h-[400px] overflow-y-auto">
                                <SelectItem value={ALL_LOCATIONS_URL}>Any Location (General Feed)</SelectItem>
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
                          <FormLabel htmlFor="keywordsInput">Filter by Keywords (optional, comma or space separated)</FormLabel>
                           <FormDescription>E.g., enter 'history, art' to find jobs matching both terms, after selecting a primary feed.</FormDescription>
                          <FormControl>
                            <Input id="keywordsInput" placeholder="e.g. research, python, remote, lecturer, history, TEFL" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" disabled={isLoadingFeed} size="lg" className="w-full sm:w-auto">
                      {isLoadingFeed ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ) : (
                        <Search className="mr-2 h-5 w-5" />
                      )}
                      {isLoadingFeed ? "Fetching Feed..." : "Fetch RSS Feed"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {jobPostings.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <CardTitle className="font-headline">Jobs from Feed</CardTitle>
                <CardDescription>
                    Select jobs to batch process for CV matching, or tailor a CV for a specific role directly.
                </CardDescription>
              </div>
              <Button
                onClick={handleProcessSelectedJobs}
                disabled={selectedJobIds.size === 0 || jobPostings.some(job => job.isProcessingDetails || job.isCalculatingMatch) || totalToProcess > 0 || !currentUser}
                size="lg"
              >
                <SparklesIcon className="mr-2 h-5 w-5" />
                Process Selected ({selectedJobIds.size}) for CV Match
              </Button>
            </div>
             {totalToProcess > 0 && (
                <div className="mt-2 text-sm text-muted-foreground">
                    Processing: {processingProgress} / {totalToProcess} jobs...
                </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                       <Tooltip>
                        <TooltipTrigger asChild>
                            <Checkbox
                                checked={isAllSelected}
                                onCheckedChange={(checked) => handleSelectAllJobs(Boolean(checked))}
                                aria-label="Select all jobs"
                                disabled={jobPostings.some(job => !!job.isProcessingDetails || !!job.isCalculatingMatch)}
                            />
                        </TooltipTrigger>
                        <TooltipContent>Select/Deselect All</TooltipContent>
                       </Tooltip>
                    </TableHead>
                    <TableHead><Briefcase className="inline-block mr-1 h-4 w-4" />Role & Details</TableHead>
                    <TableHead><FileTextIcon className="inline-block mr-1 h-4 w-4" />Summary (from RSS/AI)</TableHead>
                    <TableHead className="text-center"><Percent className="inline-block mr-1 h-4 w-4" />CV Match</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobPostings.map((job) => (
                    <TableRow key={job.id} data-state={selectedJobIds.has(job.id) ? "selected" : ""}>
                      <TableCell>
                        <Checkbox
                            checked={selectedJobIds.has(job.id)}
                            onCheckedChange={(checked) => handleSelectJob(job.id, Boolean(checked))}
                            aria-labelledby={`job-title-${job.id}`}
                            disabled={!!job.isProcessingDetails || !!job.isCalculatingMatch || tailoringJobId === job.id}
                        />
                      </TableCell>
                      <TableCell className="font-medium max-w-xs align-top">
                        <div className="flex items-center mb-1">
                            <span id={`job-title-${job.id}`} className="font-semibold">{job.role || job.title || <span className="text-muted-foreground/70 text-xs">N/A</span>}</span>
                            {job.link && job.link !== '#' && (
                            <a
                                href={job.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline text-primary/80 flex items-center group text-xs ml-2"
                                title={`View original posting for: ${job.role || job.title}`}
                            >
                                <ExternalLink className="inline-block mr-1 h-3 w-3 opacity-70 flex-shrink-0" /> Source
                            </a>
                            )}
                        </div>
                         {job.company && <p className="text-xs text-muted-foreground mt-1 flex items-center"><MapPin className="inline-block mr-1.5 h-3 w-3 flex-shrink-0" />{job.company}</p>}
                         {job.location && <p className="text-xs text-muted-foreground flex items-center"><MapPin className="inline-block mr-1.5 h-3 w-3 flex-shrink-0" />{job.location}</p>}
                         {job.deadlineText && <p className="text-xs text-muted-foreground flex items-center"><CalendarDays className="inline-block mr-1.5 h-3 w-3 flex-shrink-0" />{job.deadlineText}</p>}
                         {job.pubDate && !job.deadlineText && <p className="text-xs text-muted-foreground flex items-center"><CalendarDays className="inline-block mr-1.5 h-3 w-3 flex-shrink-0" />Posted: {new Date(job.pubDate).toLocaleDateString()}</p>}
                      </TableCell>
                      <TableCell className="max-w-md align-top">
                         <Tooltip>
                            <TooltipTrigger asChild>
                                <p className="text-xs whitespace-pre-wrap">
                                  {job.requirementsSummary?.replace(/&lt;br\\s*\\/?&gt;|<br\\s*\\/?>/gi, '\\n') || <span className="text-muted-foreground/70">N/A (Process to load)</span>}
                                </p>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-md p-2 bg-popover text-popover-foreground">
                                <p className="text-sm font-medium">RSS Description Snippet/AI Summary:</p>
                                <p className="text-xs whitespace-pre-wrap">{job.requirementsSummary?.replace(/&lt;br\\s*\\/?&gt;|<br\\s*\\/?>/gi, '\\n') || "Not available."}</p>
                                {(!job.company && !job.isProcessingDetails && !job.isCalculatingMatch && !(job.requirementsSummary || '').endsWith('...')) && <p className="text-xs mt-1 italic">This is a snippet. Select and process, or click 'Tailor CV' for full summary & details from source.</p>}
                            </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="text-center align-top">
                        {job.isProcessingDetails || job.isCalculatingMatch ? (
                          <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
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
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleProcessSingleJobMatch(job.id)}
                                disabled={!job.rssItemXml || tailoringJobId === job.id || !currentUser}
                              >
                                <SparklesIcon className="h-4 w-4 text-muted-foreground/70 hover:text-primary" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p className="text-xs">Fetch details (from RSS XML) & calculate CV match</p></TooltipContent>
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell className="text-center align-top">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTailorCvForJob(job.id)}
                            disabled={tailoringJobId === job.id || !!job.isCalculatingMatch || !job.link || job.link === '#' || !currentUser}
                        >
                            {tailoringJobId === job.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" /> }
                            Tailor CV
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

       {isLoadingFeed && (
         <div className="text-center py-12">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Fetching RSS feed...</p>
        </div>
      )}

      {!isLoadingFeed && jobPostings.length === 0 && filtersForm.formState.isSubmitted && (
         <Card className="text-center py-12">
            <CardHeader>
                <Rss className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <CardTitle className="font-headline text-2xl">No Jobs Found</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    No jobs were found in the feed for the selected criteria, or none matched your keywords. Please adjust filters or try different keywords.
                </p>
            </CardContent>
        </Card>
      )}
       {!isLoadingFeed && jobPostings.length === 0 && !filtersForm.formState.isSubmitted && (
         <Card className="text-center py-12">
            <CardHeader>
                <Rss className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <CardTitle className="font-headline text-2xl">Configure Filters to Begin</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    Choose a subject area and/or location, optionally add keywords, then click "Fetch RSS Feed", or wait for auto-fetch.
                </p>
                 {!currentUser && (
                    <p className="text-sm text-amber-600 mt-4 flex items-center justify-center">
                         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>
                        Please sign in to use CV matching and tailoring features.
                        <Button variant="link" size="sm" className="p-0 h-auto ml-1" onClick={() => router.push('/auth/signin')}>Sign In</Button>
                    </p>
                )}
            </CardContent>
        </Card>
      )};
    </div>
    </TooltipProvider>
  );
}

    