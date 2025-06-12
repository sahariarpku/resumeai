
"use client";

import React, { useState } from 'react';
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
// import { Textarea } from "@/components/ui/textarea"; // Using plain textarea for now
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"; // Using divs for now
// import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"; // Not using Form component for now
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Download, Copy, FileText, Brain, Lightbulb, Loader2, Save } from "lucide-react";
// import { tailorResumeFormSchema, TailorResumeFormData } from "@/lib/schemas";
// import { tailorResumeToJobDescription } from "@/ai/flows/tailor-resume-to-job-description";
// import { improveResume } from "@/ai/flows/improve-resume-based-on-job-description";
// import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// import { Separator } from '@/components/ui/separator'; // Using hr for now

export default function TailorResumePage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [tailoredResume, setTailoredResume] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string | null>(null);

  // const form = useForm<TailorResumeFormData>({
  //   resolver: zodResolver(tailorResumeFormSchema),
  //   defaultValues: {
  //     jobDescription: "",
  //     resumeContent: "",
  //   },
  // });

  // const onSubmit = async (data: TailorResumeFormData) => {
  //   setIsLoading(true);
  //   setTailoredResume(null);
  //   setAnalysis(null);
  //   setSuggestions(null);

  //   try {
  //     const [tailorResult, improveResult] = await Promise.all([
  //       tailorResumeToJobDescription({ resume: data.resumeContent, jobDescription: data.jobDescription }),
  //       improveResume({ resume: data.resumeContent, jobDescription: data.jobDescription })
  //     ]);
      
  //     setTailoredResume(tailorResult.tailoredResume);
  //     setAnalysis(tailorResult.analysis);
  //     setSuggestions(improveResult.suggestions);

  //     toast({ title: "Resume Tailored!", description: "AI has customized your resume." });
  //   } catch (error) {
  //     console.error("Error tailoring resume:", error);
  //     toast({
  //       title: "Error",
  //       description: "Could not tailor resume. Please try again.",
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // const handleCopyToClipboard = (text: string | null) => {
  //   if (text) {
  //     navigator.clipboard.writeText(text);
  //     toast({ title: "Copied to clipboard!" });
  //   }
  // };
  
  // const handleDownload = (content: string | null, filename: string) => {
  //   console.log("handleDownload (placeholder for debugging)");
  //   toast({ title: "Download (Placeholder)" });
  // };
  
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold">AI Resume Tailoring</h1>
        <p className="text-muted-foreground">
          Paste your base resume and a job description, then let our AI craft a perfectly aligned version.
        </p>
      </div>

      {/* Simplified form section to avoid using 'form' which is now commented out */}
      <form onSubmit={(e) => { e.preventDefault(); console.log("Form submit (placeholder)"); toast({ title: "Submit Placeholder"}) }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Base Resume Input Area */}
          <div className="lg:col-span-1 p-6 border rounded-lg shadow-sm bg-card text-card-foreground">
            <h2 className="text-2xl font-semibold leading-none tracking-tight font-headline flex items-center mb-1.5"><FileText className="mr-2 h-5 w-5 text-primary"/> Your Base Resume</h2>
            <p className="text-sm text-muted-foreground mb-4">Paste your current resume content here.</p>
            <textarea 
              placeholder="Paste your full resume text..." 
              rows={15} 
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* Job Description Input Area */}
          <div className="lg:col-span-1 p-6 border rounded-lg shadow-sm bg-card text-card-foreground">
            <h2 className="text-2xl font-semibold leading-none tracking-tight font-headline flex items-center mb-1.5"><Brain className="mr-2 h-5 w-5 text-primary"/> Job Description</h2>
            <p className="text-sm text-muted-foreground mb-4">Paste the job description you&apos;re targeting.</p>
            <textarea 
              placeholder="Paste the full job description text..." 
              rows={15} 
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          
          <div className="lg:col-span-2 flex justify-center">
            <Button type="submit" size="lg" disabled={isLoading} className="min-w-[200px]">
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-5 w-5" />
              )}
              Forge My Resume
            </Button>
          </div>
      </form>

      {(tailoredResume || analysis || suggestions) && (
        <div className="space-y-8 pt-8">
          <hr className="shrink-0 bg-border h-[1px] w-full my-4" /> {/* Simplified Separator */}
          <h2 className="font-headline text-2xl font-bold text-center">AI-Powered Results</h2>
          
          {tailoredResume && (
            <div className="p-6 border rounded-lg shadow-sm bg-card text-card-foreground">
              <div className="flex flex-col space-y-1.5 mb-6">
                <h3 className="text-2xl font-semibold leading-none tracking-tight font-headline flex items-center"><FileText className="mr-2 h-5 w-5 text-primary"/> Tailored Resume</h3>
                <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => { console.log("Copy (Placeholder)"); toast({title: "Copy (Placeholder)"})}}><Copy className="mr-2 h-4 w-4" />Copy</Button>
                    <Button variant="outline" size="sm" onClick={() => { console.log("Download (Placeholder)"); toast({title: "Download (Placeholder)"})}}><Download className="mr-2 h-4 w-4" />Download</Button>
                </div>
              </div>
              <pre className="whitespace-pre-wrap bg-muted/50 p-4 rounded-md text-sm font-mono max-h-[500px] overflow-y-auto">{tailoredResume}</pre>
            </div>
          )}

          {analysis && (
             <div className="p-6 border rounded-lg shadow-sm bg-card text-card-foreground">
              <div className="flex flex-col space-y-1.5 mb-6">
                <h3 className="text-2xl font-semibold leading-none tracking-tight font-headline flex items-center"><Brain className="mr-2 h-5 w-5 text-primary"/> AI Analysis</h3>
                 <Button variant="outline" size="sm" onClick={() => { console.log("Copy analysis (Placeholder)"); toast({title: "Copy (Placeholder)"})}} className="mt-2"><Copy className="mr-2 h-4 w-4" />Copy Analysis</Button>
              </div>
              <div className="prose prose-sm max-w-none dark:prose-invert p-4 bg-muted/50 rounded-md max-h-[400px] overflow-y-auto" dangerouslySetInnerHTML={{ __html: analysis.replace(/\n/g, '<br />') }} />
            </div>
          )}

          {suggestions && (
            <div className="p-6 border rounded-lg shadow-sm bg-card text-card-foreground">
              <div className="flex flex-col space-y-1.5 mb-6">
                <h3 className="text-2xl font-semibold leading-none tracking-tight font-headline flex items-center"><Lightbulb className="mr-2 h-5 w-5 text-primary"/> AI Suggestions</h3>
                <Button variant="outline" size="sm" onClick={() => { console.log("Copy suggestions (Placeholder)"); toast({title: "Copy (Placeholder)"})}} className="mt-2"><Copy className="mr-2 h-4 w-4" />Copy Suggestions</Button>
              </div>
              <div className="prose prose-sm max-w-none dark:prose-invert p-4 bg-muted/50 rounded-md max-h-[400px] overflow-y-auto" dangerouslySetInnerHTML={{ __html: suggestions.replace(/\n/g, '<br />') }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
