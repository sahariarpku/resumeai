
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, Trash2, PlusCircle, FileSearch, Info, Loader2 } from "lucide-react";
import Link from "next/link";
import type { StoredResume } from "@/lib/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, Timestamp, enableNetwork } from "firebase/firestore";
import { useRouter } from 'next/navigation';


export default function MyResumesPage() {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const router = useRouter();
  const [resumes, setResumes] = useState<StoredResume[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setResumes([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const resumesCollectionRef = collection(db, "users", currentUser.uid, "resumes");
    const q = query(resumesCollectionRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedResumes = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          ...data,
          id: docSnap.id,
          createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
        } as StoredResume;
      });
      setResumes(fetchedResumes);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching resumes:", error);
      let description = "Could not load resumes.";
      if (error instanceof Error && error.message.toLowerCase().includes("offline")) {
        description = "Failed to load resumes: You appear to be offline. Please check your internet connection.";
      } else if (error instanceof Error && error.message.includes("FIRESTORE_UNAVAILABLE")) {
         description = "Firestore is currently unavailable. Resumes cannot be loaded. Please check your Firebase setup and internet connection.";
      } else if (error instanceof Error) {
        description = `Could not load resumes: ${error.message}.`;
      }
      toast({ title: "Load Error", description, variant: "destructive" });
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [currentUser, toast]);

  const handleDeleteResume = async (id: string) => {
    if (!currentUser) {
      toast({ title: "Not Authenticated", description: "Please sign in to delete resumes.", variant: "destructive" });
      return;
    }
    try {
      await enableNetwork(db);
      const resumeDocRef = doc(db, "users", currentUser.uid, "resumes", id);
      await deleteDoc(resumeDocRef);
      toast({ title: "Resume Deleted", variant: "destructive" });
    } catch (error) {
      console.error("Error deleting resume from Firestore:", error);
      let description = "Could not delete resume.";
       if (error instanceof Error && error.message.toLowerCase().includes("offline")) {
        description = "Failed to delete resume: You appear to be offline. Please check your internet connection.";
      } else if (error instanceof Error && error.message.includes("FIRESTORE_UNAVAILABLE")) {
         description = "Firestore is currently unavailable. Resume could not be deleted. Please check your Firebase setup and internet connection.";
      } else if (error instanceof Error) {
        description = `Could not delete resume: ${error.message}.`;
      }
      toast({ title: "Delete Error", description, variant: "destructive" });
    }
  };

  const handleDownload = (content: string, filename: string) => {
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

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 text-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading your resumes...</p>
      </div>
    );
  }
  
  return (
    <TooltipProvider>
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div><h1 className="font-headline text-3xl font-bold">My Resumes</h1><p className="text-muted-foreground">Access and manage all your generated and saved resumes from the cloud.</p></div>
        <Button asChild size="lg" disabled={!currentUser}><Link href="/tailor-resume"><PlusCircle className="mr-2 h-5 w-5" /> Create New Tailored Resume</Link></Button>
      </div>

      {!currentUser ? (
         <Card className="text-center py-12"><CardHeader><FileSearch className="mx-auto h-16 w-16 text-muted-foreground mb-4" /><CardTitle className="font-headline text-2xl">Sign In to View Resumes</CardTitle></CardHeader><CardContent><p className="text-muted-foreground mb-4">Please sign in to access your saved resumes.</p><Button onClick={() => router.push('/auth/signin')}>Sign In</Button></CardContent></Card>
      ) : resumes.length === 0 && !isLoading ? (
         <Card className="text-center py-12"><CardHeader><FileSearch className="mx-auto h-16 w-16 text-muted-foreground mb-4" /><CardTitle className="font-headline text-2xl">No Resumes Yet</CardTitle></CardHeader><CardContent><p className="text-muted-foreground mb-4">Tailor your first resume to see it appear here. It will be saved automatically to the cloud.</p><Button asChild><Link href="/tailor-resume"><PlusCircle className="mr-2 h-4 w-4" /> Tailor a Resume</Link></Button></CardContent></Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {resumes.map((resume) => (
            <Card key={resume.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                    <FileText className="h-8 w-8 text-primary mb-2" />
                    {(resume.aiAnalysis || resume.aiSuggestions) && (
                       <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary"><Info className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent side="top" className="max-w-xs"><p className="text-xs mb-1"><strong>Analysis:</strong> {(resume.aiAnalysis || "").substring(0,100)}...</p><p className="text-xs"><strong>Suggestions:</strong> {(resume.aiSuggestions || "").substring(0,100)}...</p></TooltipContent></Tooltip>
                    )}
                </div>
                <CardTitle className="font-headline text-xl">{resume.name}</CardTitle>
                <CardDescription>Created: {new Date(resume.createdAt as string).toLocaleDateString()}{resume.jobDescriptionId && (<span className="block text-xs">For JD: {resume.jobDescriptionId}</span>)}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow"><p className="text-sm text-muted-foreground line-clamp-3">{resume.tailoredContent.substring(0, 150)}...</p></CardContent>
              <CardFooter className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => handleDownload(resume.tailoredContent, `${resume.name.replace(/\s+/g, '_')}.txt`)}><Download className="mr-2 h-4 w-4" /> Download</Button>
                <AlertDialog><AlertDialogTrigger asChild><Button variant="destructive" className="w-full"><Trash2 className="mr-2 h-4 w-4" /> Delete</Button></AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the resume &quot;{resume.name}&quot; from the cloud.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteResume(resume.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
    </TooltipProvider>
  );
}

