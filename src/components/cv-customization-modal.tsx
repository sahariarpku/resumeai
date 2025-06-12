
"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import type { UserProfile, ProfileSectionKey } from "@/lib/types";
import { DEFAULT_SECTION_ORDER } from "@/lib/types";
import { suggestCvSectionOrder } from "@/ai/flows/suggest-cv-section-order-flow";
import { generateLatexCv } from "@/ai/flows/generate-latex-cv-flow";
import { profileToResumeText, profileToResumeHtml } from '@/lib/profile-utils';
import { Loader2, Download, FileText, Settings2, ListRestart } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface CvCustomizationModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const USER_PROFILE_STORAGE_KEY = "userProfile";

export function CvCustomizationModal({ isOpen, onOpenChange }: CvCustomizationModalProps) {
  const { toast } = useToast();
  const [userPreference, setUserPreference] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [downloadsReady, setDownloadsReady] = useState(false);
  const [generatedLatex, setGeneratedLatex] = useState<string | null>(null);
  const [isGeneratingLatex, setIsGeneratingLatex] = useState(false);

  useEffect(() => {
    if (isOpen) {
      try {
        const storedProfileString = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
        if (storedProfileString) {
          const loadedProfile = JSON.parse(storedProfileString) as UserProfile;
           // Ensure sectionOrder exists, defaulting if not
          if (!loadedProfile.sectionOrder || loadedProfile.sectionOrder.length === 0) {
            loadedProfile.sectionOrder = [...DEFAULT_SECTION_ORDER];
          }
          setUserProfile(loadedProfile);
        } else {
          toast({ title: "Profile Not Found", description: "Please create a profile first.", variant: "destructive" });
          onOpenChange(false); // Close modal if no profile
        }
      } catch (error) {
        console.error("Error loading profile for modal:", error);
        toast({ title: "Error", description: "Could not load your profile.", variant: "destructive" });
        onOpenChange(false);
      }
      setDownloadsReady(false); // Reset download state when modal opens
      setGeneratedLatex(null);
      setUserPreference("");
    }
  }, [isOpen, toast, onOpenChange]);

  const handleApplyPreference = async () => {
    if (!userProfile) {
      toast({ title: "Profile Error", description: "User profile not loaded.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setDownloadsReady(false);
    setGeneratedLatex(null);

    try {
      const currentOrder = userProfile.sectionOrder || [...DEFAULT_SECTION_ORDER];
      const availableSections = currentOrder.filter(key => {
        const sectionData = userProfile[key as keyof UserProfile];
        if (Array.isArray(sectionData)) return sectionData.length > 0;
        if (typeof sectionData === 'string') return sectionData.trim() !== '';
        return false; // Default for sections that might not be arrays or strings directly (though most are)
      }) as ProfileSectionKey[];


      const result = await suggestCvSectionOrder({
        userPreference: userPreference || "General Purpose CV", // Default if empty
        currentSectionOrder: currentOrder,
        availableSections: availableSections.length > 0 ? availableSections : [...DEFAULT_SECTION_ORDER], // Use default if no sections have content
      });

      const updatedProfile = { ...userProfile, sectionOrder: result.newSectionOrder };
      localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(updatedProfile));
      setUserProfile(updatedProfile); // Update state for immediate use by download functions

      toast({
        title: "CV Preference Applied!",
        description: result.reasoning || `Section order updated based on: ${userPreference || "General Purpose CV"}. Downloads are now ready.`,
      });
      setDownloadsReady(true);
    } catch (error) {
      console.error("Error applying CV preference:", error);
      toast({ title: "AI Error", description: `Could not apply preference: ${error instanceof Error ? error.message : 'Unknown error'}`, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (format: 'md' | 'docx' | 'tex') => {
    if (!userProfile) return;

    const profileName = (userProfile.fullName || 'resume').replace(/\s+/g, '_');
    let content = "";
    let filename = "";
    let blobType = "";

    if (format === 'md') {
      content = profileToResumeText(userProfile);
      filename = `${profileName}_CV.md`;
      blobType = 'text/markdown;charset=utf-8';
    } else if (format === 'docx') {
      content = profileToResumeHtml(userProfile); // Uses the styled HTML
      filename = `${profileName}_CV.docx`;
      blobType = 'application/msword'; // For Word to import HTML
    } else if (format === 'tex') {
        if (generatedLatex) {
            content = generatedLatex;
            filename = `${profileName}_CV.tex`;
            blobType = 'application/x-tex;charset=utf-8';
        } else {
            toast({title: "LaTeX Not Ready", description: "Please generate LaTeX code first.", variant: "default"});
            return;
        }
    }

    if (content) {
      const blob = new Blob([content], { type: blobType });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      toast({ title: "Download Started", description: `${filename} is downloading.` });
    }
  };

  const handleGenerateLatex = async () => {
    if (!userProfile) {
        toast({ title: "Profile Error", description: "User profile not loaded.", variant: "destructive" });
        return;
    }
    setIsGeneratingLatex(true);
    setGeneratedLatex(null);
    try {
        const profileAsText = profileToResumeText(userProfile); // Using the reordered profile
        const result = await generateLatexCv({
             profileAsText,
             cvStylePreference: userPreference || "Oxford style"
        });
        setGeneratedLatex(result.latexCode);
        toast({title: "LaTeX Code Generated!", description: "You can now download the .tex file."});
    } catch (error) {
        console.error("Error generating LaTeX CV:", error);
        toast({ title: "LaTeX Generation Error", description: `Could not generate LaTeX: ${error instanceof Error ? error.message : 'Unknown error'}`, variant: "destructive" });
    } finally {
        setIsGeneratingLatex(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center">
            <Settings2 className="mr-2 h-5 w-5 text-primary"/>Customize Your CV
          </DialogTitle>
          <DialogDescription>
            Specify your preferred CV style (e.g., "academic", "work-focused", "skills-based"). The AI will reorder your profile sections accordingly.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div>
            <Label htmlFor="cvPreference">CV Style Preference</Label>
            <Input
              id="cvPreference"
              value={userPreference}
              onChange={(e) => setUserPreference(e.target.value)}
              placeholder="e.g., Academic, Chronological work-focused"
              disabled={isLoading}
            />
             <p className="text-xs text-muted-foreground mt-1">Leave blank for a general purpose CV.</p>
          </div>
          <Button onClick={handleApplyPreference} disabled={isLoading || !userProfile} className="w-full">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ListRestart className="mr-2 h-4 w-4" />}
            Apply Preference & Update Order
          </Button>
        </div>

        {downloadsReady && (
          <>
            <Separator className="my-4"/>
            <div className="space-y-3">
                <h3 className="text-md font-medium text-center">Download Reordered CV</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button variant="outline" onClick={() => handleDownload('md')} disabled={isLoading}>
                        <Download className="mr-2 h-4 w-4" /> Download .md
                    </Button>
                    <Button variant="outline" onClick={() => handleDownload('docx')} disabled={isLoading}>
                        <Download className="mr-2 h-4 w-4" /> Download .docx
                    </Button>
                </div>
                <div className="space-y-2 pt-2">
                     <Button 
                        variant="outline" 
                        onClick={handleGenerateLatex} 
                        disabled={isGeneratingLatex || isLoading}
                        className="w-full"
                    >
                        {isGeneratingLatex ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                        Generate LaTeX Code (.tex)
                    </Button>
                    {generatedLatex && (
                         <Button 
                            variant="default" 
                            onClick={() => handleDownload('tex')} 
                            disabled={!generatedLatex || isLoading}
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                        >
                            <Download className="mr-2 h-4 w-4" /> Download .tex File
                        </Button>
                    )}
                    <p className="text-xs text-muted-foreground text-center">
                        For .tex, you'll need a LaTeX editor (e.g., Overleaf, MiKTeX) to compile it into a PDF.
                    </p>
                </div>
            </div>
          </>
        )}

        <DialogFooter className="mt-6">
          <DialogClose asChild>
            <Button type="button" variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
