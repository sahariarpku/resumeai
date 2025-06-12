
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Rss, Search, Loader2, Briefcase, Building, FileText as FileTextIcon, CalendarDays, Percent, Sparkles as SparklesIcon, BarChart3, AlertTriangle } from "lucide-react";
import { useRouter } from 'next/navigation';
import type { JobPostingItem, UserProfile, SimulatedJobPosting } from "@/lib/types";
import { FindJobsInputSchema, type FindJobsInput } from "@/lib/schemas";
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


const USER_PROFILE_STORAGE_KEY = "userProfile";
const TAILOR_RESUME_PREFILL_JD_KEY = "tailorResumePrefillJD";

export default function JobsRssPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [jobPostings, setJobPostings] = useState<JobPostingItem[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const form = useForm<FindJobsInput>({
    resolver: zodResolver(FindJobsInputSchema),
    defaultValues: {
      keywords: "",
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
      toast({
        title: "Profile Load Error",
        description: "Could not load your profile for CV matching.",
        variant: "destructive",
      });
    }
    setProfileLoaded(true);
  }, [toast]);

  const calculateMatchForJob = useCallback(async (job: JobPostingItem, profileText: string) => {
    if (!profileText.trim()) {
      // No profile text, so can't calculate match. Update state to reflect this.
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


  const handleSearchJobs = async (data: FindJobsInput) => {
    setIsLoadingSearch(true);
    setJobPostings([]);
    toast({ title: "Searching for jobs...", description: "AI is simulating job feeds based on your keywords." });

    if (!profileLoaded) {
      toast({ title: "Profile not loaded", description: "Please wait for profile to load before searching.", variant: "default" });
      setIsLoadingSearch(false);
      return;
    }
    
    try {
      const result = await findJobs({ keywords: data.keywords });
      if (result.jobPostings && result.jobPostings.length > 0) {
        const postingsWithClientData = result.jobPostings.map((job, index) => ({
          ...job,
          id: `job-${Date.now()}-${index}`,
          isCalculatingMatch: !!userProfile, // Only set to true if profile exists to trigger calculation
        }));
        setJobPostings(postingsWithClientData);
        toast({ title: "Jobs Found!", description: `${result.jobPostings.length} simulated job postings loaded.` });
      } else {
        toast({ title: "No Jobs Found", description: "AI couldn't find or simulate jobs for these keywords. Try different terms." });
      }
    } catch (err) {
      console.error("Error finding jobs:", err);
      toast({ title: "Search Error", description: "Could not fetch job simulations.", variant: "destructive" });
    } finally {
      setIsLoadingSearch(false);
    }
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


  return (
    <TooltipProvider>
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-headline text-3xl font-bold flex items-center">
            <Rss className="mr-3 h-8 w-8 text-primary" /> AI Simulated Job Feed
          </h1>
          <p className="text-muted-foreground">
            Enter keywords to find AI-simulated job postings. Match them with your profile and tailor applications.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Search for Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSearchJobs)} className="flex flex-col sm:flex-row items-start gap-4">
              <FormField
                control={form.control}
                name="keywords"
                render={({ field }) => (
                  <FormItem className="flex-grow w-full sm:w-auto">
                    <FormLabel htmlFor="keywordsInput" className="sr-only">Keywords</FormLabel>
                    <FormControl>
                      <Input id="keywordsInput" placeholder="e.g., 'React developer remote', 'marketing manager healthcare'" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoadingSearch || !profileLoaded} size="lg" className="w-full sm:w-auto">
                {isLoadingSearch ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Search className="mr-2 h-5 w-5" />
                )}
                {isLoadingSearch ? "Searching..." : "Find Jobs"}
              </Button>
            </form>
            {!profileLoaded && <p className="text-sm text-muted-foreground mt-2">Loading profile for matching...</p>}
             {profileLoaded && !userProfile && (
                <p className="text-sm text-amber-600 mt-3 flex items-center">
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Your profile is not set up. CV matching will be disabled. <Button variant="link" size="sm" className="p-0 h-auto ml-1" onClick={() => router.push('/profile')}>Set up profile</Button>
                </p>
            )}
          </Form>
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
                    <TableHead><FileTextIcon className="inline-block mr-1 h-4 w-4" />Requirements</TableHead>
                    <TableHead><CalendarDays className="inline-block mr-1 h-4 w-4" />Deadline</TableHead>
                    <TableHead className="text-center"><Percent className="inline-block mr-1 h-4 w-4" />CV Match</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobPostings.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.role}</TableCell>
                      <TableCell>{job.company}</TableCell>
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
            <p className="text-muted-foreground">AI is simulating job feeds based on your keywords...</p>
        </div>
      )}

      {!isLoadingSearch && jobPostings.length === 0 && form.formState.isSubmitted && (
         <Card className="text-center py-12">
            <CardHeader>
                <Rss className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <CardTitle className="font-headline text-2xl">No Simulated Jobs Found</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                The AI couldn't generate job postings for your keywords. Please try different or broader search terms.
                </p>
            </CardContent>
        </Card>
      )}
    </div>
    </TooltipProvider>
  );
}
