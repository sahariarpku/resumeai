
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { Rss, Search, Loader2, Briefcase, Building, FileText as FileTextIcon, CalendarDays, Percent, Sparkles as SparklesIcon, AlertTriangle, Link as LinkIcon, MapPin, ExternalLink, Filter, Tag, XCircle, CheckSquare, Square, Info } from "lucide-react";
import { useRouter } from 'next/navigation';
import type { JobPostingRssItem, UserProfile } from "@/lib/types";
import { z } from "zod"; 
import { extractJobDetailsFromRssItem, type ExtractRssItemOutput } from "@/ai/flows/extract-rss-item-flow";
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

const USER_PROFILE_STORAGE_KEY = "userProfile";
const LAST_SELECTED_SUBJECT_URL_KEY = "lastSelectedSubjectUrl_v2";
const LAST_SELECTED_LOCATION_URL_KEY = "lastSelectedLocationUrl_v2";
const LAST_KEYWORDS_KEY = "lastKeywords_v2";


const RssFiltersSchema = z.object({ 
  selectedSubjectUrl: z.string().optional(),
  selectedLocationUrl: z.string().optional(),
  keywords: z.string().optional(),
});
type RssFiltersData = z.infer<typeof RssFiltersSchema>;

// Basic client-side RSS item parser
function parseBasicRssItem(itemXml: string, id: string): JobPostingRssItem {
  const getTagValue = (tagName: string, xml: string): string => {
    const match = xml.match(new RegExp(`<${tagName}[^>]*>\\s*<!\\[CDATA\\[(.*?)\\]\\]>\\s*<\\/${tagName}>|<${tagName}[^>]*>(.*?)<\\/${tagName}>`, "is"));
    return match ? (match[1] || match[2] || '').trim() : '';
  };

  let description = getTagValue('description', itemXml);
  description = description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').substring(0, 150) + (description.length > 150 ? '...' : '');


  return {
    id: id,
    title: getTagValue('title', itemXml) || 'N/A',
    link: getTagValue('link', itemXml),
    pubDate: getTagValue('pubDate', itemXml),
    rssItemXml: itemXml, 
    requirementsSummary: description, 
  };
}


