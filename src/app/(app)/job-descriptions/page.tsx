
"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Briefcase, ArrowRight, Trash2, Edit3, FileSearch, Sparkles, Loader2, Link as LinkIcon, DownloadCloud, BarChart3, Info } from "lucide-react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import type { JobDescriptionItem, UserProfile } from "@/lib/types";
import { jobDescriptionFormSchema, JobDescriptionFormData } from "@/lib/schemas";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { extractJobDetails } from "@/ai/flows/extract-job-details-flow";
import { extractTextFromHtml } from "@/ai/flows/extract-text-from-html-flow";
import { calculateProfileJdMatch } from "@/ai/flows/calculate-profile-jd-match-flow";
import { profileToResumeText } from '@/lib/profile-utils';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


const fallbackInitialJds: JobDescriptionItem[] = [
  // { id: "jd1", title: "Senior Software Engineer", company: "Tech Giant LLC", description: "Looking for a skilled SSE...", createdAt: new Date().toISOString() },
  // { id: "jd2", title: "Product Marketing Manager", company: "Startup Co.", description: "Join our fast-paced team...", createdAt: new Date().toISOString() },
];

const USER_PROFILE_STORAGE_KEY = "userProfile";
const JOB_DESCRIPTIONS_STORAGE_KEY = "jobDescriptions";
const TAILOR_RESUME_PREFILL_JD_KEY = "tailorResumePrefillJD";
const TAILOR_RESUME_PREFILL_RESUME_KEY = "tailorResumePrefillResume";


