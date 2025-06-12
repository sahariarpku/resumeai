
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
import { PlusCircle, Edit3, Trash2, Save, UserCircle, Briefcase, FolderKanban, GraduationCap, Wrench, Award, Loader2, Sparkles } from "lucide-react";
import type { UserProfile, WorkExperience, Project, Education, Skill, Certification } from "@/lib/types";
import { 
    userProfileSchema, UserProfileFormData,
    workExperienceSchema, WorkExperienceFormData,
    projectSchema, ProjectFormData,
    educationSchema, EducationFormData,
    skillSchema, SkillFormData,
    certificationSchema, CertificationFormData
} from "@/lib/schemas";
import { FormSection, FormSectionList } from '@/components/forms/form-section';
import { WorkExperienceFormFields } from '@/components/forms/work-experience-form-fields';
import { ProjectFormFields } from '@/components/forms/project-form-fields';
import { EducationFormFields } from '@/components/forms/education-form-fields';
import { SkillFormFields } from '@/components/forms/skill-form-fields';
import { CertificationFormFields } from '@/components/forms/certification-form-fields';
import { polishText } from '@/ai/flows/polish-text-flow';
import { TooltipProvider } from '@/components/ui/tooltip';

const USER_PROFILE_STORAGE_KEY = "userProfile";

const fallbackInitialProfileData: UserProfile = {
  id: "user123",
  fullName: "Jane Doe",
  email: "jane.doe@example.com",
  address: "123 Main St, Anytown, USA",
  summary: "A passionate software engineer with 5 years of experience.",
  workExperiences: [],
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
  
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [isEducationModalOpen, setIsEducationModalOpen] = useState(false);
  const [editingEducation, setEditingEducation] = useState<Education | null>(null);

  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);

  const [isCertificationModalOpen, setIsCertificationModalOpen] = useState(false);
  const [editingCertification, setEditingCertification] = useState<Certification | null>(null);
  
  const [polishingField, setPolishingField] = useState<string | null>(null);


  const generalInfoForm = useForm<UserProfileFormData>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: fallbackInitialProfileData,
  });

  const workExperienceForm = useForm<WorkExperienceFormData>({ resolver: zodResolver(workExperienceSchema), defaultValues: {} });
  const projectForm = useForm<ProjectFormData>({ resolver: zodResolver(projectSchema), defaultValues: {} });
  const educationForm = useForm<EducationFormData>({ resolver: zodResolver(educationSchema), defaultValues: {} });
  const skillForm = useForm<SkillFormData>({ resolver: zodResolver(skillSchema), defaultValues: {} });
  const certificationForm = useForm<CertificationFormData>({ resolver: zodResolver(certificationSchema), defaultValues: {} });


  useEffect(() => {
    try {
      const storedProfileString = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
      if (storedProfileString) {
        const storedProfile = JSON.parse(storedProfileString) as UserProfile;
        setProfileData(storedProfile);
        generalInfoForm.reset({
            fullName: storedProfile.fullName || "",
            email: storedProfile.email || "user@example.com",
            phone: storedProfile.phone || "",
            address: storedProfile.address || "",
            linkedin: storedProfile.linkedin || "",
            github: storedProfile.github || "",
            portfolio: storedProfile.portfolio || "",
            summary: storedProfile.summary || "",
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

  // Generic AI Polish Handler
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
  const handleAddWorkExperience = () => { setEditingWorkExperience(null); workExperienceForm.reset({ achievements: '' }); setIsWorkExperienceModalOpen(true); };
  const handleEditWorkExperience = (experience: WorkExperience) => { setEditingWorkExperience(experience); workExperienceForm.reset({ ...experience, achievements: experience.achievements?.join(', ') || '' }); setIsWorkExperienceModalOpen(true); };
  const handleDeleteWorkExperience = (id: string) => { saveProfile({ ...profileData, workExperiences: profileData.workExperiences.filter(exp => exp.id !== id) }); toast({ title: "Work Experience Removed", variant: "destructive" }); };
  const onWorkExperienceSubmit = (data: WorkExperienceFormData) => {
    const achievementsArray = data.achievements?.split(',').map(s => s.trim()).filter(Boolean);
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
  const handleEditProject = (project: Project) => { setEditingProject(project); projectForm.reset({ ...project, technologies: project.technologies?.join(', ') || '', achievements: project.achievements?.join(', ') || '' }); setIsProjectModalOpen(true); };
  const handleDeleteProject = (id: string) => { saveProfile({ ...profileData, projects: profileData.projects.filter(p => p.id !== id) }); toast({ title: "Project Removed", variant: "destructive" }); };
  const onProjectSubmit = (data: ProjectFormData) => {
    const techArray = data.technologies?.split(',').map(s => s.trim()).filter(Boolean);
    const achievementsArray = data.achievements?.split(',').map(s => s.trim()).filter(Boolean);
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
  const handleAddEducation = () => { setEditingEducation(null); educationForm.reset({}); setIsEducationModalOpen(true); };
  const handleEditEducation = (edu: Education) => { setEditingEducation(edu); educationForm.reset(edu); setIsEducationModalOpen(true); };
  const handleDeleteEducation = (id: string) => { saveProfile({ ...profileData, education: profileData.education.filter(e => e.id !== id) }); toast({ title: "Education Entry Removed", variant: "destructive" }); };
  const onEducationSubmit = (data: EducationFormData) => {
    let updatedEducation;
    if (editingEducation) {
      updatedEducation = profileData.education.map(e => e.id === editingEducation.id ? { ...e, ...data, id: e.id } : e);
      toast({ title: "Education Updated" });
    } else {
      updatedEducation = [...profileData.education, { ...data, id: `edu-${Date.now()}` }];
      toast({ title: "Education Added" });
    }
    saveProfile({ ...profileData, education: updatedEducation });
    setIsEducationModalOpen(false); setEditingEducation(null);
  };

  // --- Skills ---
  const handleAddSkill = () => { setEditingSkill(null); skillForm.reset({}); setIsSkillModalOpen(true); };
  const handleEditSkill = (skill: Skill) => { setEditingSkill(skill); skillForm.reset(skill); setIsSkillModalOpen(true); };
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
  const handleAddCertification = () => { setEditingCertification(null); certificationForm.reset({}); setIsCertificationModalOpen(true); };
  const handleEditCertification = (cert: Certification) => { setEditingCertification(cert); certificationForm.reset(cert); setIsCertificationModalOpen(true); };
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

      <Accordion type="multiple" defaultValue={['general-info', 'work-experience']} className="w-full space-y-4">
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

        {/* Work Experience Section */}
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
        
        {/* Projects Section */}
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

        {/* Education Section */}
        <AccordionItem value="education" id="education" className="border-none">
            <FormSection
              title="Education"
              description="List your academic qualifications."
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

        {/* Skills Section */}
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

        {/* Certifications Section */}
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
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle className="font-headline">{editingEducation ? 'Edit Education' : 'Add New Education'}</DialogTitle><DialogDescription>Provide your educational qualifications.</DialogDescription></DialogHeader>
          <Form {...educationForm}>
            <form onSubmit={educationForm.handleSubmit(onEducationSubmit)} className="space-y-6 py-4">
              <EducationFormFields control={educationForm.control} />
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit" disabled={educationForm.formState.isSubmitting}><Save className="mr-2 h-4 w-4"/>{educationForm.formState.isSubmitting ? <Loader2 className="animate-spin"/> : (editingEducation ? 'Save Changes' : 'Add Education')}</Button>
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
