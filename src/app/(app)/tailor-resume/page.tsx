
"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from 'next/navigation'; 
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Download, Copy, FileText, Brain, Lightbulb, Loader2, Save, ListChecks } from "lucide-react";
import { tailorResumeFormSchema, type TailorResumeFormData } from "@/lib/schemas";
import { tailorResumeToJobDescription } from "@/ai/flows/tailor-resume-to-job-description";
import { improveResume } from "@/ai/flows/improve-resume-based-on-job-description";
import type { StoredResume } from "@/lib/types"; 
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from '@/components/ui/separator';

const TAILOR_RESUME_PREFILL_JD_KEY = "tailorResumePrefillJD";
const TAILOR_RESUME_PREFILL_RESUME_KEY = "tailorResumePrefillResume";


export default function TailorResumePage() {
  const { toast } = useToast();
  const router = useRouter(); 
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = useState(false);
  const [tailoredResume, setTailoredResume] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [jobTitleForSave, setJobTitleForSave] = useState<string>("");


  const form = useForm<TailorResumeFormData>({
    resolver: zodResolver(tailorResumeFormSchema),
    defaultValues: {
      jobDescription: "",
      resumeContent: "",
    },
  });

  useEffect(() => {
    try {
      const prefillResume = localStorage.getItem(TAILOR_RESUME_PREFILL_RESUME_KEY);
      const prefillJD = localStorage.getItem(TAILOR_RESUME_PREFILL_JD_KEY);

      if (prefillResume) {
        form.setValue("resumeContent", prefillResume);
        localStorage.removeItem(TAILOR_RESUME_PREFILL_RESUME_KEY); // Clean up
      }
      if (prefillJD) {
        form.setValue("jobDescription", prefillJD);
        localStorage.removeItem(TAILOR_RESUME_PREFILL_JD_KEY); // Clean up
      }

      // If prefill data was used, extract title for saving
      if (prefillJD) {
        const jdLines = prefillJD.split('\n');
        let extractedTitle = jdLines.find(line => /title/i.test(line) && !/job title/i.test(line) && line.length < 100)?.replace(/.*title\s*[:=-]?\s*/i, '').trim();
        if (!extractedTitle && jdLines[0] && jdLines[0].length < 100) {
          extractedTitle = jdLines[0].trim();
        }
        setJobTitleForSave(extractedTitle || "Untitled Job");
      }

    } catch (e) {
        console.error("Error reading prefill data from localStorage:", e);
        toast({title: "Info", description: "Could not load prefill data.", variant: "default"});
    }
    // TODO: Handle jdId from query params if needed for other flows
    // const jdId = searchParams.get('jdId');
    // if (jdId) { /* logic to load JD by ID */ }

  }, [form, toast, searchParams]);

  const onSubmit = async (data: TailorResumeFormData) => {
    setIsLoading(true);
    setTailoredResume(null);
    setAnalysis(null);
    setSuggestions(null);
    setError(null);

    // Try to extract a job title from the job description for naming the resume
    // This check is now also done in useEffect if data is prefilled
    if (!jobTitleForSave && data.jobDescription) {
        const jdLines = data.jobDescription.split('\n');
        let extractedTitle = jdLines.find(line => /title/i.test(line) && !/job title/i.test(line) && line.length < 100)?.replace(/.*title\s*[:=-]?\s*/i, '').trim();
        if (!extractedTitle && jdLines[0] && jdLines[0].length < 100) {
          extractedTitle = jdLines[0].trim();
        }
        setJobTitleForSave(extractedTitle || "Untitled Job");
    }


    try {
      const [tailorResult, improveResult] = await Promise.all([
        tailorResumeToJobDescription({ resume: data.resumeContent, jobDescription: data.jobDescription }),
        improveResume({ resume: data.resumeContent, jobDescription: data.jobDescription })
      ]);
      
      if (tailorResult.tailoredResume) {
        setTailoredResume(tailorResult.tailoredResume);
      } else {
        setError("The AI could not generate a tailored resume based on the input.");
      }
      if (tailorResult.analysis) {
        setAnalysis(tailorResult.analysis);
      }
      if (improveResult.suggestions) {
        setSuggestions(improveResult.suggestions);
      }

      if (tailorResult.tailoredResume) {
        toast({ title: "Resume Tailored!", description: "AI has customized your resume. It has been automatically saved." });
        handleSaveResume(tailorResult.tailoredResume, tailorResult.analysis, improveResult.suggestions, jobTitleForSave || "Tailored Resume");
      } else {
         toast({ title: "Suggestions Provided", description: "AI has provided suggestions for your resume." });
      }

    } catch (err) {
      console.error("Error tailoring resume:", err);
      let errorMessage = "Could not tailor resume. Please try again.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = (text: string | null) => {
    if (text) {
      navigator.clipboard.writeText(text);
      toast({ title: "Copied to clipboard!" });
    }
  };
  
  const handleDownload = (content: string | null, filename: string) => {
    if (!content) {
      toast({ title: "Download Error", description: "No content to download.", variant: "destructive" });
      return;
    }
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    toast({title: "Download Started", description: `${filename} is downloading.`});
  };

  const handleSaveResume = (
    currentTailoredResume: string | null,
    currentAnalysis: string | null,
    currentSuggestions: string | null,
    title: string
  ) => {
    if (currentTailoredResume) {
      const newResume: StoredResume = {
        id: `resume-${Date.now()}`,
        name: `${title} (Tailored ${new Date().toLocaleDateString()})`,
        tailoredContent: currentTailoredResume,
        aiAnalysis: currentAnalysis || undefined,
        aiSuggestions: currentSuggestions || undefined,
        createdAt: new Date().toISOString(),
      };

      try {
        const existingResumesString = localStorage.getItem("resumes");
        const existingResumes: StoredResume[] = existingResumesString ? JSON.parse(existingResumesString) : [];
        existingResumes.unshift(newResume); 
        localStorage.setItem("resumes", JSON.stringify(existingResumes));
        // toast({ title: "Resume Saved!", description: "Your tailored resume has been saved."}); // Already toasted
      } catch (e) {
        console.error("Failed to save resume to localStorage:", e);
        toast({ title: "Save Error", description: "Could not save resume to local storage.", variant: "destructive"});
      }
    } else {
      toast({ title: "Nothing to Save", description: "Please generate a tailored resume first.", variant: "destructive"});
    }
  };
  
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold">AI Resume Tailoring</h1>
        <p className="text-muted-foreground">
          Paste your base resume and a job description, then let our AI craft a perfectly aligned version.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="font-headline flex items-center"><FileText className="mr-2 h-5 w-5 text-primary"/> Your Base Resume</CardTitle>
              <CardDescription>Paste your current resume content here, or it will be pre-filled if coming from the Job Descriptions page with a saved profile.</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="resumeContent"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea 
                        placeholder="Paste your full resume text..." 
                        rows={15} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="font-headline flex items-center"><Brain className="mr-2 h-5 w-5 text-primary"/> Job Description</CardTitle>
              <CardDescription>Paste the job description you&apos;re targeting, or it will be pre-filled if coming from the Job Descriptions page.</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="jobDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea 
                        placeholder="Paste the full job description text..." 
                        rows={15} 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          <div className="lg:col-span-2 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button type="submit" size="lg" disabled={isLoading} className="min-w-[200px]">
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-5 w-5" />
              )}
              Forge My Resume
            </Button>
            {tailoredResume && (
                <Button type="button" size="lg" variant="outline" onClick={() => router.push('/resumes')} className="min-w-[200px]">
                    <ListChecks className="mr-2 h-5 w-5" />
                    View My Resumes
                </Button>
            )}
          </div>
        </form>
      </Form>

      {error && (
        <Alert variant="destructive" className="mt-8">
          <AlertTitle>An Error Occurred</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {(tailoredResume || analysis || suggestions) && !error && (
        <div className="space-y-8 pt-8">
          <Separator />
          <h2 className="font-headline text-2xl font-bold text-center">AI-Powered Results</h2>
          
          {tailoredResume && (
            <Card>
              <CardHeader>
                <CardTitle className="font-headline flex items-center"><FileText className="mr-2 h-5 w-5 text-primary"/> Tailored Resume</CardTitle>
                <div className="flex gap-2 pt-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => handleCopyToClipboard(tailoredResume)}><Copy className="mr-2 h-4 w-4" />Copy</Button>
                    <Button variant="outline" size="sm" onClick={() => handleDownload(tailoredResume, `${(jobTitleForSave || "Tailored_Resume").replace(/\s+/g, '_')}.txt`)}><Download className="mr-2 h-4 w-4" />Download (.txt)</Button>
                </div>
                <p className="text-xs text-muted-foreground pt-2">
                  The tailored resume is provided as a .txt file. You can copy the content and paste it into your preferred editor (e.g., Word, Google Docs) to format it as a PDF or Word document.
                  Your resume has been automatically saved.
                </p>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap bg-muted/50 p-4 rounded-md text-sm font-mono max-h-[500px] overflow-y-auto">{tailoredResume}</pre>
              </CardContent>
            </Card>
          )}

          {analysis && (
             <Card>
              <CardHeader>
                <CardTitle className="font-headline flex items-center"><Brain className="mr-2 h-5 w-5 text-primary"/> AI Analysis</CardTitle>
                 <Button variant="outline" size="sm" onClick={() => handleCopyToClipboard(analysis)} className="mt-2 w-fit"><Copy className="mr-2 h-4 w-4" />Copy Analysis</Button>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert p-4 bg-muted/50 rounded-md max-h-[400px] overflow-y-auto whitespace-pre-line" dangerouslySetInnerHTML={{ __html: analysis.replace(/\n/g, '<br />') }} />
              </CardContent>
            </Card>
          )}

          {suggestions && (
            <Card>
              <CardHeader>
                <CardTitle className="font-headline flex items-center"><Lightbulb className="mr-2 h-5 w-5 text-primary"/> AI Suggestions for Improvement</CardTitle>
                <Button variant="outline" size="sm" onClick={() => handleCopyToClipboard(suggestions)} className="mt-2 w-fit"><Copy className="mr-2 h-4 w-4" />Copy Suggestions</Button>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert p-4 bg-muted/50 rounded-md max-h-[400px] overflow-y-auto whitespace-pre-line" dangerouslySetInnerHTML={{ __html: suggestions.replace(/\n/g, '<br />') }} />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

    