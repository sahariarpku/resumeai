
"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionItem,
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
  DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Edit3, Trash2, Save, UserCircle, Briefcase, FolderKanban, GraduationCap, Wrench, Award, Loader2, Sparkles, Trophy, BookOpen, Contact, LayoutList } from "lucide-react";
import type { UserProfile, WorkExperience, Project, Education, Skill, Certification, HonorAward, Publication, Reference, CustomSection } from "@/lib/types";
import { 
    userProfileSchema, UserProfileFormData,
    workExperienceSchema, WorkExperienceFormData,
    projectSchema, ProjectFormData,
    educationSchema, EducationFormData,
    skillSchema, SkillFormData,
    certificationSchema, CertificationFormData,
    honorAwardSchema, HonorAwardFormData,
    publicationSchema, PublicationFormData,
    referenceSchema, ReferenceFormData,
    customSectionSchema, CustomSectionFormData
} from "@/lib/schemas";
import { FormSection, FormSectionList } from '@/components/forms/form-section';
import { WorkExperienceFormFields } from '@/components/forms/work-experience-form-fields';
import { ProjectFormFields } from '@/components/forms/project-form-fields';
import { EducationFormFields } from '@/components/forms/education-form-fields';
import { SkillFormFields } from '@/components/forms/skill-form-fields';
import { CertificationFormFields } from '@/components/forms/certification-form-fields';
import { HonorAwardFormFields } from '@/components/forms/honor-award-form-fields';
import { PublicationFormFields } from '@/components/forms/publication-form-fields';
import { ReferenceFormFields } from '@/components/forms/reference-form-fields';
import { CustomSectionFormFields } from '@/components/forms/custom-section-form-fields';
import { polishText } from '@/ai/flows/polish-text-flow';
import { TooltipProvider } from '@/components/ui/tooltip';

const USER_PROFILE_STORAGE_KEY = "userProfile";

const fallbackInitialProfileData: UserProfile = {
  id: "user123",
  fullName: "Jane Doe",
  email: "jane.doe@example.com",
  phone: "",
  address: "123 Main St, Anytown, USA",
  linkedin: "",
  github: "",
  portfolio: "",
  summary: "A passionate software engineer with 5 years of experience.",
  workExperiences: [],
  projects: [],
  education: [],
  skills: [],
  certifications: [],
  honorsAndAwards: [],
  publications: [],
  references: [],
  customSections: [],
};


