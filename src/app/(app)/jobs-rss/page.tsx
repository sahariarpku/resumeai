
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Rss, Search, Loader2, Briefcase, Building, FileText as FileTextIcon, CalendarDays, Percent, Sparkles as SparklesIcon, BarChart3, AlertTriangle, Tag, X, Plus, Link as LinkIcon, MapPin } from "lucide-react";
import { useRouter } from 'next/navigation';
import NextLink from "next/link"; 
import type { JobPostingItem, UserProfile } from "@/lib/types";
import { z } from "zod"; 
import { findJobs } from "@/ai/flows/find-jobs-flow";
import { calculateProfileJdMatch } from "@/ai/flows/calculate-profile-jd-match-flow";
import { profileToResumeText } from '@/lib/profile-utils';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from '@/components/ui/separator';

const USER_PROFILE_STORAGE_KEY = "userProfile";
const TAILOR_RESUME_PREFILL_JD_KEY = "tailorResumePrefillJD";
const JOB_KEYWORDS_STORAGE_KEY = "jobKeywords";
const JOB_LOCATION_PREFERENCE_STORAGE_KEY = "jobLocationPreference";


const NewKeywordSchema = z.object({ 
  newKeyword: z.string().min(1, "Keyword cannot be empty.").max(50, "Keyword too long."),
});
type NewKeywordFormData = z.infer<typeof NewKeywordSchema>;