export default function JobDescriptionsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [jds, setJds] = useState<JobDescriptionItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJd, setEditingJd] = useState<JobDescriptionItem | null>(null);
  const [isExtractingDetails, setIsExtractingDetails] = useState(false);
  const [isProcessingUrl, setIsProcessingUrl] = useState(false);
  const [jdUrl, setJdUrl] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [calculatingMatchId, setCalculatingMatchId] = useState<string | null>(null);


  useEffect(() => {
    try {
      const storedJdsString = localStorage.getItem(JOB_DESCRIPTIONS_STORAGE_KEY);
      if (storedJdsString) {
        const storedJds = JSON.parse(storedJdsString) as JobDescriptionItem[];
        setJds(storedJds);
      } else {
        setJds([]); 
      }
    } catch (error) {
      console.error("Failed to load JDs from localStorage:", error);
      toast({
        title: "Load Error",
        description: "Could not load job descriptions from local storage.",
        variant: "destructive",
      });
      setJds(fallbackInitialJds); 
    }
    setIsLoaded(true);
  }, [toast]);

  useEffect(() => {
    if (isLoaded) { 
      try {
        localStorage.setItem(JOB_DESCRIPTIONS_STORAGE_KEY, JSON.stringify(jds));
      } catch (error) {
        console.error("Failed to save JDs to localStorage:", error);
        toast({
          title: "Save Error",
          description: "Could not save job descriptions to local storage.",
          variant: "destructive",
        });
      }
    }
  }, [jds, isLoaded, toast]);


  const form = useForm<JobDescriptionFormData>({
    resolver: zodResolver(jobDescriptionFormSchema),
    defaultValues: {
      title: "",
      company: "",
      description: "",
    },
  });

  const handleAddOrEditJd = (data: JobDescriptionFormData) => {
    if (editingJd) {
      setJds(prevJds => prevJds.map(jd => jd.id === editingJd.id ? { ...jd, ...data } : jd)); // Preserve match score
      toast({ title: "Job Description Updated!" });
    } else {
      const newJd: JobDescriptionItem = {
        id: `jd-${Date.now()}`,
        ...data,
        createdAt: new Date().toISOString(),
      };
      setJds(prevJds => [newJd, ...prevJds]);
      toast({ title: "Job Description Saved!" });
    }
    setIsModalOpen(false);
    setEditingJd(null);
    setJdUrl("");
    form.reset();
  };

  const openAddModal = () => {
    setEditingJd(null);
    form.reset();
    setJdUrl("");
    setIsModalOpen(true);
  };

  const openEditModal = (jd: JobDescriptionItem) => {
    setEditingJd(jd);
    form.reset({title: jd.title, company: jd.company, description: jd.description}); 
    setJdUrl("");
    setIsModalOpen(true);
  };

  const handleDeleteJd = (id: string) => {
    setJds(prevJds => prevJds.filter(jd => jd.id !== id));
    toast({ title: "Job Description Deleted", variant: "destructive" });
  };

  const handleExtractDetailsFromText = async () => {
    const descriptionValue = form.getValues("description");
    if (!descriptionValue || descriptionValue.trim().length < 50) {
      toast({
        title: "Cannot Extract Details",
        description: "Please ensure the job description field has sufficient content (at least 50 characters).",
        variant: "default",
      });
      return;
    }

    setIsExtractingDetails(true);
    try {
      const result = await extractJobDetails({ jobDescriptionText: descriptionValue });
      form.setValue("title", result.jobTitle, { shouldValidate: true });
      form.setValue("company", result.companyName, { shouldValidate: true });
      
      toast({
        title: "Extraction Attempted!",
        description: "Job title and company name fields have been updated. Please review them.",
      });
    } catch (err) {
      console.error("Error extracting job details from text:", err);
      let errorMessage = "Could not extract details from text. Please try again or fill them manually.";
      if (err instanceof Error && err.message) {
        errorMessage = `Extraction failed: ${err.message}`;
      }
      toast({
        title: "Extraction Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsExtractingDetails(false);
    }
  };

  const handleFetchAndProcessUrl = async () => {
    if (!jdUrl.trim() || !jdUrl.startsWith("http")) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL (starting with http or https).",
        variant: "default"
      });
      return;
    }
    setIsProcessingUrl(true);
    toast({
        title: "Processing URL...",
        description: "Fetching content and extracting text. This may take a moment.",
        variant: "default"
    });

    try {
      const fetchResponse = await fetch(`/api/fetch-url-content?url=${encodeURIComponent(jdUrl)}`);
      if (!fetchResponse.ok) {
        const errorData = await fetchResponse.json();
        throw new Error(errorData.error || `Failed to fetch URL: ${fetchResponse.statusText}`);
      }
      const { htmlContent } = await fetchResponse.json();

      if (!htmlContent) {
        toast({
          title: "No Content Fetched",
          description: "The URL did not return any HTML content.",
          variant: "default"
        });
        setIsProcessingUrl(false);
        return;
      }
      
      const textExtractionResult = await extractTextFromHtml({ htmlContent });
      
      if (textExtractionResult.extractedText && textExtractionResult.extractedText.trim().length > 0) {
        form.setValue("description", textExtractionResult.extractedText, { shouldValidate: true });
        toast({
          title: "Text Extracted!",
          description: "Job description populated. Now extracting title & company..."
        });

        const detailsExtractionResult = await extractJobDetails({ jobDescriptionText: textExtractionResult.extractedText });
        form.setValue("title", detailsExtractionResult.jobTitle, { shouldValidate: true });
        form.setValue("company", detailsExtractionResult.companyName, { shouldValidate: true });
        toast({
          title: "Details Extracted!",
          description: "Job title and company fields updated. Please review."
        });

      } else {
        toast({
          title: "No Text Extracted",
          description: "Could not extract meaningful job description text from the URL's content.",
          variant: "default"
        });
      }

    } catch (err) {
      console.error("Error fetching/extracting from URL:", err);
      let errorMessage = "Could not process the URL. Please try again or paste content manually.";
      if (err instanceof Error && err.message) {
        errorMessage = `Processing failed: ${err.message}`;
      }
      toast({
        title: "URL Processing Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessingUrl(false);
    }
  };


  const handleTailorResumeWithProfile = (jd: JobDescriptionItem) => {
    try {
      const storedProfileString = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
      if (!storedProfileString) {
        toast({
          title: "Profile Not Found",
          description: "Please complete your profile first before tailoring with it.",
          variant: "default",
        });
        router.push('/profile'); 
        return;
      }
      const userProfile = JSON.parse(storedProfileString) as UserProfile;
      const baseResumeText = profileToResumeText(userProfile);

      if (!baseResumeText.trim()) {
         toast({
          title: "Profile Incomplete",
          description: "Your profile seems empty. Please add some details to generate a base resume.",
          variant: "default",
        });
        router.push('/profile');
        return;
      }
      
      localStorage.setItem(TAILOR_RESUME_PREFILL_RESUME_KEY, baseResumeText);
      localStorage.setItem(TAILOR_RESUME_PREFILL_JD_KEY, jd.description);

      router.push('/tailor-resume');

    } catch (error) {
      console.error("Error preparing for resume tailoring:", error);
      toast({
        title: "Error",
        description: "Could not prepare data for resume tailoring. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCalculateMatchScore = async (jdId: string) => {
    setCalculatingMatchId(jdId);
    try {
      const storedProfileString = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
      if (!storedProfileString) {
        toast({
          title: "Profile Not Found",
          description: "Please complete your profile first to calculate match scores.",
          variant: "default",
        });
        router.push('/profile');
        setCalculatingMatchId(null);
        return;
      }
      const userProfile = JSON.parse(storedProfileString) as UserProfile;
      const profileText = profileToResumeText(userProfile);

      if (!profileText.trim()) {
        toast({
          title: "Profile Incomplete",
          description: "Your profile is empty. Please add details to calculate match scores.",
          variant: "default",
        });
        router.push('/profile');
        setCalculatingMatchId(null);
        return;
      }

      const currentJd = jds.find(jd => jd.id === jdId);
      if (!currentJd) {
        toast({ title: "Error", description: "Job description not found.", variant: "destructive" });
        setCalculatingMatchId(null);
        return;
      }

      const matchResult = await calculateProfileJdMatch({
        profileText: profileText,
        jobDescriptionText: currentJd.description,
      });

      setJds(prevJds =>
        prevJds.map(jd =>
          jd.id === jdId
            ? { ...jd, 
                matchPercentage: matchResult.matchPercentage, 
                matchSummary: matchResult.matchSummary,
                matchCategory: matchResult.matchCategory,
              }
            : jd
        )
      );
      toast({ title: "Match Score Calculated!", description: `Score for "${currentJd.title}" is ${matchResult.matchPercentage}%.` });

    } catch (error) {
      console.error("Error calculating match score:", error);
      let errorMessage = "Could not calculate match score.";
      if (error instanceof Error) errorMessage = `Calculation failed: ${error.message}`;
      toast({ title: "Match Score Error", description: errorMessage, variant: "destructive" });
    } finally {
      setCalculatingMatchId(null);
    }
  };


  if (!isLoaded) {
    return (
      <div className="container mx-auto py-8 text-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading job descriptions...</p>
      </div>
    );
  }

  const getMatchBadgeVariant = (category?: JobDescriptionItem['matchCategory']): "default" | "secondary" | "destructive" | "outline" => {
    if (!category) return "outline";
    switch (category) {
        case "Excellent Match": return "default"; // primary color
        case "Good Match": return "secondary"; // Toned down success
        case "Fair Match": return "outline"; // Neutral
        case "Poor Match": return "destructive";
        default: return "outline";
    }
  };

  return (
    <TooltipProvider>
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-headline text-3xl font-bold">Job Descriptions</h1>
          <p className="text-muted-foreground">
            Manage saved JDs, tailor resumes, and see profile match scores.
          </p>
        </div>
        <Button onClick={openAddModal} size="lg">
          <PlusCircle className="mr-2 h-5 w-5" /> Add New JD
        </Button>
      </div>

      {jds.length === 0 ? (
        <Card className="text-center py-12">
          <CardHeader>
            <FileSearch className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <CardTitle className="font-headline text-2xl">No Job Descriptions Yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Start by adding a job description to tailor your resume.
            </p>
            <Button onClick={openAddModal}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Your First JD
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jds.map((jd) => (
            <Card key={jd.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Briefcase className="h-8 w-8 text-primary" />
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditModal(jd)}><Edit3 className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteJd(jd.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                <CardTitle className="font-headline text-xl">{jd.title}</CardTitle>
                {jd.company && <CardDescription>{jd.company}</CardDescription>}
                {jd.matchPercentage !== undefined && jd.matchCategory && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                        <Badge variant={getMatchBadgeVariant(jd.matchCategory)} className="mt-2 cursor-default">
                           {jd.matchCategory}: {jd.matchPercentage}%
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs p-2">
                        <p className="text-sm font-medium">Match Summary:</p>
                        <p className="text-xs text-muted-foreground">{jd.matchSummary || "No summary available."}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-3">{jd.description}</p>
              </CardContent>
              <CardFooter className="flex flex-col gap-2 items-stretch">
                {jd.matchPercentage === undefined && (
                    <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={() => handleCalculateMatchScore(jd.id)}
                        disabled={calculatingMatchId === jd.id}
                    >
                        {calculatingMatchId === jd.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <BarChart3 className="mr-2 h-4 w-4" />}
                        Calculate Match Score
                    </Button>
                )}
                <Button className="w-full" onClick={() => handleTailorResumeWithProfile(jd)}>
                    Tailor Resume <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={(isOpen) => { setIsModalOpen(isOpen); if (!isOpen) setJdUrl(""); }}>
        <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
            <DialogTitle className="font-headline">{editingJd ? "Edit Job Description" : "Add New Job Description"}</DialogTitle>
            <DialogDescription>
                {editingJd ? "Update the details of this job description." : "Save a job description to tailor resumes for it later. You can paste a URL to try and auto-fill the description."}
            </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-2">
                <div className="flex items-end gap-2">
                    <div className="flex-grow space-y-1">
                        <Label htmlFor="jdUrlInput">Job Posting URL (Optional)</Label>
                        <Input 
                            id="jdUrlInput"
                            placeholder="https://example.com/job-posting" 
                            value={jdUrl}
                            onChange={(e) => setJdUrl(e.target.value)}
                            disabled={isProcessingUrl}
                        />
                    </div>
                    <Button 
                        type="button" 
                        onClick={handleFetchAndProcessUrl} 
                        disabled={isProcessingUrl || !jdUrl.trim()}
                        variant="outline"
                    >
                        {isProcessingUrl ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DownloadCloud className="mr-2 h-4 w-4" />}
                        Fetch & Process
                    </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                    Pasting a URL will attempt to fetch the content, extract the job description text, and then extract the title/company.
                </div>
            </div>
            <Separator />

            <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddOrEditJd)} className="space-y-6 pt-4">
                <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Job Title</FormLabel>
                    <FormControl><Input placeholder="e.g. Software Engineer" {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Company (Optional)</FormLabel>
                    <FormControl><Input placeholder="e.g. Acme Corp" {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center mb-1">
                        <FormLabel>Job Description</FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleExtractDetailsFromText}
                          disabled={isExtractingDetails || isProcessingUrl}
                        >
                          {isExtractingDetails ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="mr-2 h-4 w-4" />
                          )}
                          AI Extract Details
                        </Button>
                      </div>
                      <FormControl><Textarea placeholder="Paste the full job description here, or use the URL fetch option above." {...field} rows={10} /></FormControl>
                      <FormMessage />
                    </FormItem>
                )}
                />
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button type="submit" disabled={isProcessingUrl || isExtractingDetails}>{editingJd ? "Save Changes" : "Add Job Description"}</Button>
                </DialogFooter>
            </form>
            </Form>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
}

    