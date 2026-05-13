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
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { UserProfile, ProfileSectionKey } from "@/lib/types";
import { generateLatexCv } from "@/lib/ai-flows-client";
import { profileToResumeText, textToProfessionalHtml } from '@/lib/profile-utils';
import { Loader2, Download, Settings2, Printer, Sparkles } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface CvCustomizationModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  currentProfile: UserProfile | null; 
}

export function CvCustomizationModal({ isOpen, onOpenChange, currentProfile }: CvCustomizationModalProps) {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [userPreference, setUserPreference] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [profileForModal, setProfileForModal] = useState<UserProfile | null>(null);
  
  const [generatedLatex, setGeneratedLatex] = useState<string | null>(null);
  const [generatedMarkdown, setGeneratedMarkdown] = useState<string | null>(null);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [docBlob, setDocBlob] = useState<Blob | null>(null);
  const [isPreparingFiles, setIsPreparingFiles] = useState(false);
  const [isGeneratingLatex, setIsGeneratingLatex] = useState(false);

  useEffect(() => {
    if (isOpen && currentProfile) {
      setProfileForModal(currentProfile);
      setGeneratedLatex(null);
      setGeneratedMarkdown(null);
      setGeneratedHtml(null);
      setPdfBlob(null);
      setDocBlob(null);
      setUserPreference("");
    } else if (isOpen && !currentProfile && currentUser) {
        const loadProfileForModal = async () => {
            setIsLoading(true);
            try {
                const userDocRef = doc(db, "users", currentUser.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    setProfileForModal({ ...userDocSnap.data() as UserProfile, id: currentUser.uid });
                } else {
                     toast({ title: "Profile Not Found", description: "Please create a profile first.", variant: "destructive" });
                     onOpenChange(false);
                }
            } catch (error) {
                toast({ title: "Error", description: "Could not load your profile for customization.", variant: "destructive" });
                onOpenChange(false);
            } finally {
                setIsLoading(false);
            }
        };
        loadProfileForModal();
    }
  }, [isOpen, currentProfile, currentUser, toast, onOpenChange]);

  const handlePrintPdf = () => {
    if (!generatedMarkdown && !profileForModal) {
      toast({ title: "Not Ready", description: "Please wait for generation to complete.", variant: "destructive" });
      return;
    }
    const profileName = profileForModal?.fullName || "Resume";
    const professionalHtml = textToProfessionalHtml(generatedMarkdown || profileToResumeText(profileForModal!), profileName);
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(professionalHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    } else {
      toast({ title: "Blocked", description: "Please allow popups to print the PDF.", variant: "destructive" });
    }
  };

  const handleDownloadFile = async (format: 'md' | 'doc' | 'pdf' | 'tex') => {
    if (!profileForModal) return;
    const profileName = (profileForModal.fullName || currentUser?.displayName || 'resume').replace(/\s+/g, '_');

    if (format === 'pdf') {
      handlePrintPdf();
      return;
    }

    if (format === 'md') {
      const blob = new Blob([generatedMarkdown || profileToResumeText(profileForModal)], { type: 'text/markdown;charset=utf-8' });
      triggerDownload(blob, `${profileName}_CV.md`);
      return;
    } 
    
    if (format === 'doc') {
      const professionalHtml = textToProfessionalHtml(generatedMarkdown || profileToResumeText(profileForModal), profileForModal.fullName || "Resume");
      const blob = new Blob([professionalHtml], { type: 'application/msword;charset=utf-8' });
      triggerDownload(blob, `${profileName}_CV.doc`);
      return;
    }

    if (format === 'tex') {
      if (generatedLatex) { 
        const blob = new Blob([generatedLatex], { type: 'application/x-tex;charset=utf-8' });
        triggerDownload(blob, `${profileName}_CV.tex`);
      } else { 
        toast({title: "LaTeX Not Ready", description: "Please wait for generation to complete.", variant: "default"}); 
      }
      return;
    }

    // Fallback if not yet ready
    toast({ title: "Please Wait", description: "Still preparing your file...", variant: "default" });
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    toast({ title: "Success", description: `${filename} downloaded.` });
  };

  const handleGenerateLatex = async () => {
    if (!profileForModal) { toast({ title: "Profile Error", variant: "destructive" }); return; }
    setIsGeneratingLatex(true); 
    setGeneratedLatex(null);
    setGeneratedMarkdown(null);
    setGeneratedHtml(null);
    setPdfBlob(null);
    setDocBlob(null);

    try {
        const profileAsText = profileToResumeText(profileForModal); 
        const result = await generateLatexCv({ profileAsText, cvStylePreference: userPreference || "professional classic" });
        
        setGeneratedLatex(result.latexCode);
        setGeneratedMarkdown(result.markdownCode);
        setGeneratedHtml(result.htmlCode);
        
        // Start background preparation of files
        setIsPreparingFiles(true);
        try {
          const docRes = await fetch('/api/export/docx', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ markdown: result.markdownCode }),
          });

          if (docRes.ok) setDocBlob(await docRes.blob());
        } catch (err) {
          console.error("Error pre-generating files:", err);
        } finally {
          setIsPreparingFiles(false);
        }

        toast({title: "Success!", description: "Your custom CV is ready for download."});
    } catch (error) {
        toast({ title: "Generation Error", description: `Could not generate CV: ${error instanceof Error ? error.message : 'Unknown error'}`, variant: "destructive" });
    } finally {
        setIsGeneratingLatex(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center"><Settings2 className="mr-2 h-5 w-5 text-primary"/>Customize Your CV</DialogTitle>
          <DialogDescription>Specify your preferred CV style. The AI will build a complete CV in multiple formats based on your request.</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="cvPreference">What kind of CV do you want?</Label>
            <Input id="cvPreference" value={userPreference} onChange={(e) => setUserPreference(e.target.value)} placeholder="e.g., Academic, Narrative, Chronological work-focused" disabled={isGeneratingLatex || isLoading || !profileForModal}/>
            <p className="text-xs text-muted-foreground">Describe the style, layout, or tone you want. Leave blank for a standard professional CV.</p>
          </div>

          <Button variant="default" onClick={handleGenerateLatex} disabled={isGeneratingLatex || isLoading || !profileForModal} className="w-full">
            {isGeneratingLatex ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Generate Custom CVs
          </Button>
        </div>

        {generatedLatex && profileForModal && (
          <>
            <Separator className="my-2"/>
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-center">Download Your Custom CV</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Button variant="outline" size="sm" onClick={() => handleDownloadFile('md')} disabled={isGeneratingLatex}><Download className="mr-2 h-4 w-4" /> .md</Button>
                  <Button variant="outline" size="sm" onClick={() => handleDownloadFile('doc')} disabled={isGeneratingLatex}>
                    {isPreparingFiles && !docBlob ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4" />} .doc
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDownloadFile('pdf')} disabled={isGeneratingLatex}>
                    <Printer className="mr-2 h-4 w-4" /> PDF
                  </Button>
                  <Button variant="default" size="sm" onClick={() => handleDownloadFile('tex')} disabled={isGeneratingLatex} className="bg-green-600 hover:bg-green-700 text-white">
                    <Download className="mr-2 h-4 w-4" /> .tex
                  </Button>
              </div>
            </div>
          </> 
        )}
        <DialogFooter className="mt-2">
          <DialogClose asChild><Button type="button" variant="outline">Close</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
