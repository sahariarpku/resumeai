
"use client";

import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Download, Copy, FileText, Brain, Lightbulb, Loader2, Save } from "lucide-react";
import { tailorResumeFormSchema, type TailorResumeFormData } from "@/lib/schemas";
import { tailorResumeToJobDescription } from "@/ai/flows/tailor-resume-to-job-description";
import { improveResume } from "@/ai/flows/improve-resume-based-on-job-description";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from '@/components/ui/separator';

export default function TailorResumePage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [tailoredResume, setTailoredResume] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<TailorResumeFormData>({
    resolver: zodResolver(tailorResumeFormSchema),
    defaultValues: {
      jobDescription: "",
      resumeContent: "",
    },
  });

  const onSubmit = async (data: TailorResumeFormData) => {
    setIsLoading(true);
    setTailoredResume(null);
    setAnalysis(null);
    setSuggestions(null);
    setError(null);

    try {
      // Fetch tailored resume and suggestions in parallel
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
        toast({ title: "Resume Tailored!", description: "AI has customized your resume and provided suggestions." });
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
              <CardDescription>Paste your current resume content here.</CardDescription>
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
              <CardDescription>Paste the job description you&apos;re targeting.</CardDescription>
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
                <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => handleCopyToClipboard(tailoredResume)}><Copy className="mr-2 h-4 w-4" />Copy</Button>
                    <Button variant="outline" size="sm" onClick={() => handleDownload(tailoredResume, 'Tailored_Resume.txt')}><Download className="mr-2 h-4 w-4" />Download</Button>
                    {/* TODO: Add Save Resume functionality */}
                </div>
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
