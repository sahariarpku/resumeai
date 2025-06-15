
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
import { DEFAULT_SECTION_ORDER } from "@/lib/types";
import { suggestCvSectionOrder } from "@/ai/flows/suggest-cv-section-order-flow";
import { generateLatexCv } from "@/ai/flows/generate-latex-cv-flow";
import { profileToResumeText, profileToResumeHtml } from '@/lib/profile-utils';
import { Loader2, Download, FileText, Settings2, ListRestart, Printer } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, enableNetwork } from 'firebase/firestore';

interface CvCustomizationModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  currentProfile: UserProfile | null; 
  onOrderUpdate: (newOrder: ProfileSectionKey[]) => void; 
}

export function CvCustomizationModal({ isOpen, onOpenChange, currentProfile, onOrderUpdate }: CvCustomizationModalProps) {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [userPreference, setUserPreference] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [profileForModal, setProfileForModal] = useState<UserProfile | null>(null);
  const [downloadsReady, setDownloadsReady] = useState(false);
  const [generatedLatex, setGeneratedLatex] = useState<string | null>(null);
  const [isGeneratingLatex, setIsGeneratingLatex] = useState(false);

  useEffect(() => {
    if (isOpen && currentProfile) {
      setProfileForModal({
        ...currentProfile,
        sectionOrder: currentProfile.sectionOrder && currentProfile.sectionOrder.length > 0 
                      ? currentProfile.sectionOrder 
                      : [...DEFAULT_SECTION_ORDER],
      });
      setDownloadsReady(false);
      setGeneratedLatex(null);
      setUserPreference("");
    } else if (isOpen && !currentProfile && currentUser) {
        const loadProfileForModal = async () => {
            setIsLoading(true);
            try {
                await enableNetwork(db);
                const userDocRef = doc(db, "users", currentUser.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    const dbData = userDocSnap.data() as UserProfile;
                    setProfileForModal({
                        ...dbData,
                        id: currentUser.uid,
                        sectionOrder: dbData.sectionOrder && dbData.sectionOrder.length > 0 ? dbData.sectionOrder : [...DEFAULT_SECTION_ORDER]
                    });
                } else {
                     toast({ title: "Profile Not Found", description: "Please create a profile first.", variant: "destructive" });
                     onOpenChange(false);
                }
            } catch (error) {
                console.error("Error loading profile for modal:", error);
                let description = "Could not load your profile for customization.";
                if (error instanceof Error && error.message.toLowerCase().includes("offline")) {
                    description = "Failed to load profile for customization: You appear to be offline. Please check your internet connection.";
                } else if (error instanceof Error) {
                    description = `Could not load your profile: ${error.message}.`;
                }
                toast({ title: "Error", description, variant: "destructive" });
                onOpenChange(false);
            } finally {
                setIsLoading(false);
            }
        };
        loadProfileForModal();
    }
  }, [isOpen, currentProfile, currentUser, toast, onOpenChange]);

  const handleApplyPreference = async () => {
    if (!profileForModal || !currentUser) {
      toast({ title: "Profile Error", description: "User profile not loaded.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setDownloadsReady(false);
    setGeneratedLatex(null);

    try {
      const currentOrder = profileForModal.sectionOrder || [...DEFAULT_SECTION_ORDER];
      const availableSections = currentOrder.filter(key => {
        const sectionData = profileForModal[key as keyof UserProfile];
        if (Array.isArray(sectionData)) return sectionData.length > 0;
        if (typeof sectionData === 'string') return sectionData.trim() !== '';
        return false; 
      }) as ProfileSectionKey[];

      const result = await suggestCvSectionOrder({
        userPreference: userPreference || "General Purpose CV", 
        currentSectionOrder: currentOrder,
        availableSections: availableSections.length > 0 ? availableSections : [...DEFAULT_SECTION_ORDER], 
      });

      const updatedProfileForModal = { ...profileForModal, sectionOrder: result.newSectionOrder, updatedAt: serverTimestamp() };
      
      onOrderUpdate(result.newSectionOrder);
      setProfileForModal(updatedProfileForModal); 

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
    if (!profileForModal) return;
    const profileName = (profileForModal.fullName || currentUser?.displayName || 'resume').replace(/\s+/g, '_');
    let content = ""; let filename = ""; let blobType = "";

    if (format === 'md') {
      content = profileToResumeText(profileForModal); filename = `${profileName}_CV.md`; blobType = 'text/markdown;charset=utf-8';
    } else if (format === 'docx') {
      content = profileToResumeHtml(profileForModal); filename = `${profileName}_CV.docx`; blobType = 'application/msword'; 
    } else if (format === 'tex') {
        if (generatedLatex) { content = generatedLatex; filename = `${profileName}_CV.tex`; blobType = 'application/x-tex;charset=utf-8'; }
        else { toast({title: "LaTeX Not Ready", description: "Please generate LaTeX code first.", variant: "default"}); return; }
    }
    if (content) {
      const blob = new Blob([content], { type: blobType }); const link = document.createElement('a');
      link.href = URL.createObjectURL(blob); link.download = filename; document.body.appendChild(link);
      link.click(); document.body.removeChild(link); URL.revokeObjectURL(link.href);
      toast({ title: "Download Started", description: `${filename} is downloading.` });
    }
  };

  const handlePrintPdfFromHtml = () => {
    if (!profileForModal) { toast({ title: "Profile Error", variant: "destructive" }); return; }
    const htmlContent = profileToResumeHtml(profileForModal);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent); printWindow.document.close(); printWindow.focus();
      setTimeout(() => { printWindow.print(); }, 500); toast({ title: "Preparing PDF for Print" });
    } else {
      toast({ title: "Print Error", description: "Could not open print window.", variant: "destructive" });
    }
  };

  const handleGenerateLatex = async () => {
    if (!profileForModal) { toast({ title: "Profile Error", variant: "destructive" }); return; }
    setIsGeneratingLatex(true); setGeneratedLatex(null);
    try {
        const profileAsText = profileToResumeText(profileForModal); 
        const result = await generateLatexCv({ profileAsText, cvStylePreference: userPreference || "Oxford style" });
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
        <DialogHeader><DialogTitle className="font-headline flex items-center"><Settings2 className="mr-2 h-5 w-5 text-primary"/>Customize Your CV</DialogTitle><DialogDescription>Specify your preferred CV style. The AI will reorder your profile sections. Changes are saved to your cloud profile.</DialogDescription></DialogHeader>
        <div className="py-4 space-y-4">
          <div><Label htmlFor="cvPreference">CV Style Preference</Label><Input id="cvPreference" value={userPreference} onChange={(e) => setUserPreference(e.target.value)} placeholder="e.g., Academic, Chronological work-focused" disabled={isLoading || !profileForModal}/>
             <p className="text-xs text-muted-foreground mt-1">Leave blank for a general purpose CV.</p></div>
          <Button onClick={handleApplyPreference} disabled={isLoading || !profileForModal} className="w-full">{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ListRestart className="mr-2 h-4 w-4" />}Apply Preference & Update Order</Button>
        </div>
        {downloadsReady && profileForModal && (
          <><Separator className="my-4"/><div className="space-y-3"><h3 className="text-md font-medium text-center">Download Reordered CV (from Profile Data)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Button variant="outline" onClick={() => handleDownload('md')} disabled={isLoading}><Download className="mr-2 h-4 w-4" /> .md</Button>
                <Button variant="outline" onClick={() => handleDownload('docx')} disabled={isLoading}><Download className="mr-2 h-4 w-4" /> .docx</Button>
                <Button variant="outline" onClick={handlePrintPdfFromHtml} disabled={isLoading}><Printer className="mr-2 h-4 w-4" /> PDF (HTML)</Button>
            </div><Separator className="my-4"/><h3 className="text-md font-medium text-center">Generate & Download LaTeX CV</h3>
            <div className="space-y-2 pt-2">
                 <Button variant="outline" onClick={handleGenerateLatex} disabled={isGeneratingLatex || isLoading} className="w-full">{isGeneratingLatex ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}Generate LaTeX Code (.tex)</Button>
                {generatedLatex && (<Button variant="default" onClick={() => handleDownload('tex')} disabled={!generatedLatex || isLoading} className="w-full bg-green-600 hover:bg-green-700 text-white"><Download className="mr-2 h-4 w-4" /> Download .tex File</Button>)}
                <p className="text-xs text-muted-foreground text-center">For .tex, you'll need a LaTeX editor to compile it into a PDF.</p>
            </div></div></> )}
        <DialogFooter className="mt-6"><DialogClose asChild><Button type="button" variant="outline">Close</Button></DialogClose></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
