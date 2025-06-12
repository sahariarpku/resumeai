
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from 'next/navigation'; 
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Download, Copy, FileText, Brain, Lightbulb, Loader2, Save, ListChecks, Printer, Mail } from "lucide-react";
import { tailorResumeFormSchema, type TailorResumeFormData } from "@/lib/schemas";
import { tailorResumeToJobDescription } from "@/ai/flows/tailor-resume-to-job-description";
import { improveResume } from "@/ai/flows/improve-resume-based-on-job-description";
import { generateCoverLetter } from "@/ai/flows/generate-cover-letter-flow";
import type { StoredResume, UserProfile } from "@/lib/types"; 
import { profileToResumeText, textToProfessionalHtml } from '@/lib/profile-utils';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


const TAILOR_RESUME_PREFILL_JD_KEY = "tailorResumePrefillJD";
const TAILOR_RESUME_PREFILL_RESUME_KEY = "tailorResumePrefillResume";
const USER_PROFILE_STORAGE_KEY = "userProfile";

// Simple Markdown to HTML utility for display purposes
const SimpleMarkdownToHtmlDisplay = ({ text }: { text: string | null }) => {
  if (!text) return null;

  let html = text;

  // Headers (more specific styling might be needed, or rely on prose)
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-3 mb-1">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-5 mb-3">$1</h1>');

  // Bold and Italic
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>'); 
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>'); 

  // Lists (basic handling)
  const lines = html.split('\n');
  let newHtmlLines = [];
  let inList = false;
  let listType = ''; // 'ul' or 'ol'

  for (const line of lines) {
    const ulMatch = line.match(/^(\* |\- )/);
    const olMatch = line.match(/^(\d+\. )/);

    if (ulMatch || olMatch) {
      const currentListType = ulMatch ? 'ul' : 'ol';
      if (!inList || listType !== currentListType) {
        if (inList) newHtmlLines.push(`</${listType}>`); // Close previous list
        newHtmlLines.push(`<${currentListType}>`);
        inList = true;
        listType = currentListType;
      }
      newHtmlLines.push(`  <li>${line.substring(olMatch ? olMatch[0].length : 2)}</li>`);
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

  // Paragraphs: Wrap blocks of text separated by one or more empty lines in <p> tags.
  // Also, convert single newlines within those paragraphs to <br />.
  html = html.split(/\n\s*\n/).map(paragraph => {
    if (paragraph.trim() === '') return ''; // Skip empty paragraphs
    // Avoid wrapping already structured HTML (like lists or headers) in <p> tags
    if (paragraph.match(/^\s*<(ul|ol|h[1-6]|div|section|article|aside|header|footer|nav|figure|table|blockquote|hr|pre|form)/i)) {
        return paragraph;
    }
    return `<p>${paragraph.replace(/\n/g, '<br />')}</p>`;
  }).join('');

  html = html.replace(/<p>\s*(<(ul|ol)>.*?<\/(ul|ol)>)\s*<\/p>/gs, '$1'); // Remove <p> tags around lists
  html = html.replace(/<p>\s*<\/p>/g, ''); // Clean up empty paragraphs

  return <div className="prose prose-sm dark:prose-invert max-w-none break-words" dangerouslySetInnerHTML={{ __html: html }} />;
};


export default function TailorResumePage() {
  const { toast } = useToast();
  const router = useRouter(); 

  const [isLoadingResume, setIsLoadingResume] = useState(false);
  const [isLoadingCoverLetter, setIsLoadingCoverLetter] = useState(false);
  const [tailoredResume, setTailoredResume] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string | null>(null);
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [jobTitleForSave, setJobTitleForSave] = useState<string>("");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  const resultsSectionRef = useRef<HTMLDivElement>(null);
  const coverLetterSectionRef = useRef<HTMLDivElement>(null);


  const form = useForm<TailorResumeFormData>({
    resolver: zodResolver(tailorResumeFormSchema),
    defaultValues: {
      jobDescription: "",
      resumeContent: "",
    },
  });

  useEffect(() => {
    try {
      const storedProfileString = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
      let loadedProfile: UserProfile | null = null;
      if (storedProfileString) {
        loadedProfile = JSON.parse(storedProfileString) as UserProfile;
        setUserProfile(loadedProfile);
      }

      const prefillResumeFromStorage = localStorage.getItem(TAILOR_RESUME_PREFILL_RESUME_KEY);
      const prefillJD = localStorage.getItem(TAILOR_RESUME_PREFILL_JD_KEY);

      if (prefillResumeFromStorage) {
        form.setValue("resumeContent", prefillResumeFromStorage);
        localStorage.removeItem(TAILOR_RESUME_PREFILL_RESUME_KEY); 
      } else if (loadedProfile) {
        const profileAsText = profileToResumeText(loadedProfile);
        if (profileAsText) {
            form.setValue("resumeContent", profileAsText);
        }
      }

      if (prefillJD) {
        form.setValue("jobDescription", prefillJD);
        localStorage.removeItem(TAILOR_RESUME_PREFILL_JD_KEY); 
      }

      const currentJD = form.getValues("jobDescription") || prefillJD;
      if (currentJD) {
        setJobTitleForSave(extractJobTitleFromJD(currentJD) || "Untitled Job");
      }

    } catch (e) {
        console.error("Error reading prefill data:", e);
        toast({title: "Info", description: "Could not load prefill data.", variant: "default"});
    }
  }, [form, toast]);

  useEffect(() => {
    if ((tailoredResume || analysis || suggestions) && resultsSectionRef.current) {
      resultsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [tailoredResume, analysis, suggestions]);

  useEffect(() => {
    if (generatedCoverLetter && coverLetterSectionRef.current) {
        coverLetterSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [generatedCoverLetter]);


  const extractJobTitleFromJD = (jdText: string): string => {
    const jdLines = jdText.split('\n');
    let extractedTitle = jdLines.find(line => /title/i.test(line) && !/job title/i.test(line) && line.length < 100)?.replace(/.*title\s*[:=-]?\s*/i, '').trim();
    if (!extractedTitle && jdLines[0] && jdLines[0].length < 100) {
      extractedTitle = jdLines[0].trim();
    }
    return extractedTitle || "Untitled";
  };


  const handleForgeResume = async (data: TailorResumeFormData) => {
    setIsLoadingResume(true);
    setTailoredResume(null);
    setAnalysis(null);
    setSuggestions(null);
    setError(null);
    setGeneratedCoverLetter(null); 

    const currentJobTitle = extractJobTitleFromJD(data.jobDescription);
    setJobTitleForSave(currentJobTitle);

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
        handleSaveResume(tailorResult.tailoredResume, tailorResult.analysis, improveResult.suggestions, currentJobTitle + " Resume");
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
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoadingResume(false);
    }
  };

  const handleForgeCoverLetter = async () => {
    const data = form.getValues();
    if (!data.resumeContent || !data.jobDescription) {
      toast({ title: "Missing Information", description: "Please provide both resume content and job description.", variant: "destructive"});
      return;
    }
    setIsLoadingCoverLetter(true);
    setGeneratedCoverLetter(null);
    setError(null);
    setTailoredResume(null); 
    setAnalysis(null);
    setSuggestions(null);

    const currentJobTitle = extractJobTitleFromJD(data.jobDescription);
    setJobTitleForSave(currentJobTitle);

    try {
      const result = await generateCoverLetter({
        resumeText: data.resumeContent,
        jobDescriptionText: data.jobDescription,
        userName: userProfile?.fullName
      });

      if (result.coverLetterText && !result.coverLetterText.toLowerCase().includes("could not generate")) {
        setGeneratedCoverLetter(result.coverLetterText);
        toast({ title: "Cover Letter Generated!", description: "AI has crafted your cover letter." });
      } else {
        setError(result.coverLetterText || "The AI could not generate a cover letter.");
        toast({ title: "Cover Letter Error", description: result.coverLetterText || "Failed to generate cover letter.", variant: "destructive"});
      }
    } catch (err) {
      console.error("Error generating cover letter:", err);
      let errorMessage = "Could not generate cover letter. Please try again.";
      if (err instanceof Error) errorMessage = err.message;
      setError(errorMessage);
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoadingCoverLetter(false);
    }
  };


  const handleCopyToClipboard = (text: string | null, type: string) => {
    if (text) {
      navigator.clipboard.writeText(text);
      toast({ title: `Copied ${type} to clipboard!` });
    }
  };
  
  const handleDownloadMd = (content: string | null, baseFilename: string, type: string) => {
    if (!content) {
      toast({ title: "Download Error", description: `No ${type} content to download.`, variant: "destructive" });
      return;
    }
    const filename = `${baseFilename.replace(/\s+/g, '_')}_${type.toLowerCase()}.md`;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    toast({title: "Download Started", description: `${filename} is downloading.`});
  };

  const handleDownloadDocx = (content: string | null, baseFilename: string, type: string) => {
    if (!content) {
      toast({ title: "Download Error", description: `No ${type} content to download.`, variant: "destructive" });
      return;
    }
    const filename = `${baseFilename.replace(/\s+/g, '_')}_${type.toLowerCase()}.docx`;
    const finalHtmlContent = textToProfessionalHtml(content, `${jobTitleForSave} ${type}`);

    const blob = new Blob([finalHtmlContent], { type: 'application/msword' }); 
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    toast({ title: "Word (.docx) Download Started" });
  };
  
  const handlePrintToPdf = (content: string | null, baseFilename: string, type: string) => {
    if (!content) {
      toast({ title: "Print Error", description: `No ${type} content to print.`, variant: "destructive" });
      return;
    }
    const htmlContent = textToProfessionalHtml(content, `${jobTitleForSave} ${type}`);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close(); 
      printWindow.focus(); 
      setTimeout(() => {
        printWindow.print();
      }, 500); 
      toast({ title: `Preparing ${type} PDF for Print` });
    } else {
      toast({ title: "Print Error", description: "Could not open print window. Check pop-up blocker.", variant: "destructive" });
    }
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
      } catch (e) {
        console.error("Failed to save resume to localStorage:", e);
        toast({ title: "Save Error", description: "Could not save resume to local storage.", variant: "destructive"});
      }
    }
  };
  
  const isLoading = isLoadingResume || isLoadingCoverLetter;

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold">AI Resume & Cover Letter Tailoring</h1>
        <p className="text-muted-foreground">
          Paste your base resume and a job description. Let AI craft a perfectly aligned resume and a compelling cover letter.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleForgeResume)} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="font-headline flex items-center"><FileText className="mr-2 h-5 w-5 text-primary"/> Your Base Resume</CardTitle>
              <CardDescription>Paste your current resume content, or it will be pre-filled from your profile. This content will be used for both resume and cover letter generation.</CardDescription>
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
          
          <div className="lg:col-span-2 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button type="submit" size="lg" disabled={isLoading} className="min-w-[220px]">
              {isLoadingResume ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-5 w-5" />
              )}
              Forge My Resume
            </Button>
            <Button type="button" size="lg" variant="outline" onClick={handleForgeCoverLetter} disabled={isLoading} className="min-w-[220px]">
              {isLoadingCoverLetter ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Mail className="mr-2 h-5 w-5" />
              )}
              Forge My Cover Letter
            </Button>
            {(tailoredResume || generatedCoverLetter) && (
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
        <div ref={resultsSectionRef} className="space-y-8 pt-8">
          <Separator />
          <h2 className="font-headline text-2xl font-bold text-center">AI-Powered Resume Results</h2>
          
          <Tabs defaultValue="tailoredResume" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tailoredResume" disabled={!tailoredResume}>Tailored Resume</TabsTrigger>
              <TabsTrigger value="analysis" disabled={!analysis}>AI Analysis</TabsTrigger>
              <TabsTrigger value="suggestions" disabled={!suggestions}>AI Suggestions</TabsTrigger>
            </TabsList>

            <TabsContent value="tailoredResume">
              {tailoredResume && (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center flex-wrap gap-2">
                        <CardTitle className="font-headline flex items-center"><FileText className="mr-2 h-5 w-5 text-primary"/> Tailored Resume</CardTitle>
                        <div className="flex gap-2 flex-wrap">
                            <Button variant="outline" size="sm" onClick={() => handleCopyToClipboard(tailoredResume, "Resume")}><Copy className="mr-2 h-4 w-4" />Copy</Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" />Download</Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleDownloadMd(tailoredResume, jobTitleForSave, "Resume")}>
                                        <FileText className="mr-2 h-4 w-4" /> .md
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDownloadDocx(tailoredResume, jobTitleForSave, "Resume")}>
                                        <FileText className="mr-2 h-4 w-4" /> .docx
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handlePrintToPdf(tailoredResume, jobTitleForSave, "Resume")}>
                                        <Printer className="mr-2 h-4 w-4" /> PDF...
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground pt-2">
                      Your tailored resume has been automatically saved. Use the download options for different formats.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/50 p-4 rounded-md max-h-[600px] overflow-y-auto">
                        <SimpleMarkdownToHtmlDisplay text={tailoredResume} />
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="analysis">
              {analysis && (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center flex-wrap gap-2">
                        <CardTitle className="font-headline flex items-center"><Brain className="mr-2 h-5 w-5 text-primary"/> AI Resume Analysis</CardTitle>
                        <Button variant="outline" size="sm" onClick={() => handleCopyToClipboard(analysis, "Analysis")}><Copy className="mr-2 h-4 w-4" />Copy</Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                     <div className="bg-muted/50 p-4 rounded-md max-h-[600px] overflow-y-auto">
                        <SimpleMarkdownToHtmlDisplay text={analysis} />
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="suggestions">
              {suggestions && (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center flex-wrap gap-2">
                        <CardTitle className="font-headline flex items-center"><Lightbulb className="mr-2 h-5 w-5 text-primary"/> AI Resume Suggestions</CardTitle>
                        <Button variant="outline" size="sm" onClick={() => handleCopyToClipboard(suggestions, "Suggestions")}><Copy className="mr-2 h-4 w-4" />Copy</Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/50 p-4 rounded-md max-h-[600px] overflow-y-auto">
                        <SimpleMarkdownToHtmlDisplay text={suggestions} />
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
      
      {generatedCoverLetter && !error && (
         <div ref={coverLetterSectionRef} className="space-y-8 pt-8">
          <Separator />
           <Card>
            <CardHeader>
                <div className="flex justify-between items-center flex-wrap gap-2">
                <CardTitle className="font-headline flex items-center"><Mail className="mr-2 h-5 w-5 text-primary"/> Generated Cover Letter</CardTitle>
                <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => handleCopyToClipboard(generatedCoverLetter, "Cover Letter")}><Copy className="mr-2 h-4 w-4" />Copy</Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" />Download</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDownloadMd(generatedCoverLetter, jobTitleForSave, "CoverLetter")}>
                                <FileText className="mr-2 h-4 w-4" /> .md
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadDocx(generatedCoverLetter, jobTitleForSave, "CoverLetter")}>
                                <FileText className="mr-2 h-4 w-4" /> .docx
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePrintToPdf(generatedCoverLetter, jobTitleForSave, "CoverLetter")}>
                                <Printer className="mr-2 h-4 w-4" /> PDF...
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                </div>
                <p className="text-xs text-muted-foreground pt-2">
                Use the download options for different formats. Cover letters are not automatically saved to "My Resumes".
                </p>
            </CardHeader>
            <CardContent>
                <div className="bg-muted/50 p-4 rounded-md max-h-[700px] overflow-y-auto">
                    <SimpleMarkdownToHtmlDisplay text={generatedCoverLetter} />
                </div>
            </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}
