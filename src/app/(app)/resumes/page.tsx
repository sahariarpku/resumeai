"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, Trash2, Eye, PlusCircle, Edit3, FileSearch } from "lucide-react";
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

const initialResumes: StoredResume[] = [
  { id: "resume1", name: "Software Engineer - Google (Tailored)", tailoredContent: "...", createdAt: new Date().toISOString(), jobDescriptionId: "jd1", aiAnalysis: "Good match.", aiSuggestions: "Add more keywords." },
  { id: "resume2", name: "UX Designer - Microsoft (Draft)", tailoredContent: "...", createdAt: new Date().toISOString() },
];

export default function MyResumesPage() {
  const { toast } = useToast();
  const [resumes, setResumes] = useState<StoredResume[]>(initialResumes);

  const handleDeleteResume = (id: string) => {
    setResumes(resumes.filter(resume => resume.id !== id));
    toast({ title: "Resume Deleted", variant: "destructive" });
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

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-headline text-3xl font-bold">My Resumes</h1>
          <p className="text-muted-foreground">
            Access and manage all your generated and saved resumes.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/tailor-resume">
            <PlusCircle className="mr-2 h-5 w-5" /> Create New Tailored Resume
          </Link>
        </Button>
      </div>

      {resumes.length === 0 ? (
         <Card className="text-center py-12">
          <CardHeader>
            <FileSearch className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <CardTitle className="font-headline text-2xl">No Resumes Yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Tailor your first resume to see it appear here.
            </p>
            <Button asChild>
              <Link href="/tailor-resume">
                <PlusCircle className="mr-2 h-4 w-4" /> Tailor a Resume
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {resumes.map((resume) => (
            <Card key={resume.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                    <FileText className="h-8 w-8 text-primary mb-2" />
                     {/* Edit functionality can be added later if resumes are editable post-generation */}
                     {/* <Button variant="ghost" size="icon"><Edit3 className="h-4 w-4" /></Button> */}
                </div>
                <CardTitle className="font-headline text-xl">{resume.name}</CardTitle>
                <CardDescription>
                  Created: {new Date(resume.createdAt).toLocaleDateString()}
                  {resume.jobDescriptionId && (
                    <span className="block text-xs">For JD: {resume.jobDescriptionId}</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                {/* Optionally show a snippet or stats */}
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {resume.aiAnalysis || "Ready to be tailored or downloaded."}
                </p>
              </CardContent>
              <CardFooter className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => handleDownload(resume.tailoredContent, `${resume.name.replace(/\s+/g, '_')}.txt`)}>
                  <Download className="mr-2 h-4 w-4" /> Download
                </Button>
                {/* <Button variant="secondary" asChild>
                  <Link href={`/resumes/${resume.id}/view`}> Link to a view/edit page
                    <Eye className="mr-2 h-4 w-4" /> View/Edit
                  </Link>
                </Button> */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the resume
                        &quot;{resume.name}&quot;.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteResume(resume.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