export default function JobsRssPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [jobPostings, setJobPostings] = useState<JobPostingRssItem[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [areFiltersLoaded, setAreFiltersLoaded] = useState(false);
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());
  const [processingProgress, setProcessingProgress] = useState(0);
  const [totalToProcess, setTotalToProcess] = useState(0);

  const filtersForm = useForm<RssFiltersData>({
    resolver: zodResolver(RssFiltersSchema),
    defaultValues: {
      selectedSubjectUrl: ALL_SUBJECT_AREAS_URL,
      selectedLocationUrl: ALL_LOCATIONS_URL,
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

      filtersForm.reset({ 
        selectedSubjectUrl: lastSubject || ALL_SUBJECT_AREAS_URL,
        selectedLocationUrl: lastLocation || ALL_LOCATIONS_URL,
        keywords: lastKeywords || "",
      });
    } catch (error) {
      console.error("Failed to load last filters from localStorage:", error);
      // Form will use static defaultValues if localStorage fails
    }
    setAreFiltersLoaded(true);
  }, [toast, filtersForm]); // filtersForm.reset is stable, so filtersForm is okay

  useEffect(() => {
    if (areFiltersLoaded) { // Only save after initial load & reset
      const subscription = filtersForm.watch((value) => {
        try {
          localStorage.setItem(LAST_SELECTED_SUBJECT_URL_KEY, value.selectedSubjectUrl || ALL_SUBJECT_AREAS_URL);
          localStorage.setItem(LAST_SELECTED_LOCATION_URL_KEY, value.selectedLocationUrl || ALL_LOCATIONS_URL);
          localStorage.setItem(LAST_KEYWORDS_KEY, value.keywords || "");
        } catch (error) {
          console.warn("Could not save filters to localStorage", error);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [filtersForm, areFiltersLoaded]);

  const handleFetchRssFeed = async (data: RssFiltersData) => {
    setIsLoadingFeed(true);
    setJobPostings([]);
    setSelectedJobIds(new Set());
    setProcessingProgress(0);
    setTotalToProcess(0);

    let targetRssUrl = "";
    let feedDescription = "";

    if (data.selectedSubjectUrl && data.selectedSubjectUrl !== ALL_SUBJECT_AREAS_URL) {
        targetRssUrl = data.selectedSubjectUrl;
        feedDescription = `subject: ${PREDEFINED_RSS_FEEDS.find(f => f.url === data.selectedSubjectUrl)?.categoryDetail || 'Selected Subject'}`;
    } else if (data.selectedLocationUrl && data.selectedLocationUrl !== ALL_LOCATIONS_URL) {
        targetRssUrl = data.selectedLocationUrl;
        feedDescription = `location: ${PREDEFINED_RSS_FEEDS.find(f => f.url === data.selectedLocationUrl)?.categoryDetail || 'Selected Location'}`;
    } else { // Both are "Any" or one is "Any" and other is not set (should default to "Any")
        targetRssUrl = ALL_LOCATIONS_URL; 
        feedDescription = "general feed (all jobs)";
    }
    
    if (!targetRssUrl) {
        toast({ title: "No Feed Selected", description: "Please select a subject area or location.", variant: "default" });
        setIsLoadingFeed(false);
        return;
    }

    toast({ title: "Fetching RSS Feed...", description: `Fetching from ${feedDescription}` });

    let rawRssContentString = '';
    try {
      const fetchResponse = await fetch(`/api/fetch-rss?url=${encodeURIComponent(targetRssUrl)}`);
      let responseBodyAsText = '';
      try { responseBodyAsText = await fetchResponse.text(); } 
      catch (textError) { 
        setIsLoadingFeed(false);
        throw new Error(`Failed to read response from API: ${textError instanceof Error ? textError.message : String(textError)}`); 
      }

      if (!fetchResponse.ok) {
        setIsLoadingFeed(false);
        try { const errorData = JSON.parse(responseBodyAsText); throw new Error(errorData.error || `API Error (${fetchResponse.status}): ${fetchResponse.statusText}`); } 
        catch (e) { throw new Error(`API Error (${fetchResponse.status}): ${fetchResponse.statusText}. Response: ${responseBodyAsText.substring(0, 300)}...`); }
      }
      
      const contentType = fetchResponse.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        setIsLoadingFeed(false);
        throw new Error(`Expected JSON response from API, but received ${contentType || 'unknown content type'}. Response: ${responseBodyAsText.substring(0,500)}...`);
      }
      
      const responseData = JSON.parse(responseBodyAsText); 
      if (responseData.error) { setIsLoadingFeed(false); throw new Error(responseData.error); }
      if (!responseData.rawRssContent) { setIsLoadingFeed(false); throw new Error("API returned success but no rawRssContent found.");}
      
      rawRssContentString = responseData.rawRssContent;
      
      if (!rawRssContentString) {
        toast({ title: "No Content Fetched", description: "The RSS URL did not return any content.", variant: "default" });
        setJobPostings([]); setIsLoadingFeed(false); return;
      }
      
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      let match;
      const parsedItems: JobPostingRssItem[] = [];
      let itemIndex = 0;
      while ((match = itemRegex.exec(rawRssContentString)) !== null) {
        parsedItems.push(parseBasicRssItem(match[0], `rssjob-${Date.now()}-${itemIndex++}`));
      }

      if (parsedItems.length === 0) {
        toast({ title: "No Job Items Found", description: "The RSS feed does not seem to contain any job items.", variant: "default" });
        setJobPostings([]); setIsLoadingFeed(false); return;
      }
      
      let finalJobs = parsedItems;
      const keywordsToFilter = data.keywords?.trim().toLowerCase();
      if (keywordsToFilter) {
        const keywordArray = keywordsToFilter.split(/\s*,\s*|\s+/).filter(Boolean); 
        if (keywordArray.length > 0) {
            finalJobs = parsedItems.filter(job => {
            const searchableText = [
              job.title?.toLowerCase() || "",
              job.company?.toLowerCase() || "", 
              job.requirementsSummary?.toLowerCase() || "", 
              job.location?.toLowerCase() || "", 
            ].join(" ");
            return keywordArray.every(kw => searchableText.includes(kw));
          });
          toast({ title: "Keywords Applied", description: `Filtered ${parsedItems.length} jobs down to ${finalJobs.length}.` });
        }
      }
      
      setJobPostings(finalJobs);
      toast({ title: "RSS Feed Loaded!", description: `${finalJobs.length} jobs displayed. Select jobs and click 'Process Selected' for more details & CV match.` });

    } catch (err) {
      console.error("Error in handleFetchRssFeed:", err);
      let errorMessage = "Could not process the RSS feed.";
      if (err instanceof Error) errorMessage = err.message;
      toast({ title: "RSS Processing Error", description: errorMessage, variant: "destructive" });
      setJobPostings([]);
    } finally {
      setIsLoadingFeed(false);
    }
  };

  const handleProcessSelectedJobs = async () => {
    if (selectedJobIds.size === 0) {
      toast({ title: "No Jobs Selected", description: "Please select at least one job to process.", variant: "default" });
      return;
    }
    if (!userProfile) {
      toast({ title: "Profile Needed", description: "Please set up your profile to calculate CV matches.", variant: "default" });
      router.push('/profile');
      return;
    }
    const profileText = profileToResumeText(userProfile);
    if (!profileText.trim()) {
        toast({ title: "Profile Empty", description: "Your profile is empty. Please add details to calculate matches.", variant: "default" });
        router.push('/profile');
        return;
    }

    toast({ title: "Processing Selected Jobs...", description: `Fetching details for ${selectedJobIds.size} job(s). This may take a moment.` });
    setTotalToProcess(selectedJobIds.size);
    setProcessingProgress(0);
    let processedCount = 0;

    let updatedJobPostings = [...jobPostings];

    for (const jobId of selectedJobIds) {
      const jobIndex = updatedJobPostings.findIndex(j => j.id === jobId);
      if (jobIndex === -1) continue;

      updatedJobPostings[jobIndex] = { ...updatedJobPostings[jobIndex], isProcessingDetails: true, isCalculatingMatch: true };
      setJobPostings([...updatedJobPostings]); 

      try {
        const jobToProcess = updatedJobPostings[jobIndex];
        if (!jobToProcess.rssItemXml) {
          toast({ title: "Error", description: `Missing RSS XML for job ${jobToProcess.title || 'Untitled Job'}`, variant: "destructive" });
          updatedJobPostings[jobIndex] = { ...jobToProcess, isProcessingDetails: false, isCalculatingMatch: false, matchSummary: "Missing data for processing." };
          setJobPostings([...updatedJobPostings]);
          processedCount++;
          setProcessingProgress(processedCount);
          continue;
        }

        const extractedDetails: ExtractRssItemOutput = await extractJobDetailsFromRssItem({ rssItemXml: jobToProcess.rssItemXml });
        updatedJobPostings[jobIndex] = {
          ...jobToProcess,
          ...extractedDetails, 
          isProcessingDetails: false, 
        };
        setJobPostings([...updatedJobPostings]); 

        if (extractedDetails.requirementsSummary && extractedDetails.requirementsSummary.trim().length > 10) {
          const matchResult = await calculateProfileJdMatch({ profileText, jobDescriptionText: extractedDetails.requirementsSummary });
          updatedJobPostings[jobIndex] = {
            ...updatedJobPostings[jobIndex],
            ...matchResult,
            isCalculatingMatch: false,
          };
        } else {
          updatedJobPostings[jobIndex] = {
            ...updatedJobPostings[jobIndex],
            matchSummary: "Requirements summary missing or too short for matching.",
            matchCategory: "Poor Match",
            matchPercentage: 0,
            isCalculatingMatch: false,
          };
        }
        setJobPostings([...updatedJobPostings]); 
      } catch (error) {
        console.error(`Error processing job ${jobId}:`, error);
        const currentJobTitle = updatedJobPostings[jobIndex]?.title || 'Selected Job';
        updatedJobPostings[jobIndex] = {
          ...updatedJobPostings[jobIndex],
          isProcessingDetails: false,
          isCalculatingMatch: false,
          matchSummary: `Error processing: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
        setJobPostings([...updatedJobPostings]);
        toast({ title: "Processing Error", description: `Could not process job: ${currentJobTitle}`, variant: "destructive" });
      } finally {
        processedCount++;
        setProcessingProgress(processedCount);
      }
    }
    toast({ title: "Processing Complete!", description: "Selected jobs have been processed." });
    setTotalToProcess(0); // Reset progress
  };
  
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

  if (!profileLoaded || !areFiltersLoaded) { 
     return (
      <div className="container mx-auto py-8 text-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading settings...</p>
      </div>
    );
  }
  
  const isAllSelected = jobPostings.length > 0 && selectedJobIds.size === jobPostings.length;

  return (
    <TooltipProvider>
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold flex items-center">
          <Rss className="mr-3 h-8 w-8 text-primary" /> Advanced RSS Job Feed
        </h1>
        <p className="text-muted-foreground">
          Select feeds by subject and/or location, filter by keywords, then process selected jobs for detailed AI analysis and CV matching.
        </p>
      </div>

      <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger>
             <div className="flex items-center text-lg font-medium"> {/* Using CardTitle equivalent styling */}
                <Filter className="mr-2 h-5 w-5" />Configure & Fetch Feed
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card className="border-none shadow-none"> {/* Remove card-like appearance if inside accordion */}
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
                              value={field.value}
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
                              value={field.value}
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
                    Select jobs to process for detailed AI analysis and CV matching.
                </CardDescription>
              </div>
              <Button 
                onClick={handleProcessSelectedJobs} 
                disabled={selectedJobIds.size === 0 || jobPostings.some(job => job.isProcessingDetails || job.isCalculatingMatch) || totalToProcess > 0}
                size="lg"
              >
                <SparklesIcon className="mr-2 h-5 w-5" />
                Process Selected ({selectedJobIds.size})
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
                                disabled={jobPostings.some(job => job.isProcessingDetails || job.isCalculatingMatch)}
                            />
                        </TooltipTrigger>
                        <TooltipContent>Select/Deselect All</TooltipContent>
                       </Tooltip>
                    </TableHead>
                    <TableHead><Briefcase className="inline-block mr-1 h-4 w-4" />Role</TableHead>
                    <TableHead><Building className="inline-block mr-1 h-4 w-4" />Company</TableHead>
                    <TableHead><MapPin className="inline-block mr-1 h-4 w-4" />Location</TableHead>
                    <TableHead><FileTextIcon className="inline-block mr-1 h-4 w-4" />Summary (from RSS)</TableHead>
                    <TableHead><CalendarDays className="inline-block mr-1 h-4 w-4" />Posted/Deadline</TableHead>
                    <TableHead className="text-center"><Percent className="inline-block mr-1 h-4 w-4" />CV Match</TableHead>
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
                            disabled={job.isProcessingDetails || job.isCalculatingMatch}
                        />
                      </TableCell>
                      <TableCell className="font-medium max-w-xs">
                        <span id={`job-title-${job.id}`}>{job.role || job.title || <span className="text-muted-foreground/70 text-xs">N/A</span>}</span>
                        {job.link && (
                          <a 
                            href={job.link} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="hover:underline text-primary/80 flex items-center group text-xs ml-1"
                            title={`View original posting for: ${job.role || job.title}`}
                          >
                            <ExternalLink className="inline-block mr-1 h-3 w-3 opacity-70 flex-shrink-0" /> Source
                          </a>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">{job.company || <span className="text-muted-foreground/70 text-xs">Process for details</span>}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{job.location || <span className="text-muted-foreground/70 text-xs">Process for details</span>}</TableCell>
                      <TableCell className="max-w-xs">
                         <Tooltip>
                            <TooltipTrigger asChild>
                                <p className="truncate hover:whitespace-normal cursor-help text-xs">
                                  {job.requirementsSummary || <span className="text-muted-foreground/70">N/A</span>}
                                </p>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-md p-2 bg-popover text-popover-foreground">
                                <p className="text-sm font-medium">RSS Description Snippet:</p>
                                <p className="text-xs whitespace-pre-wrap">{job.requirementsSummary || "Not available."}</p>
                                {(!job.matchPercentage && !job.isProcessingDetails && !job.isCalculatingMatch) && <p className="text-xs mt-1 italic">Select and process for full summary & CV match.</p>}
                            </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="max-w-[120px] truncate">{job.deadlineText || job.pubDate || <span className="text-muted-foreground/70">N/A</span>}</TableCell>
                      <TableCell className="text-center">
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
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  // Only select this job if not already selected
                                  if (!selectedJobIds.has(job.id)) {
                                    setSelectedJobIds(new Set([job.id]));
                                  }
                                  // Wait for state to update before calling process
                                  // (Better to handle this with a slight delay or in a useEffect based on selectedJobIds if direct call is problematic)
                                  setTimeout(() => handleProcessSelectedJobs(), 0); 
                                }}
                              >
                                <Info className="h-4 w-4 text-muted-foreground/70" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p className="text-xs">Click to process this job</p></TooltipContent>
                          </Tooltip>
                        )}
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
                <CardTitle className="font-headline text-2xl">Select Filters to Begin</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    Choose a subject area and/or location, optionally add keywords, then click "Fetch RSS Feed".
                </p>
                 {profileLoaded && !userProfile && (
                    <p className="text-sm text-amber-600 mt-4 flex items-center justify-center">
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        Your profile is not set up. CV matching will be disabled until profile is complete.
                        <Button variant="link" size="sm" className="p-0 h-auto ml-1" onClick={() => router.push('/profile')}>Set up profile</Button>
                    </p>
                )}
            </CardContent>
        </Card>
      )}
    </div>
    </TooltipProvider>
  );
}