export default function ProfilePage() {
  const { toast } = useToast();
  const [profileData, setProfileData] = useState<UserProfile>(fallbackInitialProfileData);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);

  const [isWorkExperienceModalOpen, setIsWorkExperienceModalOpen] = useState(false);
  const [editingWorkExperience, setEditingWorkExperience] = useState<WorkExperience | null>(null);
  
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [isEducationModalOpen, setIsEducationModalOpen] = useState(false);
  const [editingEducation, setEditingEducation] = useState<Education | null>(null);

  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);

  const [isCertificationModalOpen, setIsCertificationModalOpen] = useState(false);
  const [editingCertification, setEditingCertification] = useState<Certification | null>(null);

  const [isHonorAwardModalOpen, setIsHonorAwardModalOpen] = useState(false);
  const [editingHonorAward, setEditingHonorAward] = useState<HonorAward | null>(null);

  const [isPublicationModalOpen, setIsPublicationModalOpen] = useState(false);
  const [editingPublication, setEditingPublication] = useState<Publication | null>(null);

  const [isReferenceModalOpen, setIsReferenceModalOpen] = useState(false);
  const [editingReference, setEditingReference] = useState<Reference | null>(null);

  const [isCustomSectionModalOpen, setIsCustomSectionModalOpen] = useState(false);
  const [editingCustomSection, setEditingCustomSection] = useState<CustomSection | null>(null);
  
  const [polishingField, setPolishingField] = useState<string | null>(null);


  const generalInfoForm = useForm<UserProfileFormData>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: fallbackInitialProfileData,
  });

  const workExperienceForm = useForm<WorkExperienceFormData>({ resolver: zodResolver(workExperienceSchema), defaultValues: { company: '', role: '', startDate: '', endDate: '', description: '', achievements: ''} });
  const projectForm = useForm<ProjectFormData>({ resolver: zodResolver(projectSchema), defaultValues: { name: '', description: '', technologies: '', achievements: '', link: ''} });
  const educationForm = useForm<EducationFormData>({ resolver: zodResolver(educationSchema), defaultValues: { institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', gpa: '', thesisTitle: '', relevantCourses: '', description: ''} });
  const skillForm = useForm<SkillFormData>({ resolver: zodResolver(skillSchema), defaultValues: { name: '', category: '', proficiency: undefined } });
  const certificationForm = useForm<CertificationFormData>({ resolver: zodResolver(certificationSchema), defaultValues: { name: '', issuingOrganization: '', issueDate: '', credentialId: '', credentialUrl: ''} });
  const honorAwardForm = useForm<HonorAwardFormData>({ resolver: zodResolver(honorAwardSchema), defaultValues: { name: '', organization: '', date: '', description: ''} });
  const publicationForm = useForm<PublicationFormData>({ resolver: zodResolver(publicationSchema), defaultValues: { title: '', authors: '', journalOrConference: '', publicationDate: '', link: '', doi: '', description: '' } });
  const referenceForm = useForm<ReferenceFormData>({ resolver: zodResolver(referenceSchema), defaultValues: { name: '', titleAndCompany: '', contactDetailsOrNote: ''} });
  const customSectionForm = useForm<CustomSectionFormData>({ resolver: zodResolver(customSectionSchema), defaultValues: { heading: '', content: ''} });


  useEffect(() => {
    try {
      const storedProfileString = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
      if (storedProfileString) {
        const storedProfile = JSON.parse(storedProfileString) as UserProfile;
        const updatedProfile = {
            ...fallbackInitialProfileData, 
            ...storedProfile, 
        };
        setProfileData(updatedProfile);
        generalInfoForm.reset({
            fullName: updatedProfile.fullName || "",
            email: updatedProfile.email || "user@example.com",
            phone: updatedProfile.phone || "",
            address: updatedProfile.address || "",
            linkedin: updatedProfile.linkedin || "",
            github: updatedProfile.github || "",
            portfolio: updatedProfile.portfolio || "",
            summary: updatedProfile.summary || "",
        });
      } else {
        setProfileData(fallbackInitialProfileData);
        generalInfoForm.reset(fallbackInitialProfileData);
        localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(fallbackInitialProfileData));
      }
    } catch (error) {
      console.error("Failed to load profile from localStorage:", error);
      setProfileData(fallbackInitialProfileData); 
      generalInfoForm.reset(fallbackInitialProfileData);
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

  const handleAIPolish = async (fieldName: string, formInstance: ReturnType<typeof useForm<any>>) => {
    const currentValue = formInstance.getValues(fieldName);
    if (typeof currentValue !== 'string' || !currentValue.trim()) {
      toast({ title: "Nothing to Polish", description: "The field is empty.", variant: "default" });
      return;
    }
    setPolishingField(fieldName);
    try {
      const result = await polishText({ textToPolish: currentValue });
      formInstance.setValue(fieldName, result.polishedText, { shouldValidate: true });
      toast({ title: "Text Polished!", description: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} has been updated by AI.` });
    } catch (err) {
      console.error(`Error polishing ${fieldName}:`, err);
      toast({ title: "AI Polish Error", description: `Could not polish ${fieldName}.`, variant: "destructive" });
    } finally {
      setPolishingField(null);
    }
  };

  // --- Work Experience ---
  const handleAddWorkExperience = () => { setEditingWorkExperience(null); workExperienceForm.reset({ company: '', role: '', startDate: '', endDate: '', description: '', achievements: '' }); setIsWorkExperienceModalOpen(true); };
  const handleEditWorkExperience = (experience: WorkExperience) => { setEditingWorkExperience(experience); workExperienceForm.reset({ ...experience, company: experience.company || '', role: experience.role || '', startDate: experience.startDate || '', endDate: experience.endDate || '', description: experience.description || '', achievements: experience.achievements?.join('\n') || '' }); setIsWorkExperienceModalOpen(true); };
  const handleDeleteWorkExperience = (id: string) => { saveProfile({ ...profileData, workExperiences: profileData.workExperiences.filter(exp => exp.id !== id) }); toast({ title: "Work Experience Removed", variant: "destructive" }); };
  const onWorkExperienceSubmit = (data: WorkExperienceFormData) => {
    const achievementsArray = data.achievements?.split('\n').map(s => s.trim()).filter(Boolean);
    let updatedExperiences;
    if (editingWorkExperience) {
      updatedExperiences = profileData.workExperiences.map(exp => exp.id === editingWorkExperience.id ? { ...exp, ...data, achievements: achievementsArray, id: exp.id } : exp);
      toast({ title: "Work Experience Updated" });
    } else {
      updatedExperiences = [...profileData.workExperiences, { ...data, achievements: achievementsArray, id: `we-${Date.now()}` }];
      toast({ title: "Work Experience Added" });
    }
    saveProfile({ ...profileData, workExperiences: updatedExperiences });
    setIsWorkExperienceModalOpen(false); setEditingWorkExperience(null);
  };

  // --- Projects ---
  const handleAddProject = () => { setEditingProject(null); projectForm.reset({ name: '', description: '', technologies: '', achievements: '', link: '' }); setIsProjectModalOpen(true); };
  const handleEditProject = (project: Project) => { setEditingProject(project); projectForm.reset({ ...project, name: project.name || '', description: project.description || '', technologies: project.technologies?.join(', ') || '', achievements: project.achievements?.join('\n') || '', link: project.link || '' }); setIsProjectModalOpen(true); };
  const handleDeleteProject = (id: string) => { saveProfile({ ...profileData, projects: profileData.projects.filter(p => p.id !== id) }); toast({ title: "Project Removed", variant: "destructive" }); };
  const onProjectSubmit = (data: ProjectFormData) => {
    const techArray = data.technologies?.split(',').map(s => s.trim()).filter(Boolean);
    const achievementsArray = data.achievements?.split('\n').map(s => s.trim()).filter(Boolean);
    let updatedProjects;
    if (editingProject) {
      updatedProjects = profileData.projects.map(p => p.id === editingProject.id ? { ...p, ...data, technologies: techArray, achievements: achievementsArray, id: p.id } : p);
      toast({ title: "Project Updated" });
    } else {
      updatedProjects = [...profileData.projects, { ...data, technologies: techArray, achievements: achievementsArray, id: `proj-${Date.now()}` }];
      toast({ title: "Project Added" });
    }
    saveProfile({ ...profileData, projects: updatedProjects });
    setIsProjectModalOpen(false); setEditingProject(null);
  };

  // --- Education ---
  const handleAddEducation = () => { setEditingEducation(null); educationForm.reset({ institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', gpa: '', thesisTitle: '', relevantCourses: '', description: '' }); setIsEducationModalOpen(true); };
  const handleEditEducation = (edu: Education) => { setEditingEducation(edu); educationForm.reset({...edu, institution: edu.institution || '', degree: edu.degree || '', fieldOfStudy: edu.fieldOfStudy || '', startDate: edu.startDate || '', endDate: edu.endDate || '', gpa: edu.gpa || '', thesisTitle: edu.thesisTitle || '', relevantCourses: edu.relevantCourses?.join(', ') || '', description: edu.description || '' }); setIsEducationModalOpen(true); };
  const handleDeleteEducation = (id: string) => { saveProfile({ ...profileData, education: profileData.education.filter(e => e.id !== id) }); toast({ title: "Education Entry Removed", variant: "destructive" }); };
  const onEducationSubmit = (data: EducationFormData) => {
    const coursesArray = data.relevantCourses?.split(',').map(s => s.trim()).filter(Boolean);
    let updatedEducation;
    if (editingEducation) {
      updatedEducation = profileData.education.map(e => e.id === editingEducation.id ? { ...e, ...data, relevantCourses: coursesArray, id: e.id } : e);
      toast({ title: "Education Updated" });
    } else {
      updatedEducation = [...profileData.education, { ...data, relevantCourses: coursesArray, id: `edu-${Date.now()}` }];
      toast({ title: "Education Added" });
    }
    saveProfile({ ...profileData, education: updatedEducation });
    setIsEducationModalOpen(false); setEditingEducation(null);
  };

  // --- Skills ---
  const handleAddSkill = () => { setEditingSkill(null); skillForm.reset({ name: '', category: '', proficiency: undefined }); setIsSkillModalOpen(true); };
  const handleEditSkill = (skill: Skill) => { setEditingSkill(skill); skillForm.reset({ ...skill, name: skill.name || '', category: skill.category || '', proficiency: skill.proficiency || undefined }); setIsSkillModalOpen(true); };
  const handleDeleteSkill = (id: string) => { saveProfile({ ...profileData, skills: profileData.skills.filter(s => s.id !== id) }); toast({ title: "Skill Removed", variant: "destructive" }); };
  const onSkillSubmit = (data: SkillFormData) => {
    let updatedSkills;
    if (editingSkill) {
      updatedSkills = profileData.skills.map(s => s.id === editingSkill.id ? { ...s, ...data, id: s.id } : s);
      toast({ title: "Skill Updated" });
    } else {
      updatedSkills = [...profileData.skills, { ...data, id: `skill-${Date.now()}` }];
      toast({ title: "Skill Added" });
    }
    saveProfile({ ...profileData, skills: updatedSkills });
    setIsSkillModalOpen(false); setEditingSkill(null);
  };

  // --- Certifications ---
  const handleAddCertification = () => { setEditingCertification(null); certificationForm.reset({ name: '', issuingOrganization: '', issueDate: '', credentialId: '', credentialUrl: '' }); setIsCertificationModalOpen(true); };
  const handleEditCertification = (cert: Certification) => { setEditingCertification(cert); certificationForm.reset({ ...cert, name: cert.name || '', issuingOrganization: cert.issuingOrganization || '', issueDate: cert.issueDate || '', credentialId: cert.credentialId || '', credentialUrl: cert.credentialUrl || ''}); setIsCertificationModalOpen(true); };
  const handleDeleteCertification = (id: string) => { saveProfile({ ...profileData, certifications: profileData.certifications.filter(c => c.id !== id) }); toast({ title: "Certification Removed", variant: "destructive" }); };
  const onCertificationSubmit = (data: CertificationFormData) => {
    let updatedCerts;
    if (editingCertification) {
      updatedCerts = profileData.certifications.map(c => c.id === editingCertification.id ? { ...c, ...data, id: c.id } : c);
      toast({ title: "Certification Updated" });
    } else {
      updatedCerts = [...profileData.certifications, { ...data, id: `cert-${Date.now()}` }];
      toast({ title: "Certification Added" });
    }
    saveProfile({ ...profileData, certifications: updatedCerts });
    setIsCertificationModalOpen(false); setEditingCertification(null);
  };

  // --- Honors & Awards ---
  const handleAddHonorAward = () => { setEditingHonorAward(null); honorAwardForm.reset({ name: '', organization: '', date: '', description: '' }); setIsHonorAwardModalOpen(true); };
  const handleEditHonorAward = (item: HonorAward) => { setEditingHonorAward(item); honorAwardForm.reset({ ...item, name: item.name || '', organization: item.organization || '', date: item.date || '', description: item.description || '' }); setIsHonorAwardModalOpen(true); };
  const handleDeleteHonorAward = (id: string) => { saveProfile({ ...profileData, honorsAndAwards: profileData.honorsAndAwards.filter(item => item.id !== id) }); toast({ title: "Honor/Award Removed", variant: "destructive" }); };
  const onHonorAwardSubmit = (data: HonorAwardFormData) => {
    let updatedItems;
    if (editingHonorAward) {
      updatedItems = profileData.honorsAndAwards.map(item => item.id === editingHonorAward.id ? { ...item, ...data, id: item.id } : item);
      toast({ title: "Honor/Award Updated" });
    } else {
      updatedItems = [...profileData.honorsAndAwards, { ...data, id: `ha-${Date.now()}` }];
      toast({ title: "Honor/Award Added" });
    }
    saveProfile({ ...profileData, honorsAndAwards: updatedItems });
    setIsHonorAwardModalOpen(false); setEditingHonorAward(null);
  };

  // --- Publications ---
  const handleAddPublication = () => { setEditingPublication(null); publicationForm.reset({ title: '', authors: '', journalOrConference: '', publicationDate: '', link: '', doi: '', description: '' }); setIsPublicationModalOpen(true); };
  const handleEditPublication = (item: Publication) => { setEditingPublication(item); publicationForm.reset({ ...item, title: item.title || '', authors: item.authors?.join(', ') || '', journalOrConference: item.journalOrConference || '', publicationDate: item.publicationDate || '', link: item.link || '', doi: item.doi || '', description: item.description || '' }); setIsPublicationModalOpen(true); };
  const handleDeletePublication = (id: string) => { saveProfile({ ...profileData, publications: profileData.publications.filter(item => item.id !== id) }); toast({ title: "Publication Removed", variant: "destructive" }); };
  const onPublicationSubmit = (data: PublicationFormData) => {
    const authorsArray = data.authors?.split(',').map(s => s.trim()).filter(Boolean);
    let updatedItems;
    if (editingPublication) {
      updatedItems = profileData.publications.map(item => item.id === editingPublication.id ? { ...item, ...data, authors: authorsArray, id: item.id } : item);
      toast({ title: "Publication Updated" });
    } else {
      updatedItems = [...profileData.publications, { ...data, authors: authorsArray, id: `pub-${Date.now()}` }];
      toast({ title: "Publication Added" });
    }
    saveProfile({ ...profileData, publications: updatedItems });
    setIsPublicationModalOpen(false); setEditingPublication(null);
  };

  // --- References ---
  const handleAddReference = () => { setEditingReference(null); referenceForm.reset({ name: '', titleAndCompany: '', contactDetailsOrNote: '' }); setIsReferenceModalOpen(true); };
  const handleEditReference = (item: Reference) => { setEditingReference(item); referenceForm.reset({ ...item, name: item.name || '', titleAndCompany: item.titleAndCompany || '', contactDetailsOrNote: item.contactDetailsOrNote || '' }); setIsReferenceModalOpen(true); };
  const handleDeleteReference = (id: string) => { saveProfile({ ...profileData, references: profileData.references.filter(item => item.id !== id) }); toast({ title: "Reference Removed", variant: "destructive" }); };
  const onReferenceSubmit = (data: ReferenceFormData) => {
    let updatedItems;
    if (editingReference) {
      updatedItems = profileData.references.map(item => item.id === editingReference.id ? { ...item, ...data, id: item.id } : item);
      toast({ title: "Reference Updated" });
    } else {
      updatedItems = [...profileData.references, { ...data, id: `ref-${Date.now()}` }];
      toast({ title: "Reference Added" });
    }
    saveProfile({ ...profileData, references: updatedItems });
    setIsReferenceModalOpen(false); setEditingReference(null);
  };

  // --- Custom Sections ---
  const handleAddCustomSection = () => { setEditingCustomSection(null); customSectionForm.reset({ heading: '', content: '' }); setIsCustomSectionModalOpen(true); };
  const handleEditCustomSection = (item: CustomSection) => { setEditingCustomSection(item); customSectionForm.reset({ ...item, heading: item.heading || '', content: item.content || ''}); setIsCustomSectionModalOpen(true); };
  const handleDeleteCustomSection = (id: string) => { saveProfile({ ...profileData, customSections: profileData.customSections.filter(item => item.id !== id) }); toast({ title: "Custom Section Removed", variant: "destructive" }); };
  const onCustomSectionSubmit = (data: CustomSectionFormData) => {
    let updatedItems;
    if (editingCustomSection) {
      updatedItems = profileData.customSections.map(item => item.id === editingCustomSection.id ? { ...item, ...data, id: item.id } : item);
      toast({ title: "Custom Section Updated" });
    } else {
      updatedItems = [...profileData.customSections, { ...data, id: `cs-${Date.now()}` }];
      toast({ title: "Custom Section Added" });
    }
    saveProfile({ ...profileData, customSections: updatedItems });
    setIsCustomSectionModalOpen(false); setEditingCustomSection(null);
  };

  
  if (!isProfileLoaded) {
    return <div className="container mx-auto py-8 text-center flex justify-center items-center min-h-[200px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading profile...</span></div>;
  }

  return (
    <TooltipProvider>
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold">Your Professional Profile</h1>
        <p className="text-muted-foreground">
          Complete your profile to enable AI-powered resume tailoring. The more details you provide, the better ResumeForge can assist you.
        </p>
      </div>

      <Accordion type="multiple" defaultValue={['general-info', 'work-experience', 'education']} className="w-full space-y-4">
        <AccordionItem value="general-info" className="border-none">
            <FormSection
              title="General Information"
              description="Basic contact and summary details."
            >
              <Form {...generalInfoForm}>
                <form onSubmit={generalInfoForm.handleSubmit(onGeneralInfoSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={generalInfoForm.control} name="fullName" render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={generalInfoForm.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} disabled/></FormControl><FormDescription>Email is managed via your account settings.</FormDescription><FormMessage /></FormItem>)} />
                    <FormField control={generalInfoForm.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={generalInfoForm.control} name="address" render={({ field }) => (<FormItem><FormLabel>Address (Optional)</FormLabel><FormControl><Input placeholder="e.g. 123 Main St, Anytown, USA" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={generalInfoForm.control} name="linkedin" render={({ field }) => (<FormItem><FormLabel>LinkedIn Profile URL (Optional)</FormLabel><FormControl><Input placeholder="https://linkedin.com/in/yourprofile" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={generalInfoForm.control} name="github" render={({ field }) => (<FormItem><FormLabel>GitHub Profile URL (Optional)</FormLabel><FormControl><Input placeholder="https://github.com/yourusername" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={generalInfoForm.control} name="portfolio" render={({ field }) => (<FormItem><FormLabel>Portfolio URL (Optional)</FormLabel><FormControl><Input placeholder="https://yourportfolio.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <FormField
                    control={generalInfoForm.control}
                    name="summary"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between items-center">
                            <FormLabel>Professional Summary</FormLabel>
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleAIPolish('summary', generalInfoForm)} disabled={polishingField === 'summary' || generalInfoForm.formState.isSubmitting}>
                                {polishingField === 'summary' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary" />}
                            </Button>
                        </div>
                        <FormControl><Textarea placeholder="A brief summary of your career..." {...field} rows={4} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" size="lg" disabled={generalInfoForm.formState.isSubmitting}><Save className="mr-2 h-4 w-4"/> {generalInfoForm.formState.isSubmitting ? <Loader2 className="animate-spin" /> : "Save General Info"}</Button>
                </form>
              </Form>
            </FormSection>
        </AccordionItem>

        <AccordionItem value="work-experience" id="work-experience" className="border-none">
            <FormSection
              title="Work Experience"
              description="Detail your past and current roles."
              actions={<Button onClick={handleAddWorkExperience} variant="outline"><PlusCircle className="mr-2 h-4 w-4" /> Add Work Experience</Button>}
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
                        {exp.achievements && exp.achievements.length > 0 && (<ul className="list-disc list-inside text-sm text-muted-foreground mt-1">{exp.achievements.map((ach, i) => <li key={i}>{ach}</li>)}</ul>)}
                      </div>
                      <div className="flex gap-1">
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
        
        <AccordionItem value="projects" id="projects" className="border-none">
            <FormSection
              title="Projects"
              description="Showcase your personal or professional projects."
              actions={<Button onClick={handleAddProject} variant="outline"><PlusCircle className="mr-2 h-4 w-4" /> Add Project</Button>}
            >
              <FormSectionList
                items={profileData.projects}
                renderItem={(proj) => (
                  <div key={proj.id} className="p-4 rounded-md border bg-card/50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{proj.name}</h4>
                        {proj.link && <a href={proj.link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">{proj.link}</a>}
                        <p className="text-sm mt-1 whitespace-pre-line">{proj.description}</p>
                        {proj.technologies && proj.technologies.length > 0 && <p className="text-xs text-muted-foreground mt-1">Tech: {proj.technologies.join(', ')}</p>}
                        {proj.achievements && proj.achievements.length > 0 && (<ul className="list-disc list-inside text-sm text-muted-foreground mt-1">{proj.achievements.map((ach, i) => <li key={i}>{ach}</li>)}</ul>)}
                      </div>
                       <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEditProject(proj)}><Edit3 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteProject(proj.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </div>
                )}
                emptyState={<p className="text-sm text-muted-foreground">No projects added yet.</p>}
              />
            </FormSection>
        </AccordionItem>

        <AccordionItem value="education" id="education" className="border-none">
            <FormSection
              title="Education"
              description="List your academic qualifications and achievements."
              actions={<Button onClick={handleAddEducation} variant="outline"><PlusCircle className="mr-2 h-4 w-4" /> Add Education</Button>}
            >
              <FormSectionList
                items={profileData.education}
                renderItem={(edu) => (
                  <div key={edu.id} className="p-4 rounded-md border bg-card/50">
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className="font-semibold">{edu.degree} in {edu.fieldOfStudy}</h4>
                            <p className="text-sm text-muted-foreground">{edu.institution}</p>
                            <p className="text-xs text-muted-foreground">{edu.startDate} - {edu.endDate || 'Expected'}</p>
                            {edu.gpa && <p className="text-xs text-muted-foreground">GPA/Result: {edu.gpa}</p>}
                            {edu.thesisTitle && <p className="text-xs text-muted-foreground mt-1">Thesis: {edu.thesisTitle}</p>}
                            {edu.relevantCourses && edu.relevantCourses.length > 0 && <p className="text-xs text-muted-foreground mt-1">Courses: {edu.relevantCourses.join(', ')}</p>}
                            {edu.description && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line">Notes: {edu.description}</p>}
                        </div>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEditEducation(edu)}><Edit3 className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteEducation(edu.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                    </div>
                  </div>
                )}
                emptyState={<p className="text-sm text-muted-foreground">No education entries added yet.</p>}
              />
            </FormSection>
        </AccordionItem>

        <AccordionItem value="honors-awards" id="honors-awards" className="border-none">
            <FormSection
              title="Honors &amp; Awards"
              description="List your recognitions and accolades."
              actions={<Button onClick={handleAddHonorAward} variant="outline"><PlusCircle className="mr-2 h-4 w-4" /> Add Honor/Award</Button>}
            >
              <FormSectionList
                items={profileData.honorsAndAwards}
                renderItem={(item) => (
                  <div key={item.id} className="p-4 rounded-md border bg-card/50">
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className="font-semibold">{item.name}</h4>
                            {item.organization && <p className="text-sm text-muted-foreground">{item.organization}</p>}
                            {item.date && <p className="text-xs text-muted-foreground">Date: {item.date}</p>}
                            {item.description && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line">{item.description}</p>}
                        </div>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEditHonorAward(item)}><Edit3 className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteHonorAward(item.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                    </div>
                  </div>
                )}
                emptyState={<p className="text-sm text-muted-foreground">No honors or awards added yet.</p>}
              />
            </FormSection>
        </AccordionItem>

        <AccordionItem value="publications" id="publications" className="border-none">
            <FormSection
              title="Publications"
              description="Showcase your published work."
              actions={<Button onClick={handleAddPublication} variant="outline"><PlusCircle className="mr-2 h-4 w-4" /> Add Publication</Button>}
            >
              <FormSectionList
                items={profileData.publications}
                renderItem={(item) => (
                  <div key={item.id} className="p-4 rounded-md border bg-card/50">
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className="font-semibold">{item.title}</h4>
                            {item.authors && item.authors.length > 0 && <p className="text-sm text-muted-foreground">Authors: {item.authors.join(', ')}</p>}
                            {item.journalOrConference && <p className="text-sm text-muted-foreground">{item.journalOrConference}</p>}
                            {item.publicationDate && <p className="text-xs text-muted-foreground">Date: {item.publicationDate}</p>}
                            {item.doi && <p className="text-xs text-muted-foreground">DOI: {item.doi}</p>}
                            {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline block">View Publication</a>}
                            {item.description && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line">{item.description}</p>}
                        </div>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEditPublication(item)}><Edit3 className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeletePublication(item.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                    </div>
                  </div>
                )}
                emptyState={<p className="text-sm text-muted-foreground">No publications added yet.</p>}
              />
            </FormSection>
        </AccordionItem>

        <AccordionItem value="skills" id="skills" className="border-none">
            <FormSection
              title="Skills"
              description="Highlight your technical and soft skills."
              actions={<Button onClick={handleAddSkill} variant="outline"><PlusCircle className="mr-2 h-4 w-4" /> Add Skill</Button>}
            >
              <FormSectionList
                items={profileData.skills}
                renderItem={(skill) => (
                  <div key={skill.id} className="p-4 rounded-md border bg-card/50">
                     <div className="flex justify-between items-start">
                        <div>
                            <h4 className="font-semibold">{skill.name}</h4>
                            {skill.category && <p className="text-xs text-muted-foreground">Category: {skill.category}</p>}
                            {skill.proficiency && <p className="text-xs text-muted-foreground">Proficiency: {skill.proficiency}</p>}
                        </div>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEditSkill(skill)}><Edit3 className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteSkill(skill.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                    </div>
                  </div>
                )}
                emptyState={<p className="text-sm text-muted-foreground">No skills added yet.</p>}
              />
            </FormSection>
        </AccordionItem>

        <AccordionItem value="certifications" id="certifications" className="border-none">
            <FormSection
              title="Certifications"
              description="Add any relevant certifications."
              actions={<Button onClick={handleAddCertification} variant="outline"><PlusCircle className="mr-2 h-4 w-4" /> Add Certification</Button>}
            >
              <FormSectionList
                items={profileData.certifications}
                renderItem={(cert) => (
                  <div key={cert.id} className="p-4 rounded-md border bg-card/50">
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className="font-semibold">{cert.name}</h4>
                            <p className="text-sm text-muted-foreground">{cert.issuingOrganization} - Issued: {cert.issueDate}</p>
                            {cert.credentialId && <p className="text-xs text-muted-foreground">ID: {cert.credentialId}</p>}
                            {cert.credentialUrl && <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">View Credential</a>}
                        </div>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEditCertification(cert)}><Edit3 className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteCertification(cert.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                    </div>
                  </div>
                )}
                emptyState={<p className="text-sm text-muted-foreground">No certifications added yet.</p>}
              />
            </FormSection>
        </AccordionItem>

        <AccordionItem value="references" id="references" className="border-none">
            <FormSection
              title="References"
              description="Provide professional or academic references."
              actions={<Button onClick={handleAddReference} variant="outline"><PlusCircle className="mr-2 h-4 w-4" /> Add Reference</Button>}
            >
              <FormSectionList
                items={profileData.references}
                renderItem={(item) => (
                  <div key={item.id} className="p-4 rounded-md border bg-card/50">
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className="font-semibold">{item.name}</h4>
                            {item.titleAndCompany && <p className="text-sm text-muted-foreground">{item.titleAndCompany}</p>}
                            {item.contactDetailsOrNote && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line">{item.contactDetailsOrNote}</p>}
                        </div>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEditReference(item)}><Edit3 className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteReference(item.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                    </div>
                  </div>
                )}
                emptyState={<p className="text-sm text-muted-foreground">No references added yet. You can add contact details or simply state "Available upon request".</p>}
              />
            </FormSection>
        </AccordionItem>

        <AccordionItem value="custom-sections" id="custom-sections" className="border-none">
            <FormSection
              title="Custom Sections"
              description="Add any other relevant sections to your profile."
              actions={<Button onClick={handleAddCustomSection} variant="outline"><PlusCircle className="mr-2 h-4 w-4" /> Add Custom Section</Button>}
            >
              <FormSectionList
                items={profileData.customSections}
                renderItem={(item) => (
                  <div key={item.id} className="p-4 rounded-md border bg-card/50">
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className="font-semibold uppercase">{item.heading}</h4>
                            <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{item.content}</p>
                        </div>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEditCustomSection(item)}><Edit3 className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteCustomSection(item.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                    </div>
                  </div>
                )}
                emptyState={<p className="text-sm text-muted-foreground">No custom sections added yet. Use this for things like 'Languages', 'Hobbies', etc.</p>}
              />
            </FormSection>
        </AccordionItem>

      </Accordion>

      {/* Work Experience Modal */}
      <Dialog open={isWorkExperienceModalOpen} onOpenChange={setIsWorkExperienceModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle className="font-headline">{editingWorkExperience ? 'Edit Work Experience' : 'Add New Work Experience'}</DialogTitle><DialogDescription>Provide details about your professional role.</DialogDescription></DialogHeader>
          <Form {...workExperienceForm}>
            <form onSubmit={workExperienceForm.handleSubmit(onWorkExperienceSubmit)} className="space-y-6 py-4">
              <WorkExperienceFormFields control={workExperienceForm.control} onPolishRequest={(fieldName) => handleAIPolish(fieldName, workExperienceForm)} polishingField={polishingField as keyof WorkExperienceFormData | null} isSubmitting={workExperienceForm.formState.isSubmitting} />
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit" disabled={workExperienceForm.formState.isSubmitting}><Save className="mr-2 h-4 w-4"/>{workExperienceForm.formState.isSubmitting ? <Loader2 className="animate-spin"/> : (editingWorkExperience ? 'Save Changes' : 'Add Experience')}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Project Modal */}
      <Dialog open={isProjectModalOpen} onOpenChange={setIsProjectModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle className="font-headline">{editingProject ? 'Edit Project' : 'Add New Project'}</DialogTitle><DialogDescription>Detail your project.</DialogDescription></DialogHeader>
          <Form {...projectForm}>
            <form onSubmit={projectForm.handleSubmit(onProjectSubmit)} className="space-y-6 py-4">
              <ProjectFormFields control={projectForm.control} onPolishRequest={(fieldName) => handleAIPolish(fieldName, projectForm)} polishingField={polishingField as keyof ProjectFormData | null} isSubmitting={projectForm.formState.isSubmitting} />
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit" disabled={projectForm.formState.isSubmitting}><Save className="mr-2 h-4 w-4"/>{projectForm.formState.isSubmitting ? <Loader2 className="animate-spin"/> : (editingProject ? 'Save Changes' : 'Add Project')}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Education Modal */}
      <Dialog open={isEducationModalOpen} onOpenChange={setIsEducationModalOpen}>
        <DialogContent className="sm:max-w-2xl"> 
          <DialogHeader><DialogTitle className="font-headline">{editingEducation ? 'Edit Education' : 'Add New Education'}</DialogTitle><DialogDescription>Provide your educational qualifications and details.</DialogDescription></DialogHeader>
          <Form {...educationForm}>
            <form onSubmit={educationForm.handleSubmit(onEducationSubmit)} className="space-y-6 py-4">
              <EducationFormFields control={educationForm.control} onPolishRequest={(fieldName) => handleAIPolish(fieldName, educationForm)} polishingField={polishingField as keyof EducationFormData | null} isSubmitting={educationForm.formState.isSubmitting} />
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit" disabled={educationForm.formState.isSubmitting}><Save className="mr-2 h-4 w-4"/>{educationForm.formState.isSubmitting ? <Loader2 className="animate-spin"/> : (editingEducation ? 'Save Changes' : 'Add Education')}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Honor/Award Modal */}
      <Dialog open={isHonorAwardModalOpen} onOpenChange={setIsHonorAwardModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle className="font-headline">{editingHonorAward ? 'Edit Honor/Award' : 'Add New Honor/Award'}</DialogTitle><DialogDescription>Detail your honors and awards.</DialogDescription></DialogHeader>
          <Form {...honorAwardForm}>
            <form onSubmit={honorAwardForm.handleSubmit(onHonorAwardSubmit)} className="space-y-6 py-4">
              <HonorAwardFormFields control={honorAwardForm.control} onPolishRequest={(fieldName) => handleAIPolish(fieldName, honorAwardForm)} polishingField={polishingField as keyof HonorAwardFormData | null} isSubmitting={honorAwardForm.formState.isSubmitting} />
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit" disabled={honorAwardForm.formState.isSubmitting}><Save className="mr-2 h-4 w-4"/>{honorAwardForm.formState.isSubmitting ? <Loader2 className="animate-spin"/> : (editingHonorAward ? 'Save Changes' : 'Add Honor/Award')}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Publication Modal */}
      <Dialog open={isPublicationModalOpen} onOpenChange={setIsPublicationModalOpen}>
        <DialogContent className="sm:max-w-2xl"> 
          <DialogHeader><DialogTitle className="font-headline">{editingPublication ? 'Edit Publication' : 'Add New Publication'}</DialogTitle><DialogDescription>Detail your published work.</DialogDescription></DialogHeader>
          <Form {...publicationForm}>
            <form onSubmit={publicationForm.handleSubmit(onPublicationSubmit)} className="space-y-6 py-4">
              <PublicationFormFields control={publicationForm.control} onPolishRequest={(fieldName) => handleAIPolish(fieldName, publicationForm)} polishingField={polishingField as keyof PublicationFormData | null} isSubmitting={publicationForm.formState.isSubmitting} />
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit" disabled={publicationForm.formState.isSubmitting}><Save className="mr-2 h-4 w-4"/>{publicationForm.formState.isSubmitting ? <Loader2 className="animate-spin"/> : (editingPublication ? 'Save Changes' : 'Add Publication')}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Reference Modal */}
      <Dialog open={isReferenceModalOpen} onOpenChange={setIsReferenceModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle className="font-headline">{editingReference ? 'Edit Reference' : 'Add New Reference'}</DialogTitle><DialogDescription>Provide reference details.</DialogDescription></DialogHeader>
          <Form {...referenceForm}>
            <form onSubmit={referenceForm.handleSubmit(onReferenceSubmit)} className="space-y-6 py-4">
              <ReferenceFormFields control={referenceForm.control} onPolishRequest={(fieldName) => handleAIPolish(fieldName, referenceForm)} polishingField={polishingField as keyof ReferenceFormData | null} isSubmitting={referenceForm.formState.isSubmitting} />
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit" disabled={referenceForm.formState.isSubmitting}><Save className="mr-2 h-4 w-4"/>{referenceForm.formState.isSubmitting ? <Loader2 className="animate-spin"/> : (editingReference ? 'Save Changes' : 'Add Reference')}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Custom Section Modal */}
      <Dialog open={isCustomSectionModalOpen} onOpenChange={setIsCustomSectionModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle className="font-headline">{editingCustomSection ? 'Edit Custom Section' : 'Add New Custom Section'}</DialogTitle><DialogDescription>Define a custom heading and content for your profile.</DialogDescription></DialogHeader>
          <Form {...customSectionForm}>
            <form onSubmit={customSectionForm.handleSubmit(onCustomSectionSubmit)} className="space-y-6 py-4">
              <CustomSectionFormFields control={customSectionForm.control} onPolishRequest={(fieldName) => handleAIPolish(fieldName, customSectionForm)} polishingField={polishingField as keyof CustomSectionFormData | null} isSubmitting={customSectionForm.formState.isSubmitting} />
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit" disabled={customSectionForm.formState.isSubmitting}><Save className="mr-2 h-4 w-4"/>{customSectionForm.formState.isSubmitting ? <Loader2 className="animate-spin"/> : (editingCustomSection ? 'Save Changes' : 'Add Custom Section')}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Skill Modal */}
      <Dialog open={isSkillModalOpen} onOpenChange={setIsSkillModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-headline">{editingSkill ? 'Edit Skill' : 'Add New Skill'}</DialogTitle><DialogDescription>Add a skill and optionally categorize it.</DialogDescription></DialogHeader>
          <Form {...skillForm}>
            <form onSubmit={skillForm.handleSubmit(onSkillSubmit)} className="space-y-6 py-4">
              <SkillFormFields control={skillForm.control} />
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit" disabled={skillForm.formState.isSubmitting}><Save className="mr-2 h-4 w-4"/>{skillForm.formState.isSubmitting ? <Loader2 className="animate-spin"/> : (editingSkill ? 'Save Changes' : 'Add Skill')}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Certification Modal */}
      <Dialog open={isCertificationModalOpen} onOpenChange={setIsCertificationModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle className="font-headline">{editingCertification ? 'Edit Certification' : 'Add New Certification'}</DialogTitle><DialogDescription>Detail your certifications.</DialogDescription></DialogHeader>
          <Form {...certificationForm}>
            <form onSubmit={certificationForm.handleSubmit(onCertificationSubmit)} className="space-y-6 py-4">
              <CertificationFormFields control={certificationForm.control} />
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit" disabled={certificationForm.formState.isSubmitting}><Save className="mr-2 h-4 w-4"/>{certificationForm.formState.isSubmitting ? <Loader2 className="animate-spin"/> : (editingCertification ? 'Save Changes' : 'Add Certification')}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

    </div>
    </TooltipProvider>
  );
}
