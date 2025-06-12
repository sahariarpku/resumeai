
"use client";

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Edit3, Trash2, Save, UserCircle, Briefcase, FolderKanban, GraduationCap, Wrench, Award, Home } from "lucide-react";
import type { UserProfile, WorkExperience } from "@/lib/types";
import { userProfileSchema, workExperienceSchema, UserProfileFormData, WorkExperienceFormData } from "@/lib/schemas";
import { FormSection, FormSectionList } from '@/components/forms/form-section';
import { WorkExperienceFormFields } from '@/components/forms/work-experience-form-fields';

const USER_PROFILE_STORAGE_KEY = "userProfile";

// Mock initial data - only used if nothing in localStorage
const fallbackInitialProfileData: UserProfile = {
  id: "user123",
  fullName: "Jane Doe",
  email: "jane.doe@example.com", // This will be overwritten by localStorage if available
  address: "123 Main St, Anytown, USA",
  summary: "A passionate software engineer with 5 years of experience.",
  workExperiences: [
    { id: "we1", company: "Tech Solutions Inc.", role: "Senior Developer", startDate: "2020-01", endDate: "Present", description: "Developed awesome things.", achievements: ["Led a team", "Launched a product"] },
  ],
  projects: [],
  education: [],
  skills: [],
  certifications: [],
};


