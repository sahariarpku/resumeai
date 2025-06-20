
"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Loader2, Search, ExternalLink, Briefcase, Sparkles } from "lucide-react";
import { jobSearch } from "@/ai/flows/job-search-flow";
import { jobSearchFormSchema } from "@/lib/schemas";
import type { JobSearchInput, JobSearchResult } from "@/lib/schemas";
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { TAILOR_RESUME_PREFILL_JD_KEY, TAILOR_RESUME_PREFILL_RESUME_KEY, profileToResumeText } from '@/lib/profile-utils';
import type { UserProfile } from '@/lib/types';
import { db } from '@/lib/firebase';
import { doc, getDoc, enableNetwork } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

// SimpleMarkdownToHtmlDisplay component
const SimpleMarkdownToHtmlDisplay = ({ text }: { text: string | null }) => {
  if (!text) return null;

  let html = text;

  // Headings
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-3 mb-1">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-5 mb-3">$1</h1>');

  // Bold and Italic
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/__(.*?)__/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/_(.*?)_/g, '<em>$1</em>');

  // Lists (ul and ol)
  const lines = html.split('\n'); 
  let newHtmlLines = [];
  let inList = false;
  let listType = ''; 

  for (const line of lines) {
    const olMatch = line.match(/^(\d+)\.\s+(.*)/); 
    const ulMatch = line.match(/^(\*|-)\s+(.*)/);  

    if (olMatch) {
      const content = olMatch[2];
      if (!inList || listType !== 'ol') {
        if (inList) newHtmlLines.push(`</${listType}>`);
        newHtmlLines.push(`<ol class="list-decimal pl-5">`);
        inList = true;
        listType = 'ol';
      }
      newHtmlLines.push(`  <li>${content}</li>`);
    } else if (ulMatch) {
      const content = ulMatch[2];
      if (!inList || listType !== 'ul') {
        if (inList) newHtmlLines.push(`</${listType}>`);
        newHtmlLines.push(`<ul class="list-disc pl-5">`);
        inList = true;
        listType = 'ul';
      }
      newHtmlLines.push(`  <li>${content}</li>`);
    } else {
      if (inList) {
        newHtmlLines.push(`</${listType}>`);
        inList = false;
        listType = '';
      }
      newHtmlLines.push(line);
    }
  }

  if (inList) {
    newHtmlLines.push(`</${listType}>`);
  }
  html = newHtmlLines.join('\n'); 

  // Paragraphs - split by double newlines, then replace single newlines with <br>
  html = html.split(/\n\s*\n/) 
    .map(paragraph => {
      paragraph = paragraph.trim();
      if (paragraph === '') return '';
      // Avoid wrapping existing block elements like lists in <p>
      if (paragraph.match(/^\s*<(ul|ol|li|h[1-6]|div|section|article|aside|header|footer|nav|figure|table|blockquote|hr|pre|form)/i)) { 
        return paragraph; 
      }
      return `<p>${paragraph.replace(/\n/g, '<br />')}</p>`; 
    }).join('');
  
  // Clean up cases where a list might have been wrapped in a <p> tag
  html = html.replace(/<p>\s*(<(ul|ol)>.*?<\/(ul|ol)>)\s*<\/p>/gs, '$1'); 
  html = html.replace(/<p>\s*<\/p>/g, ''); // Remove empty paragraphs

  return <div className="prose prose-sm dark:prose-invert max-w-none break-words" dangerouslySetInnerHTML={{ __html: html }} />;
};