export default function JobsRssPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [jobPostings, setJobPostings] = useState<JobPostingItem[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const [keywords, setKeywords] = useState<string[]>([]);
  const [isKeywordsLoaded, setIsKeywordsLoaded] = useState(false);
  const [locationPreference, setLocationPreference] = useState<string>("");
  const [isLocationLoaded, setIsLocationLoaded] = useState(false);

  const newKeywordForm = useForm<NewKeywordFormData>({
    resolver: zodResolver(NewKeywordSchema),
    defaultValues: {
      newKeyword: "",
    },
  });

  useEffect(() => {
    try {
      const storedKeywordsString = localStorage.getItem(JOB_KEYWORDS_STORAGE_KEY);
      if (storedKeywordsString) {
        setKeywords(JSON.parse(storedKeywordsString) as string[]);
      }
      const storedLocationPref = localStorage.getItem(JOB_LOCATION_PREFERENCE_STORAGE_KEY);
      if (storedLocationPref) {
        setLocationPreference(storedLocationPref);
      }
    } catch (error) {
      console.error("Failed to load preferences from localStorage:", error);
      toast({ title: "Preference Load Error", description: "Could not load saved keywords/location.", variant: "destructive" });
    }
    setIsKeywordsLoaded(true);
    setIsLocationLoaded(true);
  }, [toast]);

  useEffect(() => {
    if (isKeywordsLoaded) { 
        try {
            localStorage.setItem(JOB_KEYWORDS_STORAGE_KEY, JSON.stringify(keywords));
        } catch (error) {
            console.error("Failed to save keywords to localStorage:", error);
            toast({ title: "Keyword Save Error", description: "Could not save keywords.", variant: "destructive" });
        }
    }
  }, [keywords, isKeywordsLoaded, toast]);

  useEffect(() => {
    if (isLocationLoaded) {
        try {
            localStorage.setItem(JOB_LOCATION_PREFERENCE_STORAGE_KEY, locationPreference);
        } catch (error) {
            console.error("Failed to save location preference to localStorage:", error);
            toast({ title: "Location Save Error", description: "Could not save location preference.", variant: "destructive" });
        }
    }
  }, [locationPreference, isLocationLoaded, toast]);
  
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
  }, [toast]);


  const searchJobs = useCallback(async (currentKeywords: string[], currentLocation: string) => {
    if (currentKeywords.length === 0 && !currentLocation.trim()) {
      setJobPostings([]); // Clear previous results if no criteria
      return;
    }
    setIsLoadingSearch(true);
    setJobPostings([]); 
    const keywordsString = currentKeywords.join(' ');
    toast({ title: "Searching for jobs...", description: `Using keywords: ${keywordsString}${currentLocation ? `, Location: ${currentLocation}` : ''}` });

    if (!profileLoaded) {
      toast({ title: "Profile not loaded", description: "Please wait for profile to load before searching.", variant: "default" });
      setIsLoadingSearch(false);
      return;
    }
    
    try {
      const result = await findJobs({ 
        keywords: keywordsString,
        location: currentLocation.trim() || undefined 
      });
      if (result.jobPostings && result.jobPostings.length > 0) {
        const postingsWithClientData = result.jobPostings.map((job, index) => ({
          ...job,
          id: `job-${Date.now()}-${index}`,
          isCalculatingMatch: !!userProfile, // Start calculation only if profile exists
        }));
        setJobPostings(postingsWithClientData);
        toast({ title: "Jobs Found!", description: `${result.jobPostings.length} simulated job postings loaded.` });
      } else {
        setJobPostings([]); 
        toast({ title: "No Jobs Found", description: "AI couldn't find or simulate jobs for these criteria. Try different terms." });
      }
    } catch (err) {
      console.error("Error finding jobs:", err);
      toast({ title: "Search Error", description: "Could not fetch job simulations.", variant: "destructive" });
    } finally {
      setIsLoadingSearch(false);
    }
  }, [profileLoaded, userProfile, toast]);


  useEffect(() => {
    // Trigger search on initial load if keywords or location are present
    if (isKeywordsLoaded && isLocationLoaded && (keywords.length > 0 || locationPreference.trim()) && !isLoadingSearch && jobPostings.length === 0 && !newKeywordForm.formState.isSubmitted) { 
        searchJobs(keywords, locationPreference);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [isKeywordsLoaded, isLocationLoaded, keywords, locationPreference]);


  const calculateMatchForJob = useCallback(async (job: JobPostingItem, profileText: string) => {
    if (!profileText.trim()) {
      setJobPostings(prev => prev.map(j => j.id === job.id ? { ...j, matchPercentage: 0, matchSummary: "Profile is empty. Cannot calculate match.", matchCategory: "Poor Match", isCalculatingMatch: false } : j));
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


  const handleAddKeyword = (data: NewKeywordFormData) => {
    const keywordToAdd = data.newKeyword.trim();
    if (keywordToAdd && !keywords.includes(keywordToAdd)) {
      setKeywords(prevKeywords => [...prevKeywords, keywordToAdd]);
    }
    newKeywordForm.reset();
  };

  const handleDeleteKeyword = (keywordToDelete: string) => {
    setKeywords(prevKeywords => prevKeywords.filter(kw => kw !== keywordToDelete));
  };

  const handleTailorResume = (job: JobPostingItem) => {
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

  if (!isKeywordsLoaded || !profileLoaded || !isLocationLoaded) {
     return (
      <div className="container mx-auto py-8 text-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading preferences and profile...</p>
      </div>
    );
  }


  return (
    <TooltipProvider>
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-headline text-3xl font-bold flex items-center">
            <Rss className="mr-3 h-8 w-8 text-primary" /> AI Simulated Job Feed
          </h1>
          <p className="text-muted-foreground">
            Manage keywords & location to find AI-simulated job postings. Match them with your profile and tailor applications.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center"><Search className="mr-2 h-5 w-5" />Manage Job Search Criteria</CardTitle>
          <CardDescription>Add keywords and set a location preference to refine your automated job search.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="locationPreferenceInput" className="font-medium">Location Preference</Label>
            <Input 
              id="locationPreferenceInput" 
              placeholder="e.g., Remote, New York, London" 
              value={locationPreference}
              onChange={(e) => setLocationPreference(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">Enter a city, state, country, or "Remote".</p>
          </div>

          <Separator />
          
          <div>
            <Label className="font-medium">Job Keywords</Label>
            <Form {...newKeywordForm}>
              <form onSubmit={newKeywordForm.handleSubmit(handleAddKeyword)} className="flex items-start gap-2 mt-1">
                <FormField
                  control={newKeywordForm.control}
                  name="newKeyword"
                  render={({ field }) => (
                    <FormItem className="flex-grow">
                      <FormLabel htmlFor="newKeywordInput" className="sr-only">New Keyword</FormLabel>
                      <FormControl>
                        <Input id="newKeywordInput" placeholder="e.g., 'React developer'" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" aria-label="Add keyword">
                  <Plus className="h-5 w-5" /> <span className="hidden sm:inline ml-2">Add</span>
                </Button>
              </form>
            </Form>

            {keywords.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Active Keywords:</p>
                <div className="flex flex-wrap gap-2">
                  {keywords.map((keyword) => (
                    <Badge key={keyword} variant="secondary" className="text-sm py-1 px-2">
                      {keyword}
                      <button 
                          onClick={() => handleDeleteKeyword(keyword)} 
                          className="ml-1.5 rounded-full hover:bg-background/50 p-0.5 focus:outline-none focus:ring-1 focus:ring-ring"
                          aria-label={`Remove keyword ${keyword}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <Separator />

          <Button 
            onClick={() => searchJobs(keywords, locationPreference)} 
            disabled={isLoadingSearch || (keywords.length === 0 && !locationPreference.trim())} 
            size="lg" 
            className="w-full sm:w-auto"
          >
            {isLoadingSearch ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Search className="mr-2 h-5 w-5" />
            )}
            {isLoadingSearch ? "Searching..." : "Search Jobs"}
          </Button>
           {!profileLoaded && <p className="text-sm text-muted-foreground mt-2">Loading profile for matching...</p>}
           {profileLoaded && !userProfile && (
                <p className="text-sm text-amber-600 mt-3 flex items-center">
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Your profile is not set up. CV matching will be disabled. <Button variant="link" size="sm" className="p-0 h-auto ml-1" onClick={() => router.push('/profile')}>Set up profile</Button>
                </p>
            )}
        </CardContent>
      </Card>

      {jobPostings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Job Postings Found</CardTitle>
            <CardDescription>Review the simulated job postings and take action.</CardDescription>
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
                    <TableHead><CalendarDays className="inline-block mr-1 h-4 w-4" />Deadline</TableHead>
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
                            className="hover:underline text-primary"
                            title={`View job: ${job.role}`}
                          >
                            {job.role} <LinkIcon className="inline-block ml-1 h-3 w-3" />
                          </a>
                        ) : (
                          job.role
                        )}
                      </TableCell>
                      <TableCell>{job.company}</TableCell>
                      <TableCell>{job.location}</TableCell>
                      <TableCell className="max-w-xs">
                         <Tooltip>
                            <TooltipTrigger asChild>
                                <p className="truncate hover:whitespace-normal cursor-help">{job.requirementsSummary}</p>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-md p-2 bg-popover text-popover-foreground">
                                <p className="text-sm font-medium">Full Requirements Summary:</p>
                                <p className="text-xs">{job.requirementsSummary}</p>
                            </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell>{job.deadlineText}</TableCell>
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
                          disabled={!userProfile || !profileLoaded}
                          title={(!userProfile || !profileLoaded) ? "Set up your profile to enable tailoring" : "Tailor your resume for this job"}
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

       {isLoadingSearch && jobPostings.length === 0 && (
         <div className="text-center py-12">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">AI is simulating job feeds based on your criteria...</p>
        </div>
      )}

      {!isLoadingSearch && jobPostings.length === 0 && (keywords.length > 0 || locationPreference.trim() ? (newKeywordForm.formState.isSubmitted || isKeywordsLoaded || isLocationLoaded || jobPostings !== null ) : true) && (
         <Card className="text-center py-12">
            <CardHeader>
                <Rss className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <CardTitle className="font-headline text-2xl">
                    {(keywords.length > 0 || locationPreference.trim()) ? "No Simulated Jobs Found" : "Add Criteria to Start"}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                {(keywords.length > 0 || locationPreference.trim()) 
                    ? "The AI couldn't generate job postings for your current criteria. Please try different or broader search terms, or adjust your active keywords/location."
                    : "Add some keywords or a location preference above to start discovering AI-simulated job opportunities."
                }
                </p>
            </CardContent>
        </Card>
      )}
    </div>
    </TooltipProvider>
  );
}

