"use client";

import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Briefcase, ArrowRight, Trash2, Edit3, FileSearch, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";
import type { JobDescriptionItem } from "@/lib/types";
import { jobDescriptionFormSchema, JobDescriptionFormData } from "@/lib/schemas";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { extractJobDetails } from "@/ai/flows/extract-job-details-flow";


const initialJds: JobDescriptionItem[] = [
  { id: "jd1", title: "Senior Software Engineer", company: "Tech Giant LLC", description: "Looking for a skilled SSE...", createdAt: new Date().toISOString() },
  { id: "jd2", title: "Product Marketing Manager", company: "Startup Co.", description: "Join our fast-paced team...", createdAt: new Date().toISOString() },
];

export default function JobDescriptionsPage() {
  const { toast } = useToast();
  const [jds, setJds] = useState<JobDescriptionItem[]>(initialJds);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJd, setEditingJd] = useState<JobDescriptionItem | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const form = useForm<JobDescriptionFormData>({
    resolver: zodResolver(jobDescriptionFormSchema),
    defaultValues: {
      title: "",
      company: "",
      description: "",
    },
  });

  const handleAddOrEditJd = (data: JobDescriptionFormData) => {
    if (editingJd) {
      setJds(jds.map(jd => jd.id === editingJd.id ? { ...editingJd, ...data } : jd));
      toast({ title: "Job Description Updated!" });
    } else {
      const newJd: JobDescriptionItem = {
        id: `jd-${Date.now()}`,
        ...data,
        createdAt: new Date().toISOString(),
      };
      setJds(prev => [newJd, ...prev]);
      toast({ title: "Job Description Saved!" });
    }
    setIsModalOpen(false);
    setEditingJd(null);
    form.reset();
  };

  const openAddModal = () => {
    setEditingJd(null);
    form.reset();
    setIsModalOpen(true);
  };

  const openEditModal = (jd: JobDescriptionItem) => {
    setEditingJd(jd);
    form.reset(jd);
    setIsModalOpen(true);
  };

  const handleDeleteJd = (id: string) => {
    setJds(jds.filter(jd => jd.id !== id));
    toast({ title: "Job Description Deleted", variant: "destructive" });
  };

  const handleExtractDetails = async () => {
    const descriptionValue = form.getValues("description");
    if (!descriptionValue || descriptionValue.trim().length < 50) {
      toast({
        title: "Cannot Extract Details",
        description: "Please paste a job description (at least 50 characters) into the textarea first.",
        variant: "default",
      });
      return;
    }

    setIsExtracting(true);
    try {
      const result = await extractJobDetails({ jobDescriptionText: descriptionValue });
      form.setValue("title", result.jobTitle, { shouldValidate: true });
      form.setValue("company", result.companyName, { shouldValidate: true });
      
      toast({
        title: "Extraction Attempted!",
        description: "Job title and company name fields have been updated based on the AI's findings. Please review them.",
      });
    } catch (err) {
      console.error("Error extracting job details:", err);
      let errorMessage = "Could not extract details. Please try again or fill them manually.";
      if (err instanceof Error && err.message) {
        errorMessage = `Extraction failed: ${err.message}`;
      }
      toast({
        title: "Extraction Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  };


  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-headline text-3xl font-bold">Job Descriptions</h1>
          <p className="text-muted-foreground">
            Manage your saved job descriptions and tailor resumes for them.
          </p>
        </div>
        <Button onClick={openAddModal} size="lg">
          <PlusCircle className="mr-2 h-5 w-5" /> Add New JD
        </Button>
      </div>

      {jds.length === 0 ? (
        <Card className="text-center py-12">
          <CardHeader>
            <FileSearch className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <CardTitle className="font-headline text-2xl">No Job Descriptions Yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Start by adding a job description to tailor your resume.
            </p>
            <Button onClick={openAddModal}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Your First JD
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jds.map((jd) => (
            <Card key={jd.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <Briefcase className="h-8 w-8 text-primary mb-2" />
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditModal(jd)}><Edit3 className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteJd(jd.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                <CardTitle className="font-headline text-xl">{jd.title}</CardTitle>
                {jd.company && <CardDescription>{jd.company}</CardDescription>}
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-3">{jd.description}</p>
              </CardContent>
              <CardFooter>
                <Button className="w-full" asChild>
                  <Link href={`/tailor-resume?jdId=${jd.id}`}> {/* Pass JD content via query or state if needed, or load on next page */}
                    Tailor Resume <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
            <DialogTitle className="font-headline">{editingJd ? "Edit Job Description" : "Add New Job Description"}</DialogTitle>
            <DialogDescription>
                {editingJd ? "Update the details of this job description." : "Save a job description to tailor resumes for it later."}
            </DialogDescription>
            </DialogHeader>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddOrEditJd)} className="space-y-6 py-4">
                <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Job Title</FormLabel>
                    <FormControl><Input placeholder="e.g. Software Engineer" {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Company (Optional)</FormLabel>
                    <FormControl><Input placeholder="e.g. Acme Corp" {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center mb-1">
                        <FormLabel>Job Description</FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleExtractDetails}
                          disabled={isExtracting}
                        >
                          {isExtracting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="mr-2 h-4 w-4" />
                          )}
                          AI Extract Details
                        </Button>
                      </div>
                      <FormControl><Textarea placeholder="Paste the full job description here..." {...field} rows={10} /></FormControl>
                      <FormMessage />
                    </FormItem>
                )}
                />
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button type="submit">{editingJd ? "Save Changes" : "Add Job Description"}</Button>
                </DialogFooter>
            </form>
            </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