export default function JobSearchPage() {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const router = useRouter();
  const [searchResults, setSearchResults] = useState<JobSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const form = useForm<JobSearchInput>({
    resolver: zodResolver(jobSearchFormSchema),
    defaultValues: {
      keywords: "",
      location: "",
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (currentUser) {
        try {
          await enableNetwork(db);
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setUserProfile(userDocSnap.data() as UserProfile);
          }
        } catch (e) {
          // Non-critical error, so just log it.
        }
      }
    };
    fetchProfile();
  }, [currentUser]);

  const handleSearchSubmit = async (data: JobSearchInput) => {
    setIsLoading(true);
    setError(null);
    setSearchResults([]);
    toast({ title: "Searching for jobs...", description: "AI is searching for job postings based on your query." });

    try {
      const result = await jobSearch({
        keywords: data.keywords,
        location: data.location,
      });
      if (result && result.jobs) {
        setSearchResults(result.jobs);
        if (result.jobs.length === 0) {
          toast({ title: "No Results", description: "Found no job postings for your criteria. Try broadening your search." });
        } else {
          toast({ title: "Search Complete!", description: `Found ${result.jobs.length} job postings.` });
        }
      } else {
        throw new Error("Job search did not return the expected jobs format.");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during the job search.";
      setError(errorMessage);
      toast({ title: "Search Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTailorResumeForJob = (jobDescriptionText: string) => {
    if (!currentUser) {
      toast({ title: "Not Authenticated", description: "Please sign in to tailor resumes.", variant: "destructive" });
      return;
    }
    if (!userProfile) {
      toast({ title: "Profile Not Loaded", description: "Your profile needs to be loaded to pre-fill the resume. Please wait or go to My Profile.", variant: "default" });
      router.push('/profile');
      return;
    }
    const baseResumeText = profileToResumeText(userProfile);
    if (!baseResumeText.trim()) {
      toast({ title: "Profile Incomplete", description: "Your profile seems empty. Please complete it before tailoring.", variant: "default" });
      router.push('/profile');
      return;
    }
    localStorage.setItem(TAILOR_RESUME_PREFILL_RESUME_KEY, baseResumeText);
    localStorage.setItem(TAILOR_RESUME_PREFILL_JD_KEY, jobDescriptionText);
    router.push('/tailor-resume');
  };


  return (
    <TooltipProvider>
      <div className="container mx-auto py-8 space-y-8">
        <div>
          <h1 className="font-headline text-3xl font-bold flex items-center">
            <Search className="mr-3 h-8 w-8 text-primary" /> Job Search
          </h1>
          <p className="text-muted-foreground">
            Enter keywords and a location. The AI will search for relevant job postings across the web.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Find Your Next Opportunity</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSearchSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="keywords"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Keywords</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Software Engineer, React, Node.js" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., London, UK or Remote" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" className="w-full md:w-auto" disabled={isLoading || !currentUser}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="mr-2 h-4 w-4" />
                  )}
                  Search for Jobs
                </Button>
                 {!currentUser && <p className="text-sm text-destructive mt-2">Please sign in to use the job search.</p>}
              </form>
            </Form>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Search Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading && (
          <div className="text-center py-10">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Searching the web, please wait...</p>
          </div>
        )}

        {!isLoading && searchResults.length > 0 && (
          <div className="space-y-6">
            <h2 className="font-headline text-2xl font-bold">Job Search Results ({searchResults.length})</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {searchResults.map((job, index) => (
                <Card key={job.url || index} className="flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <Briefcase className="h-8 w-8 text-primary mb-2" />
                       {job.url && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" asChild>
                                <Link href={job.url} target="_blank" rel="noopener noreferrer" aria-label="Open job posting in new tab">
                                <ExternalLink className="h-4 w-4" />
                                </Link>
                            </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>View Original Post</p></TooltipContent>
                        </Tooltip>
                       )}
                    </div>
                    <CardTitle className="font-headline text-lg line-clamp-2" title={job.title || 'Job Posting'}>
                      {job.title || 'Job Posting'}
                    </CardTitle>
                    {job.company && <CardDescription>{job.company}</CardDescription>}
                    {job.location && <CardDescription className="text-xs">{job.location}</CardDescription>}
                  </CardHeader>
                  <CardContent className="flex-grow space-y-2">
                     <div className="text-xs text-muted-foreground max-h-40 overflow-y-auto border p-2 rounded-md bg-muted/30">
                       <SimpleMarkdownToHtmlDisplay text={job.markdownContent || 'No description provided.'} />
                     </div>
                     {job.url && <p className="text-xs text-muted-foreground">
                        <Link href={job.url} target="_blank" rel="noopener noreferrer" className="hover:underline break-all">
                            Source: {job.url}
                        </Link>
                     </p>}
                  </CardContent>
                  <CardFooter>
                     <Button className="w-full" onClick={() => handleTailorResumeForJob(job.markdownContent)} disabled={!currentUser || !userProfile}>
                        <Sparkles className="mr-2 h-4 w-4" /> Tailor Resume
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        )}
         {!isLoading && searchResults.length === 0 && form.formState.isSubmitted && (
           <Card className="text-center py-12">
             <CardHeader>
               <Search className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
               <CardTitle className="font-headline text-2xl">No Jobs Found</CardTitle>
             </CardHeader>
             <CardContent>
               <p className="text-muted-foreground">
                 We couldn't find any job postings for your criteria. Please try different keywords or a broader location.
               </p>
             </CardContent>
           </Card>
        )}
      </div>
    </TooltipProvider>
  );
}