export default function ProfilePage() {
  const { toast } = useToast();
  const [profileData, setProfileData] = useState<UserProfile>(fallbackInitialProfileData);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);


  const [isWorkExperienceModalOpen, setIsWorkExperienceModalOpen] = useState(false);
  const [editingWorkExperience, setEditingWorkExperience] = useState<WorkExperience | null>(null);

  const generalInfoForm = useForm<UserProfileFormData>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      fullName: "",
      email: "", 
      phone: "",
      address: "",
      linkedin: "",
      github: "",
      portfolio: "",
      summary: "",
    },
  });

  const workExperienceForm = useForm<WorkExperienceFormData>({
    resolver: zodResolver(workExperienceSchema),
    defaultValues: {},
  });

  useEffect(() => {
    try {
      const storedProfileString = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
      if (storedProfileString) {
        const storedProfile = JSON.parse(storedProfileString) as UserProfile;
        setProfileData(storedProfile);
        generalInfoForm.reset({
            fullName: storedProfile.fullName || "",
            email: storedProfile.email || "user@example.com", // Ensure email field has a default
            phone: storedProfile.phone || "",
            address: storedProfile.address || "",
            linkedin: storedProfile.linkedin || "",
            github: storedProfile.github || "",
            portfolio: storedProfile.portfolio || "",
            summary: storedProfile.summary || "",
        });
      } else {
        // Use fallback if nothing in local storage, and save it
        setProfileData(fallbackInitialProfileData);
        generalInfoForm.reset({
            fullName: fallbackInitialProfileData.fullName || "",
            email: fallbackInitialProfileData.email || "user@example.com",
            phone: fallbackInitialProfileData.phone || "",
            address: fallbackInitialProfileData.address || "",
            linkedin: fallbackInitialProfileData.linkedin || "",
            github: fallbackInitialProfileData.github || "",
            portfolio: fallbackInitialProfileData.portfolio || "",
            summary: fallbackInitialProfileData.summary || "",
        });
        localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(fallbackInitialProfileData));
      }
    } catch (error) {
      console.error("Failed to load profile from localStorage:", error);
      // Use fallback and set it in form
      setProfileData(fallbackInitialProfileData);
       generalInfoForm.reset({
            fullName: fallbackInitialProfileData.fullName || "",
            email: fallbackInitialProfileData.email || "user@example.com",
            phone: fallbackInitialProfileData.phone || "",
            address: fallbackInitialProfileData.address || "",
            linkedin: fallbackInitialProfileData.linkedin || "",
            github: fallbackInitialProfileData.github || "",
            portfolio: fallbackInitialProfileData.portfolio || "",
            summary: fallbackInitialProfileData.summary || "",
        });
      toast({
        title: "Load Error",
        description: "Could not load profile from local storage. Using default.",
        variant: "destructive",
      });
    }
    setIsProfileLoaded(true);
  }, [toast, generalInfoForm]);


  const saveProfile = (updatedProfile: UserProfile) => {
    setProfileData(updatedProfile);
    try {
      localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(updatedProfile));
    } catch (error) {
      console.error("Failed to save profile to localStorage:", error);
      toast({
        title: "Save Error",
        description: "Could not save profile to local storage.",
        variant: "destructive",
      });
    }
  };


  const onGeneralInfoSubmit = (data: UserProfileFormData) => {
    const updatedProfile = { ...profileData, ...data };
    saveProfile(updatedProfile);
    toast({ title: "Profile Updated", description: "Your general information has been saved." });
  };

  const handleAddWorkExperience = () => {
    setEditingWorkExperience(null);
    workExperienceForm.reset({ achievements: '' }); 
    setIsWorkExperienceModalOpen(true);
  };

  const handleEditWorkExperience = (experience: WorkExperience) => {
    setEditingWorkExperience(experience);
    workExperienceForm.reset({
      ...experience,
      achievements: experience.achievements?.join(', ') || ''
    });
    setIsWorkExperienceModalOpen(true);
  };

  const handleDeleteWorkExperience = (id: string) => {
    const updatedWorkExperiences = profileData.workExperiences.filter(exp => exp.id !== id);
    const updatedProfile = { ...profileData, workExperiences: updatedWorkExperiences };
    saveProfile(updatedProfile);
    toast({ title: "Work Experience Removed", variant: "destructive" });
  };

  const onWorkExperienceSubmit = (data: WorkExperienceFormData) => {
    const achievementsArray = data.achievements?.split(',').map(s => s.trim()).filter(Boolean);
    let updatedWorkExperiences;
    if (editingWorkExperience) {
      updatedWorkExperiences = profileData.workExperiences.map(exp =>
        exp.id === editingWorkExperience.id ? { ...exp, ...data, achievements: achievementsArray, id: exp.id } : exp
      );
      toast({ title: "Work Experience Updated" });
    } else {
      updatedWorkExperiences = [...profileData.workExperiences, { ...data, achievements: achievementsArray, id: `we-${Date.now()}` }];
      toast({ title: "Work Experience Added" });
    }
    const updatedProfile = { ...profileData, workExperiences: updatedWorkExperiences };
    saveProfile(updatedProfile);
    setIsWorkExperienceModalOpen(false);
    setEditingWorkExperience(null);
  };
  
  if (!isProfileLoaded) {
    return <div className="container mx-auto py-8 text-center">Loading profile...</div>;
  }

  const sectionIconProps = { className: "h-5 w-5 mr-2 text-primary" };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold">Your Professional Profile</h1>
        <p className="text-muted-foreground">
          Complete your profile to enable AI-powered resume tailoring. The more details you provide, the better ResumeForge can assist you.
        </p>
      </div>

      <Accordion type="multiple" defaultValue={['general-info', 'work-experience']} className="w-full space-y-4">
        <AccordionItem value="general-info" className="border-none">
            <FormSection
              title="General Information"
              description="Basic contact and summary details."
            >
              <Form {...generalInfoForm}>
                <form onSubmit={generalInfoForm.handleSubmit(onGeneralInfoSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={generalInfoForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={generalInfoForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl><Input type="email" {...field} disabled/></FormControl>
                          <FormDescription>Email is managed via your account settings.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={generalInfoForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone (Optional)</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={generalInfoForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address (Optional)</FormLabel>
                          <FormControl><Input placeholder="e.g. 123 Main St, Anytown, USA" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={generalInfoForm.control}
                      name="linkedin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>LinkedIn Profile URL (Optional)</FormLabel>
                          <FormControl><Input placeholder="https://linkedin.com/in/yourprofile" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={generalInfoForm.control}
                      name="github"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GitHub Profile URL (Optional)</FormLabel>
                          <FormControl><Input placeholder="https://github.com/yourusername" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={generalInfoForm.control}
                      name="portfolio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Portfolio URL (Optional)</FormLabel>
                          <FormControl><Input placeholder="https://yourportfolio.com" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={generalInfoForm.control}
                    name="summary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Professional Summary</FormLabel>
                        <FormControl><Textarea placeholder="A brief summary of your career..." {...field} rows={4} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" size="lg"><Save className="mr-2 h-4 w-4"/> Save General Info</Button>
                </form>
              </Form>
            </FormSection>
        </AccordionItem>

        {/* Work Experience Section */}
        <AccordionItem value="work-experience" id="work-experience" className="border-none">
            <FormSection
              title="Work Experience"
              description="Detail your past and current roles."
              actions={
                <Button onClick={handleAddWorkExperience} variant="outline">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Work Experience
                </Button>
              }
            >
              <FormSectionList
                items={profileData.workExperiences}
                renderItem={(exp) => (
                  <div key={exp.id} className="p-4 rounded-md border bg-card/50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{exp.role} at {exp.company}</h4>
                        <p className="text-sm text-muted-foreground">{exp.startDate} - {exp.endDate || 'Present'}</p>
                        <p className="text-sm mt-1 whitespace-pre-line">{exp.description}</p>
                        {exp.achievements && exp.achievements.length > 0 && (
                            <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
                                {exp.achievements.map((ach, i) => <li key={i}>{ach}</li>)}
                            </ul>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditWorkExperience(exp)}><Edit3 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteWorkExperience(exp.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </div>
                )}
                emptyState={<p className="text-sm text-muted-foreground">No work experience added yet.</p>}
              />
            </FormSection>
        </AccordionItem>
        
        {/* Placeholder for other sections */}
        <AccordionItem value="projects" id="projects" className="border-none">
            <FormSection title="Projects" description="Showcase your personal or professional projects.">
                <p className="text-sm text-muted-foreground">Project management coming soon.</p>
            </FormSection>
        </AccordionItem>
        <AccordionItem value="education" id="education" className="border-none">
            <FormSection title="Education" description="List your academic qualifications.">
                <p className="text-sm text-muted-foreground">Education management coming soon.</p>
            </FormSection>
        </AccordionItem>
        <AccordionItem value="skills" id="skills" className="border-none">
            <FormSection title="Skills" description="Highlight your technical and soft skills.">
                <p className="text-sm text-muted-foreground">Skill management coming soon.</p>
            </FormSection>
        </AccordionItem>
        <AccordionItem value="certifications" id="certifications" className="border-none">
            <FormSection title="Certifications" description="Add any relevant certifications.">
                <p className="text-sm text-muted-foreground">Certification management coming soon.</p>
            </FormSection>
        </AccordionItem>

      </Accordion>

      {/* Work Experience Modal/Dialog */}
      <Dialog open={isWorkExperienceModalOpen} onOpenChange={setIsWorkExperienceModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-headline">
              {editingWorkExperience ? 'Edit Work Experience' : 'Add New Work Experience'}
            </DialogTitle>
            <DialogDescription>
              Provide details about your professional role.
            </DialogDescription>
          </DialogHeader>
          <Form {...workExperienceForm}>
            <form onSubmit={workExperienceForm.handleSubmit(onWorkExperienceSubmit)} className="space-y-6 py-4">
              <WorkExperienceFormFields control={workExperienceForm.control} />
              <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit"><Save className="mr-2 h-4 w-4"/> {editingWorkExperience ? 'Save Changes' : 'Add Experience'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    