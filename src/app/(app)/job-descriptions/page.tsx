
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
import { PlusCircle, Briefcase, ArrowRight, Trash2, Edit3, Sparkles, Loader2, DownloadCloud, BarChart3, Info, ClipboardList } from "lucide-react";
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
  DialogClose,
} from "@/components/ui/dialog";
import { extractJobDetails } from "@/ai/flows/extract-job-details-flow";
import { extractTextFromHtml } from "@/ai/flows/extract-text-from-html-flow";
import { calculateProfileJdMatch } from "@/ai/flows/calculate-profile-jd-match-flow";
import { profileToResumeText } from '@/lib/profile-utils';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, setDoc, deleteDoc, Timestamp, getDoc, enableNetwork } from "firebase/firestore"; 

const TAILOR_RESUME_PREFILL_JD_KEY = "tailorResumePrefillJD";
const TAILOR_RESUME_PREFILL_RESUME_KEY = "tailorResumePrefillResume";


export default function JobDescriptionsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { currentUser } = useAuth();
  const [jds, setJds] = useState<JobDescriptionItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJd, setEditingJd] = useState<JobDescriptionItem | null>(null);
  const [isExtractingDetails, setIsExtractingDetails] = useState(false);
  const [isProcessingUrl, setIsProcessingUrl] = useState(false);
  const [jdUrl, setJdUrl] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [calculatingMatchId, setCalculatingMatchId] = useState<string | null>(null);


  const form = useForm<JobDescriptionFormData>({
    resolver: zodResolver(jobDescriptionFormSchema),
    defaultValues: { title: "", company: "", description: "" },
  });

  useEffect(() => {
    if (!currentUser) {
      setJds([]);
      setIsLoaded(true);
      return;
    }
    setIsLoaded(false);
    const jdsCollectionRef = collection(db, "users", currentUser.uid, "jobDescriptions");
    const q = query(jdsCollectionRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedJds = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          ...data,
          id: docSnap.id,
          createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
        } as JobDescriptionItem;
      });
      setJds(fetchedJds);
      setIsLoaded(true);
    }, (error) => {
      console.error("Error fetching job descriptions:", error);
      let description = "Could not load job applications.";
      if (error instanceof Error && error.message.toLowerCase().includes("offline")) {
        description = "Failed to load job applications: You appear to be offline. Please check your internet connection.";
      } else if (error instanceof Error && error.message.includes("FIRESTORE_UNAVAILABLE")) {
         description = "Firestore is currently unavailable. Job applications cannot be loaded. Please check your Firebase setup and internet connection.";
      } else if (error instanceof Error) {
        description = `Could not load job applications: ${error.message}.`;
      }
      toast({ title: "Load Error", description, variant: "destructive" });
      setIsLoaded(true);
    });

    return () => unsubscribe();
  }, [currentUser, toast]);


  const handleAddOrEditJd = async (data: JobDescriptionFormData) => {
    if (!currentUser) {
      toast({ title: "Not Authenticated", variant: "destructive" });
      return;
    }

    const jdDataToSave = {
        ...data,
        createdAt: editingJd?.createdAt ? (typeof editingJd.createdAt === 'string' ? Timestamp.fromDate(new Date(editingJd.createdAt)) : editingJd.createdAt) : Timestamp.now(),
        userId: currentUser.uid,
        ...(editingJd && { 
            matchPercentage: editingJd.matchPercentage,
            matchSummary: editingJd.matchSummary,
            matchCategory: editingJd.matchCategory,
        })
    };

    try {
      await enableNetwork(db);
      if (editingJd && editingJd.id) {
        const jdDocRef = doc(db, "users", currentUser.uid, "jobDescriptions", editingJd.id);
        await setDoc(jdDocRef, jdDataToSave, { merge: true });
        toast({ title: "Job Application Updated!" });
      } else {
        const newJdId = `jd-${Date.now()}`; 
        const jdDocRef = doc(db, "users", currentUser.uid, "jobDescriptions", newJdId);
        await setDoc(jdDocRef, { ...jdDataToSave, id: newJdId }); 
        toast({ title: "Job Application Saved!" });
      }
      setIsModalOpen(false);
      setEditingJd(null);
      setJdUrl("");
      form.reset({ title: "", company: "", description: "" });
    } catch (error) {
      console.error("Error saving JD to Firestore:", error);
      let description = "Could not save job application.";
      if (error instanceof Error && error.message.toLowerCase().includes("offline")) {
        description = "Failed to save job application: You appear to be offline. Please check your internet connection.";
      } else if (error instanceof Error && error.message.includes("FIRESTORE_UNAVAILABLE")) {
         description = "Firestore is currently unavailable. Job application could not be saved. Please check your Firebase setup and internet connection.";
      } else if (error instanceof Error) {
        description = `Could not save job application: ${error.message}.`;
      }
      toast({ title: "Save Error", description, variant: "destructive" });
    }
  };

  const openAddModal = () => {
    setEditingJd(null);
    form.reset({ title: "", company: "", description: "" });
    setJdUrl("");
    setIsModalOpen(true);
  };

  const openEditModal = (jd: JobDescriptionItem) => {
    setEditingJd(jd);
    form.reset({title: jd.title, company: jd.company, description: jd.description}); 
    setJdUrl("");
    setIsModalOpen(true);
  };

  const handleDeleteJd = async (id: string) => {
    if (!currentUser) {
      toast({ title: "Not Authenticated", variant: "destructive" });
      return;
    }
    try {
      await enableNetwork(db);
      const jdDocRef = doc(db, "users", currentUser.uid, "jobDescriptions", id);
      await deleteDoc(jdDocRef);
      toast({ title: "Job Application Deleted", variant: "destructive" });
    } catch (error) {
      console.error("Error deleting JD from Firestore:", error);
      let description = "Could not delete job application.";
      if (error instanceof Error && error.message.toLowerCase().includes("offline")) {
        description = "Failed to delete job application: You appear to be offline. Please check your connection.";
      } else if (error instanceof Error && error.message.includes("FIRESTORE_UNAVAILABLE")) {
         description = "Firestore is currently unavailable. Job application could not be deleted. Please check your Firebase setup and internet connection.";
      } else if (error instanceof Error) {
        description = `Could not delete job application: ${error.message}.`;
      }
      toast({ title: "Delete Error", description, variant: "destructive" });
    }
  };

  const handleExtractDetailsFromText = async () => {
    const descriptionValue = form.getValues("description");
    if (!descriptionValue || descriptionValue.trim().length < 50) {
      toast({ title: "Cannot Extract Details", description: "Please ensure the job description field has sufficient content (at least 50 characters).", variant: "default" });
      return;
    }
    setIsExtractingDetails(true);
    try {
      const result = await extractJobDetails({ jobDescriptionText: descriptionValue });
      form.setValue("title", result.jobTitle, { shouldValidate: true });
      form.setValue("company", result.companyName, { shouldValidate: true });
      toast({ title: "Extraction Attempted!", description: "Job title and company name fields have been updated. Please review them." });
    } catch (err) {
      console.error("Error extracting job details from text:", err);
      let description = `Extraction failed: ${err instanceof Error ? err.message : 'Unknown error'}`;
      if (err instanceof Error && err.message.toLowerCase().includes("offline")) {
        description = "Extraction failed: You appear to be offline. Please check your internet connection.";
      }
      toast({ title: "Extraction Error", description, variant: "destructive" });
    } finally {
      setIsExtractingDetails(false);
    }
  };

  const handleFetchAndProcessUrl = async () => {
    if (!jdUrl.trim() || !jdUrl.startsWith("http")) {
      toast({ title: "Invalid URL", description: "Please enter a valid URL (starting with http or https).", variant: "default" });
      return;
    }
    setIsProcessingUrl(true);
    toast({ title: "Processing URL...", description: "Fetching content and extracting text. This may take a moment.", variant: "default" });
    try {
      const fetchResponse = await fetch(`/api/fetch-url-content?url=${encodeURIComponent(jdUrl)}`);
      if (!fetchResponse.ok) { const errorData = await fetchResponse.json(); throw new Error(errorData.error || `Failed to fetch URL: ${fetchResponse.statusText}`); }
      const { htmlContent } = await fetchResponse.json();
      if (!htmlContent) { toast({ title: "No Content Fetched", description: "The URL did not return any HTML content.", variant: "default" }); setIsProcessingUrl(false); return; }
      const textExtractionResult = await extractTextFromHtml({ htmlContent });
      if (textExtractionResult.extractedText && textExtractionResult.extractedText.trim().length > 0) {
        form.setValue("description", textExtractionResult.extractedText, { shouldValidate: true });
        toast({ title: "Text Extracted!", description: "Job description populated. Now extracting title & company..." });
        const detailsExtractionResult = await extractJobDetails({ jobDescriptionText: textExtractionResult.extractedText });
        form.setValue("title", detailsExtractionResult.jobTitle, { shouldValidate: true });
        form.setValue("company", detailsExtractionResult.companyName, { shouldValidate: true });
        toast({ title: "Details Extracted!", description: "Job title and company fields updated. Please review." });
      } else {
        toast({ title: "No Text Extracted", description: "Could not extract meaningful job description text from the URL's content.", variant: "default" });
      }
    } catch (err) {
      console.error("Error fetching/extracting from URL:", err);
      let description = `Processing failed: ${err instanceof Error ? err.message : 'Unknown error'}`;
      if (err instanceof Error && err.message.toLowerCase().includes("offline")) {
        description = "URL Processing failed: You appear to be offline. Please check your internet connection.";
      }
      toast({ title: "URL Processing Error", description, variant: "destructive" });
    } finally {
      setIsProcessingUrl(false);
    }
  };

  const handleTailorResumeWithProfile = async (jd: JobDescriptionItem) => {
    if (!currentUser) { toast({ title: "Not Authenticated", variant: "destructive" }); return; }
    try {
      await enableNetwork(db);
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        toast({ title: "Profile Not Found", description: "Please complete your profile first.", variant: "default" });
        router.push('/profile'); return;
      }
      const userProfile = userDocSnap.data() as UserProfile;
      const baseResumeText = profileToResumeText(userProfile);
      if (!baseResumeText.trim()) {
         toast({ title: "Profile Incomplete", description: "Your profile seems empty.", variant: "default" });
         router.push('/profile'); return;
      }
      localStorage.setItem(TAILOR_RESUME_PREFILL_RESUME_KEY, baseResumeText);
      localStorage.setItem(TAILOR_RESUME_PREFILL_JD_KEY, jd.description);
      router.push('/tailor-resume');
    } catch (error) {
      console.error("Error preparing for resume tailoring:", error);
      let description = "Could not prepare data for resume tailoring.";
      if (error instanceof Error && error.message.toLowerCase().includes("offline")) {
        description = "Failed to prepare for tailoring: You appear to be offline. Please check your internet connection.";
      } else if (error instanceof Error && error.message.includes("FIRESTORE_UNAVAILABLE")) {
         description = "Firestore is currently unavailable. Cannot prepare for tailoring. Please check your Firebase setup and internet connection.";
      } else if (error instanceof Error) {
        description = `Could not prepare data: ${error.message}.`;
      }
      toast({ title: "Error", description, variant: "destructive" });
    }
  };

  const handleCalculateMatchScore = async (jdId: string) => {
    if (!currentUser) { toast({ title: "Not Authenticated", variant: "destructive" }); return; }
    setCalculatingMatchId(jdId);
    try {
      await enableNetwork(db);
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        toast({ title: "Profile Not Found", description: "Please complete your profile first.", variant: "default" });
        router.push('/profile'); setCalculatingMatchId(null); return;
      }
      const userProfile = userDocSnap.data() as UserProfile;
      const profileText = profileToResumeText(userProfile);
      if (!profileText.trim()) {
        toast({ title: "Profile Incomplete", description: "Your profile is empty.", variant: "default" });
        router.push('/profile'); setCalculatingMatchId(null); return;
      }
      const currentJd = jds.find(jd => jd.id === jdId);
      if (!currentJd) { toast({ title: "Error", description: "Job application not found.", variant: "destructive" }); setCalculatingMatchId(null); return; }

      const matchResult = await calculateProfileJdMatch({ profileText: profileText, jobDescriptionText: currentJd.description });
      
      const jdDocToUpdateRef = doc(db, "users", currentUser.uid, "jobDescriptions", jdId);
      await setDoc(jdDocToUpdateRef, { 
          matchPercentage: matchResult.matchPercentage, 
          matchSummary: matchResult.matchSummary,
          matchCategory: matchResult.matchCategory,
      }, { merge: true });
      toast({ title: "Match Score Calculated!", description: `Score for "${currentJd.title}" is ${matchResult.matchPercentage}%.` });
    } catch (error) {
      console.error("Error calculating match score:", error);
      let description = `Calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      if (error instanceof Error && error.message.toLowerCase().includes("offline")) {
        description = "Failed to calculate match score: You appear to be offline. Please check your internet connection.";
      } else if (error instanceof Error && error.message.includes("FIRESTORE_UNAVAILABLE")) {
         description = "Firestore is currently unavailable. Match score could not be calculated. Please check your Firebase setup and internet connection.";
      }
      toast({ title: "Match Score Error", description, variant: "destructive" });
    } finally {
      setCalculatingMatchId(null);
    }
  };

  if (!isLoaded && !currentUser) { 
    return (
      <div className="container mx-auto py-8 text-center">
        <p className="mt-4 text-muted-foreground">Please sign in to manage your job applications.</p>
      </div>
    );
  }
  if (!isLoaded && currentUser) { 
     return (
      <div className="container mx-auto py-8 text-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading job applications...</p>
      </div>
    );
  }

  const getMatchBadgeVariant = (category?: JobDescriptionItem['matchCategory']): "default" | "secondary" | "destructive" | "outline" => {
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
        <div><h1 className="font-headline text-3xl font-bold">Jobs to Apply</h1><p className="text-muted-foreground">Manage saved job applications, tailor resumes, and see profile match scores.</p></div>
        <Button onClick={openAddModal} size="lg" disabled={!currentUser}><PlusCircle className="mr-2 h-5 w-5" /> Add New Job</Button>
      </div>

      {!currentUser ? (
         <Card className="text-center py-12"><CardHeader><ClipboardList className="mx-auto h-16 w-16 text-muted-foreground mb-4" /><CardTitle className="font-headline text-2xl">Sign In to Get Started</CardTitle></CardHeader><CardContent><p className="text-muted-foreground mb-4">Please sign in to add and manage your job applications.</p><Button onClick={() => router.push('/auth/signin')}>Sign In</Button></CardContent></Card>
      ) : jds.length === 0 && isLoaded ? (
        <Card className="text-center py-12"><CardHeader><ClipboardList className="mx-auto h-16 w-16 text-muted-foreground mb-4" /><CardTitle className="font-headline text-2xl">No Jobs Added Yet</CardTitle></CardHeader><CardContent><p className="text-muted-foreground mb-4">Start by adding a job you want to apply for to tailor your resume.</p><Button onClick={openAddModal}><PlusCircle className="mr-2 h-4 w-4" /> Add Your First Job</Button></CardContent></Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jds.map((jd) => (
            <Card key={jd.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start mb-2"><Briefcase className="h-8 w-8 text-primary" /><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => openEditModal(jd)}><Edit3 className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleDeleteJd(jd.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></div></div>
                <CardTitle className="font-headline text-xl">{jd.title}</CardTitle>
                {jd.company && <CardDescription>{jd.company}</CardDescription>}
                {jd.matchPercentage !== undefined && jd.matchCategory && (
                  <Tooltip><TooltipTrigger asChild><Badge variant={getMatchBadgeVariant(jd.matchCategory)} className="mt-2 cursor-default">{jd.matchCategory}: {jd.matchPercentage}%</Badge></TooltipTrigger><TooltipContent side="top" className="max-w-xs p-2"><p className="text-sm font-medium">Match Summary:</p><p className="text-xs text-muted-foreground">{jd.matchSummary || "No summary available."}</p></TooltipContent></Tooltip>
                )}
              </CardHeader>
              <CardContent className="flex-grow"><p className="text-sm text-muted-foreground line-clamp-3">{jd.description}</p></CardContent>
              <CardFooter className="flex flex-col gap-2 items-stretch">
                {jd.matchPercentage === undefined && (<Button variant="outline" className="w-full" onClick={() => handleCalculateMatchScore(jd.id)} disabled={calculatingMatchId === jd.id}>{calculatingMatchId === jd.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <BarChart3 className="mr-2 h-4 w-4" />}Calculate Match Score</Button>)}
                <Button className="w-full" onClick={() => handleTailorResumeWithProfile(jd)}>Tailor Resume <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={(isOpen) => { setIsModalOpen(isOpen); if (!isOpen) setJdUrl(""); }}>
        <DialogContent className="sm:max-w-2xl">
            <DialogHeader><DialogTitle className="font-headline">{editingJd ? "Edit Job Application" : "Add New Job Application"}</DialogTitle><DialogDescription>{editingJd ? "Update the details of this job application." : "Save a job application to tailor resumes for it later. You can paste a URL to try and auto-fill the description."}</DialogDescription></DialogHeader>
            <div className="space-y-4 py-2">
                <div className="flex items-end gap-2">
                    <div className="flex-grow space-y-1"><Label htmlFor="jdUrlInput">Job Posting URL (Optional)</Label><Input id="jdUrlInput" placeholder="https://example.com/job-posting" value={jdUrl} onChange={(e) => setJdUrl(e.target.value)} disabled={isProcessingUrl}/></div>
                    <Button type="button" onClick={handleFetchAndProcessUrl} disabled={isProcessingUrl || !jdUrl.trim()} variant="outline">{isProcessingUrl ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DownloadCloud className="mr-2 h-4 w-4" />}Fetch & Process</Button>
                </div><div className="text-xs text-muted-foreground">Pasting a URL will attempt to fetch the content, extract the job description text, and then extract the title/company.</div>
            </div><Separator />
            <Form {...form}><form onSubmit={form.handleSubmit(handleAddOrEditJd)} className="space-y-6 pt-4">
                <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Job Title</FormLabel><FormControl><Input placeholder="e.g. Software Engineer" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="company" render={({ field }) => (<FormItem><FormLabel>Company (Optional)</FormLabel><FormControl><Input placeholder="e.g. Acme Corp" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center mb-1"><FormLabel>Job Description</FormLabel>
                        <Button type="button" variant="outline" size="sm" onClick={handleExtractDetailsFromText} disabled={isExtractingDetails || isProcessingUrl}>
                          {isExtractingDetails ? (<Loader2 className="mr-2 h-4 w-4 animate-spin" />) : (<Sparkles className="mr-2 h-4 w-4" />)}AI Extract Details
                        </Button>
                      </div><FormControl><Textarea placeholder="Paste the full job description here, or use the URL fetch option above." {...field} rows={10} /></FormControl><FormMessage />
                    </FormItem> )}/>
                <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit" disabled={isProcessingUrl || isExtractingDetails}>{editingJd ? "Save Changes" : "Add Job Application"}</Button></DialogFooter>
            </form></Form>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
}

