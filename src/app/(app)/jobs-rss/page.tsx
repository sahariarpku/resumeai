
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Rss, Search, Loader2, Briefcase, Building, FileText as FileTextIcon, CalendarDays, Percent, Sparkles as SparklesIcon, AlertTriangle, ExternalLink, MapPin, ArrowRight } from "lucide-react";
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

function parseBasicRssItem(itemXml: string, id: string): JobPostingRssItem {
  const getTagValue = (tagName: string, xml: string): string => {
    const match = xml.match(new RegExp(`<${tagName}[^>]*>\\s*<!\\[CDATA\\[(.*?)\\]\\]>\\s*<\/${tagName}>|<${tagName}[^>]*>(.*?)<\/${tagName}>`, "is"));
    return match ? (match[1] || match[2] || '').trim() : '';
  };

  let description = getTagValue('description', itemXml);
  description = description.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

  return {
    id: id,
    title: getTagValue('title', itemXml) || 'N/A',
    link: getTagValue('link', itemXml) || '#',
    pubDate: getTagValue('pubDate', itemXml),
    rssItemXml: itemXml,
    requirementsSummary: description.substring(0, 250) + (description.length > 250 ? '...' : ''),
  };
}


export default function JobsRssPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { currentUser } = useAuth();
  const [jobPostings, setJobPostings] = useState<JobPostingRssItem[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);
  const [initialSettingsLoaded, setInitialSettingsLoaded] = useState(false);

  const [areFiltersLoaded, setAreFiltersLoaded] = useState(false);
  const [initialFetchDone, setInitialFetchDone] = useState(false);

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

  const subjectAreaFeeds = useMemo(() => getFeedCategoriesByType('subjectArea'), []);
  const locationFeeds = useMemo(() => getFeedCategoriesByType('location'), []);

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
      console.error("Failed to load last filters from localStorage:", error);
    }
    setAreFiltersLoaded(true);
    setInitialSettingsLoaded(true);
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
        console.warn("Could not save filters to localStorage", error);
      }
    }
  }, [watchedSubjectUrl, watchedLocationUrl, watchedKeywords, areFiltersLoaded]);


  const handleFetchRssFeed = useCallback(async (data: RssFiltersData) => {
    setIsLoadingFeed(true);
    setJobPostings([]);
    setSelectedJobIds(new Set());
    setProcessingProgress(0);
    setTotalToProcess(0);

    let targetRssUrl = "";
    let feedDescription = "selected filters";

    if (data.selectedSubjectUrl && data.selectedSubjectUrl !== ALL_SUBJECT_AREAS_URL) {
        targetRssUrl = data.selectedSubjectUrl;
        const feedDetails = PREDEFINED_RSS_FEEDS.find(f => f.url === data.selectedSubjectUrl);
        feedDescription = `subject: ${feedDetails?.categoryDetail || 'Selected Subject'}`;
    } else if (data.selectedLocationUrl && data.selectedLocationUrl !== ALL_LOCATIONS_URL) {
        targetRssUrl = data.selectedLocationUrl;
        const feedDetails = PREDEFINED_RSS_FEEDS.find(f => f.url === data.selectedLocationUrl);
        feedDescription = `location: ${feedDetails?.categoryDetail || 'Selected Location'}`;
    } else {
        targetRssUrl = ALL_LOCATIONS_URL;
        feedDescription = "general feed (all jobs)";
    }

    toast({ title: "Fetching RSS Feed...", description: `Using ${feedDescription}` });

    let rawRssContentString = '';
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
        setIsLoadingFeed(false);
        try {
          const errorData = JSON.parse(responseBodyAsText);
          throw new Error(errorData.error || `API Error (${fetchResponse.status}): ${fetchResponse.statusText}`);
        } catch (e) {
          throw new Error(`API Error (${fetchResponse.status}): ${fetchResponse.statusText}. Response: ${responseBodyAsText.substring(0, 300)}...`);
        }
      }

      const responseData = JSON.parse(responseBodyAsText);
      if (responseData.error) { setIsLoadingFeed(false); throw new Error(responseData.error); }
      if (!responseData.rawRssContent) { setIsLoadingFeed(false); throw new Error("API returned success but no rawRssContent found.");}

      rawRssContentString = responseData.rawRssContent;

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
      toast({ title: "RSS Feed Loaded!", description: `${finalJobs.length} jobs displayed. Select jobs and click 'Process Selected' for more details & CV match, or 'Tailor CV' directly.` });

    } catch (err) {
      console.error("Error in handleFetchRssFeed:", err);
      let errorMessage = "Could not process the RSS feed.";
      if (err instanceof Error && err.message.toLowerCase().includes("offline")) {
        errorMessage = "Failed to process RSS feed: You appear to be offline. Please check your internet connection.";
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      toast({ title: "RSS Processing Error", description: errorMessage, variant: "destructive" });
      setJobPostings([]);
    } finally {
      setIsLoadingFeed(false);
    }
  }, [toast, setIsLoadingFeed, setJobPostings, setSelectedJobIds, setProcessingProgress, setTotalToProcess]);

  useEffect(() => {
    if (areFiltersLoaded && !initialFetchDone) {
      const currentFilters: RssFiltersData = {
        selectedSubjectUrl: watchedSubjectUrl || ALL_SUBJECT_AREAS_URL,
        selectedLocationUrl: watchedLocationUrl || ALL_LOCATIONS_URL,
        keywords: watchedKeywords || "",
      };
      const fetchData = async () => {
        await handleFetchRssFeed(currentFilters);
        setInitialFetchDone(true);
      };
      fetchData();
    }
  }, [areFiltersLoaded, initialFetchDone, watchedSubjectUrl, watchedLocationUrl, watchedKeywords, handleFetchRssFeed, setInitialFetchDone]);


  const fetchUserProfile = useCallback(async (): Promise<UserProfile | null> => {
    if (!currentUser) {
      toast({ title: "Not Authenticated", description: "Please sign in to use this feature.", variant: "destructive" });
      router.push('/auth/signin');
      return null;
    }
    try {
      await enableNetwork(db);
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        return userDocSnap.data() as UserProfile;
      } else {
        toast({ title: "Profile Not Found", description: "Please complete your profile first.", variant: "default" });
        router.push('/profile');
        return null;
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      let description = "Could not load your profile.";
      if (error instanceof Error && error.message.toLowerCase().includes("offline")) {
        description = "Failed to load profile: You appear to be offline. Please check your internet connection.";
      } else if (error instanceof Error && error.message.includes("FIRESTORE_UNAVAILABLE")) {
        description = "Firestore is currently unavailable. Profile cannot be loaded. Please check your Firebase setup and internet connection.";
      } else if (error instanceof Error) {
        description = `Could not load profile: ${error.message}.`;
      }
      toast({ title: "Profile Load Error", description, variant: "destructive" });
      return null;
    }
  }, [currentUser, router, toast]);

  const fetchAndSetJobDetailsFromRssXml = useCallback(async (jobId: string): Promise<JobPostingRssItem | null> => {
    let updatedJob: JobPostingRssItem | null = null;

    setJobPostings(prevJobs => prevJobs.map(j => j.id === jobId ? { ...j, isProcessingDetails: true } : j));

    const jobToProcess = jobPostings.find(j => j.id === jobId);

    if (!jobToProcess || !jobToProcess.rssItemXml) {
      toast({ title: "Error", description: `Missing data for job ${jobToProcess?.title || jobId}`, variant: "destructive" });
      setJobPostings(prevJobs => prevJobs.map(j => j.id === jobId ? { ...j, isProcessingDetails: false, matchSummary: "Missing data for processing." } : j));
      return null;
    }

    try {
      const extractedDetails: ExtractRssItemOutput = await extractJobDetailsFromRssItem({ rssItemXml: jobToProcess.rssItemXml });
      updatedJob = { ...jobToProcess, ...extractedDetails, isProcessingDetails: false };
      setJobPostings(prevJobs => prevJobs.map(j => j.id === jobId ? updatedJob! : j));
      return updatedJob;
    } catch (error) {
      console.error(`Error fetching details for job ${jobId}:`, error);
      toast({ title: "Detail Fetch Error", description: `Could not fetch details for ${jobToProcess.title}.`, variant: "destructive" });
      setJobPostings(prevJobs => prevJobs.map(j => j.id === jobId ? { ...j, isProcessingDetails: false, matchSummary: "Error fetching details." } : j));
      return null;
    }
  }, [jobPostings, toast, setJobPostings]);

  const handleProcessSelectedJobs = useCallback(async () => {
    if (selectedJobIds.size === 0) {
      toast({ title: "No Jobs Selected", description: "Please select at least one job to process.", variant: "default" });
      return;
    }

    const userProfileData = await fetchUserProfile();
    if (!userProfileData) return;

    const profileText = profileToResumeText(userProfileData);
    if (!profileText.trim()) {
        toast({ title: "Profile Empty", description: "Your profile is empty. Please add details to calculate matches.", variant: "default" });
        router.push('/profile');
        return;
    }

    toast({ title: "Processing Selected Jobs...", description: `Fetching details for ${selectedJobIds.size} job(s).` });
    setTotalToProcess(selectedJobIds.size);
    setProcessingProgress(0);
    let processedCount = 0;

    for (const jobId of selectedJobIds) {
      let jobData = jobPostings.find(j => j.id === jobId);
      if (!jobData) continue;

      if (!jobData.company && jobData.rssItemXml) {
        jobData = await fetchAndSetJobDetailsFromRssXml(jobId);
      }

      if (jobData && jobData.requirementsSummary && jobData.requirementsSummary.trim().length > 10) {
        setJobPostings(prev => prev.map(j => j.id === jobId ? { ...j, isCalculatingMatch: true } : j));
        try {
          const matchResult = await calculateProfileJdMatch({ profileText, jobDescriptionText: jobData.requirementsSummary });
          setJobPostings(prev => prev.map(j => j.id === jobId ? { ...j, ...matchResult, isCalculatingMatch: false } : j));
        } catch (matchError) {
           console.error(`Error calculating match for job ${jobId}:`, matchError);
           let description = `Could not calculate match for ${jobData.title}.`;
           if (matchError instanceof Error && matchError.message.toLowerCase().includes("offline")) {
             description = `Could not calculate match for ${jobData.title}: You appear to be offline.`;
           } else if (matchError instanceof Error && matchError.message.includes("FIRESTORE_UNAVAILABLE")) {
             description = `Firestore is currently unavailable. Match calculation failed for ${jobData.title}. Please check your Firebase setup and internet connection.`;
           } else if (matchError instanceof Error) {
            description = `Could not calculate match for ${jobData.title}: ${matchError.message}`;
           }
           setJobPostings(prev => prev.map(j => j.id === jobId ? { ...j, isCalculatingMatch: false, matchSummary: "Error calculating match." } : j));
           toast({ title: "Match Error", description, variant: "destructive" });
        }
      } else if (jobData) {
        setJobPostings(prev => prev.map(j => j.id === jobId ? { ...j, matchSummary: "Requirements summary missing or too short for matching.", matchCategory: "Poor Match" as JobDescriptionItem['matchCategory'], matchPercentage: 0, isCalculatingMatch: false } : j));
      }
      processedCount++;
      setProcessingProgress(processedCount);
    }
    toast({ title: "Processing Complete!", description: "Selected jobs have been processed." });
    setTotalToProcess(0);
  }, [selectedJobIds, fetchUserProfile, jobPostings, fetchAndSetJobDetailsFromRssXml, router, toast, setJobPostings, setTotalToProcess, setProcessingProgress]);

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
    setTailoringJobId(jobId);
    let job = jobPostings.find(j => j.id === jobId);
    if (!job || !job.link || job.link === '#') {
      toast({ title: "Error", description: "Valid job link not found for this item.", variant: "destructive" });
      setTailoringJobId(null);
      return;
    }

    toast({ title: "Fetching Full Job Posting...", description: `Accessing ${job.link} for details.`, variant: "default" });

    try {
      const fetchHtmlResponse = await fetch(`/api/fetch-url-content?url=${encodeURIComponent(job.link)}`);
      if (!fetchHtmlResponse.ok) {
        const errorData = await fetchHtmlResponse.json().catch(() => ({error: "Failed to parse API error response."}));
        throw new Error(errorData.error || `Failed to fetch job URL: ${fetchHtmlResponse.statusText}`);
      }
      const { htmlContent } = await fetchHtmlResponse.json();

      if (!htmlContent) {
        toast({ title: "No Content Fetched", description: "The job URL did not return any HTML content.", variant: "default" });
        setTailoringJobId(null);
        return;
      }

      toast({ title: "Extracting Text...", description: `AI is processing the job page content.`, variant: "default" });
      const textExtractionResult = await extractTextFromHtml({ htmlContent });

      if (!textExtractionResult.extractedText || textExtractionResult.extractedText.trim().length === 0) {
        toast({ title: "No Text Extracted", description: "AI could not extract meaningful job description text from the URL.", variant: "default" });
        setTailoringJobId(null);
        return;
      }
      const detailedJobDescription = textExtractionResult.extractedText;

      const detailsExtractionResult = await extractJobDetails({ jobDescriptionText: detailedJobDescription });

      setJobPostings(prevJobs => prevJobs.map(j => j.id === jobId ? {
        ...j,
        requirementsSummary: detailedJobDescription,
        role: detailsExtractionResult.jobTitle || j.role,
        company: detailsExtractionResult.companyName || j.company,
      } : j));

      const userProfileData = await fetchUserProfile();
      if (!userProfileData) { setTailoringJobId(null); return; }

      const baseResumeText = profileToResumeText(userProfileData);
      if (!baseResumeText.trim()) {
         toast({ title: "Profile Incomplete", description: "Your profile seems empty. Please complete it before tailoring.", variant: "default" });
        router.push('/profile');
        setTailoringJobId(null);
        return;
      }

      localStorage.setItem(TAILOR_RESUME_PREFILL_RESUME_KEY, baseResumeText);
      localStorage.setItem(TAILOR_RESUME_PREFILL_JD_KEY, detailedJobDescription);

      toast({ title: "Ready to Tailor!", description: "Full job description loaded. Redirecting...", variant: "default" });
      router.push('/tailor-resume');

    } catch (error) {
      console.error("Error preparing for resume tailoring by fetching URL:", error);
      let description = `Could not process job URL for tailoring: ${error instanceof Error ? error.message : 'Unknown error'}.`;
      if (error instanceof Error && error.message.toLowerCase().includes("offline")) {
        description = "Failed to process job URL: You appear to be offline. Please check your internet connection.";
      } else if (error instanceof Error) {
        description = `Could not process job URL: ${error.message}.`;
      }
      toast({ title: "Tailoring Prep Error", description, variant: "destructive" });
    } finally {
      setTailoringJobId(null);
    }
  }, [jobPostings, fetchUserProfile, router, toast, setJobPostings]);

  const handleProcessSingleJobMatch = useCallback(async (jobId: string) => {
      const userProfileData = await fetchUserProfile();
      if (!userProfileData) return;

      const profileText = profileToResumeText(userProfileData);
      if (!profileText.trim()) {
          toast({ title: "Profile Empty", description: "Your profile is empty. Please add details to calculate matches.", variant: "default" });
          router.push('/profile');
          return;
      }

      let jobData = jobPostings.find(j => j.id === jobId);
      if (!jobData) return;

      if (!jobData.company && jobData.rssItemXml) {
          jobData = await fetchAndSetJobDetailsFromRssXml(jobId);
      }

      if (jobData && jobData.requirementsSummary && jobData.requirementsSummary.trim().length > 10) {
          setJobPostings(prev => prev.map(j => j.id === jobId ? { ...j, isCalculatingMatch: true } : j));
          try {
            const matchResult = await calculateProfileJdMatch({ profileText, jobDescriptionText: jobData.requirementsSummary });
            setJobPostings(prev => prev.map(j => j.id === jobId ? { ...j, ...matchResult, isCalculatingMatch: false } : j));
            toast({ title: "Match Calculated!", description: `Score for "${jobData.title}" is ${matchResult.matchPercentage}%.` });
          } catch (matchError) {
             console.error(`Error calculating match for job ${jobId}:`, matchError);
             let description = `Could not calculate match for ${jobData.title}.`;
             if (matchError instanceof Error && matchError.message.toLowerCase().includes("offline")) {
               description = `Could not calculate match for ${jobData.title}: You appear to be offline.`;
             } else if (matchError instanceof Error && matchError.message.includes("FIRESTORE_UNAVAILABLE")) {
               description = `Firestore is currently unavailable. Match calculation failed for ${jobData.title}. Please check your Firebase setup and internet connection.`;
             } else if (matchError instanceof Error) {
               description = `Could not calculate match for ${jobData.title}: ${matchError.message}.`;
             }
             setJobPostings(prev => prev.map(j => j.id === jobId ? { ...j, isCalculatingMatch: false, matchSummary: "Error calculating match." } : j));
             toast({ title: "Match Error", description, variant: "destructive" });
          }
      } else if (jobData) {
          setJobPostings(prev => prev.map(j => j.id === jobId ? { ...j, matchSummary: "Requirements summary missing or too short for matching.", matchCategory: "Poor Match" as JobDescriptionItem['matchCategory'], matchPercentage: 0, isCalculatingMatch: false } : j));
          toast({ title: "Cannot Calculate Match", description: "Full job summary is missing or too short. Try processing selected or tailoring.", variant: "default"});
      }
  }, [fetchUserProfile, jobPostings, fetchAndSetJobDetailsFromRssXml, router, toast, setJobPostings]);


  if (!initialSettingsLoaded) {
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
                         {job.company && <p className="text-xs text-muted-foreground mt-1 flex items-center"><Building className="inline-block mr-1.5 h-3 w-3 flex-shrink-0" />{job.company}</p>}
                         {job.location && <p className="text-xs text-muted-foreground flex items-center"><MapPin className="inline-block mr-1.5 h-3 w-3 flex-shrink-0" />{job.location}</p>}
                         {job.deadlineText && <p className="text-xs text-muted-foreground flex items-center"><CalendarDays className="inline-block mr-1.5 h-3 w-3 flex-shrink-0" />{job.deadlineText}</p>}
                         {job.pubDate && !job.deadlineText && <p className="text-xs text-muted-foreground flex items-center"><CalendarDays className="inline-block mr-1.5 h-3 w-3 flex-shrink-0" />Posted: {new Date(job.pubDate).toLocaleDateString()}</p>}
                      </TableCell>
                      <TableCell className="max-w-md align-top">
                         <Tooltip>
                            <TooltipTrigger asChild>
                                <p className="text-xs whitespace-pre-wrap">
                                  {job.requirementsSummary?.replace(/&lt;br\\s*\\/?&gt;|<br\\s*\\/?>/gi, '\n') || <span className="text-muted-foreground/70">N/A (Process to load)</span>}
                                </p>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-md p-2 bg-popover text-popover-foreground">
                                <p className="text-sm font-medium">RSS Description Snippet/AI Summary:</p>
                                <p className="text-xs whitespace-pre-wrap">{job.requirementsSummary?.replace(/&lt;br\\s*\\/?&gt;|<br\\s*\\/?>/gi, '\n') || "Not available."}</p>
                                {(!job.company && !job.isProcessingDetails && !job.isCalculatingMatch && !job.requirementsSummary?.endsWith('...')) && <p className="text-xs mt-1 italic">This is a snippet. Select and process, or click 'Tailor CV' for full summary & details from source.</p>}
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
       {!isLoadingFeed && jobPostings.length === 0 && !filtersForm.formState.isSubmitted && !initialFetchDone && (
         <Card className="text-center py-12">
            <CardHeader>
                <Rss className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <CardTitle className="font-headline text-2xl">Configure Filters to Begin</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    Choose a subject area and/or location, optionally add keywords, then click "Fetch RSS Feed", or wait for auto-fetch.
                </p>
                 {initialSettingsLoaded && !currentUser && (
                    <p className="text-sm text-amber-600 mt-4 flex items-center justify-center">
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        Please sign in to use CV matching and tailoring features.
                        <Button variant="link" size="sm" className="p-0 h-auto ml-1" onClick={() => router.push('/auth/signin')}>Sign In</Button>
                    </p>
                )}
            </CardContent>
        </Card>
      )}
    </div>
    </TooltipProvider>
  );
}

    