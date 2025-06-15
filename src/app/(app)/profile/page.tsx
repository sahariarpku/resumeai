
"use client";

import React, { useState, useEffect, useRef } from 'react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { PlusCircle, Edit3, Trash2, Save, Loader2, Sparkles, UploadCloud, DownloadCloud, Printer, FileText, ListRestart } from "lucide-react";
import type { UserProfile, WorkExperience, Project, Education, Skill, Certification, HonorAward, Publication, Reference, CustomSection, ProfileSectionKey } from "@/lib/types";
import { DEFAULT_SECTION_ORDER } from "@/lib/types";
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
import { extractProfileFromCv, type ExtractProfileFromCvOutput } from '@/ai/flows/extract-profile-from-cv-flow';
import { profileToResumeText, profileToResumeHtml } from '@/lib/profile-utils';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, enableNetwork, Timestamp } from "firebase/firestore";
import { CvCustomizationModal } from '@/components/cv-customization-modal';


const fallbackInitialProfileData: UserProfile = {
  id: "", 
  fullName: "",
  email: "", 
  phone: "",
  address: "",
  linkedin: "",
  github: "",
  portfolio: "",
  summary: "",
  workExperiences: [],
  projects: [],
  education: [],
  skills: [],
  certifications: [],
  honorsAndAwards: [],
  publications: [],
  references: [],
  customSections: [],
  sectionOrder: [...DEFAULT_SECTION_ORDER],
};


export default function ProfilePage() {
  const { toast } = useToast();
  const { currentUser } = useAuth(); 
  const [profileData, setProfileData] = useState<UserProfile>(fallbackInitialProfileData);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

  const [isImportCvModalOpen, setIsImportCvModalOpen] = useState(false);
  const [cvFileContent, setCvFileContent] = useState<string | null>(null);
  const [isImportingCv, setIsImportingCv] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isCvCustomizationModalOpen, setIsCvCustomizationModalOpen] = useState(false);


  const generalInfoForm = useForm<UserProfileFormData>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: { 
      fullName: "", email: "", phone: "", address: "", 
      linkedin: "", github: "", portfolio: "", summary: "" 
    }, 
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
    const loadProfile = async () => {
      if (currentUser) {
        try {
          await enableNetwork(db); 
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          let loadedProfile: UserProfile;

          if (userDocSnap.exists()) {
            const dbData = userDocSnap.data() as UserProfile;
             let effectiveSectionOrder: ProfileSectionKey[];
            if (dbData.sectionOrder && Array.isArray(dbData.sectionOrder) && dbData.sectionOrder.length > 0) {
              const validStoredKeys = dbData.sectionOrder.filter(key => DEFAULT_SECTION_ORDER.includes(key as ProfileSectionKey));
              const missingDefaultKeys = DEFAULT_SECTION_ORDER.filter(key => !validStoredKeys.includes(key));
              effectiveSectionOrder = [...validStoredKeys, ...missingDefaultKeys];
            } else {
              effectiveSectionOrder = [...DEFAULT_SECTION_ORDER];
            }

            loadedProfile = {
              ...fallbackInitialProfileData,
              ...dbData,
              id: currentUser.uid,
              email: currentUser.email || dbData.email || "",
              fullName: dbData.fullName || currentUser.displayName || "",
              sectionOrder: effectiveSectionOrder,
            };
          } else {
            loadedProfile = {
              ...fallbackInitialProfileData,
              id: currentUser.uid,
              email: currentUser.email || "",
              fullName: currentUser.displayName || "",
              sectionOrder: [...DEFAULT_SECTION_ORDER],
              createdAt: serverTimestamp() as Timestamp, 
            };
          }
          setProfileData(loadedProfile);
          generalInfoForm.reset({
            fullName: loadedProfile.fullName || "",
            email: loadedProfile.email || "", // This will be disabled in the form anyway
            phone: loadedProfile.phone || "",
            address: loadedProfile.address || "",
            linkedin: loadedProfile.linkedin || "",
            github: loadedProfile.github || "",
            portfolio: loadedProfile.portfolio || "",
            summary: loadedProfile.summary || "",
          });
        } catch (error) {
          console.error("Failed to load profile from Firestore:", error);
          let description = "Could not load your profile. Starting fresh.";
          if (error instanceof Error && error.message.toLowerCase().includes("offline")) {
            description = "Failed to load profile: You appear to be offline. Please check your internet connection.";
          } else if (error instanceof Error && error.message.toLowerCase().includes("firestore_unavailable")) {
            description = "Firestore is currently unavailable. Profile cannot be loaded. Please check your Firebase setup and internet connection.";
          } else if (error instanceof Error) {
            description = `Could not load your profile: ${error.message}. Starting fresh.`;
          }
          toast({ title: "Profile Load Error", description, variant: "destructive" });
          const freshProfile = {
            ...fallbackInitialProfileData,
            id: currentUser.uid,
            email: currentUser.email || "",
            fullName: currentUser.displayName || "",
            sectionOrder: [...DEFAULT_SECTION_ORDER]
          };
          setProfileData(freshProfile);
          generalInfoForm.reset({ fullName: currentUser.displayName || "", email: currentUser.email || "", phone: "", address: "", linkedin: "", github: "", portfolio: "", summary: "" });
        }
      } else {
        setProfileData(fallbackInitialProfileData);
        generalInfoForm.reset({ fullName: "", email: "", phone: "", address: "", linkedin: "", github: "", portfolio: "", summary: ""});
      }
      setIsProfileLoaded(true);
    };

    loadProfile();
  }, [currentUser, toast, generalInfoForm]);


  const saveProfile = async (updatedProfile: UserProfile) => {
    if (!currentUser) {
      toast({ title: "Not Authenticated", description: "You must be signed in to save your profile.", variant: "destructive" });
      return;
    }
    setIsSaving(true);

    // Create a clean object for saving, removing any undefined top-level properties
    const profileToSaveCleaned: Partial<UserProfile> = {};
    Object.keys(updatedProfile).forEach(keyStr => {
      const key = keyStr as keyof UserProfile;
      if (updatedProfile[key] !== undefined) {
        (profileToSaveCleaned as any)[key] = updatedProfile[key];
      }
    });
    
    const profileToSave: UserProfile = {
      ...(profileToSaveCleaned as UserProfile), // Cast back after cleaning
      id: currentUser.uid, 
      email: currentUser.email || updatedProfile.email, // Email is primarily from auth, but keep a copy
      updatedAt: serverTimestamp() as Timestamp, 
    };

    if (!profileToSave.createdAt) { 
        profileToSave.createdAt = serverTimestamp() as Timestamp;
    }


    try {
      await enableNetwork(db); 
      const userDocRef = doc(db, "users", currentUser.uid);
      await setDoc(userDocRef, profileToSave, { merge: true }); 
      
      // After successful save, update local state with potentially server-generated timestamps
      // This requires fetching the doc again or being careful with local state if timestamps are critical for immediate UI.
      // For now, we'll just update with the data we sent, assuming timestamps are handled.
      setProfileData(prev => ({...prev, ...profileToSave})); 

      toast({ title: "Profile Saved!", description: "Your profile has been saved to the cloud." });
    } catch (error) {
      console.error("Failed to save profile to Firestore:", error);
      let description = "Could not save profile.";
      if (error instanceof Error && error.message.toLowerCase().includes("offline")) {
        description = "Failed to save profile: You appear to be offline. Changes might be saved locally if offline persistence is enabled and will sync when online.";
      } else if (error instanceof Error && error.message.toLowerCase().includes("firestore_unavailable")) {
         description = "Firestore is currently unavailable. Profile could not be saved. Please check your Firebase setup and internet connection.";
      } else if (error instanceof Error) {
        description = `Could not save profile: ${error.message}.`;
      }
      toast({ title: "Save Error", description, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const onGeneralInfoSubmit = (data: UserProfileFormData) => {
    const currentProfileState = profileData;
    const updatedGeneralInfo = {
      fullName: data.fullName || currentProfileState.fullName,
      // email is primarily from auth, but we can keep it in sync if provided
      email: currentUser?.email || data.email || currentProfileState.email, 
      phone: data.phone || "", // Ensure empty strings if optional and not provided
      address: data.address || "",
      linkedin: data.linkedin || "",
      github: data.github || "",
      portfolio: data.portfolio || "",
      summary: data.summary || "",
    };
    const updatedProfile = { ...currentProfileState, ...updatedGeneralInfo };
    saveProfile(updatedProfile);
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
      let description = `Could not polish ${fieldName}.`;
      if (err instanceof Error && err.message.toLowerCase().includes("offline")) {
        description = `Could not polish ${fieldName}: You appear to be offline. Please check your internet connection.`;
      } else if (err instanceof Error) {
        description = `Could not polish ${fieldName}: ${err.message}.`;
      }
      toast({ title: "AI Polish Error", description, variant: "destructive" });
    } finally {
      setPolishingField(null);
    }
  };

  const handleAddOrUpdateSectionItem = (sectionKey: ProfileSectionKey, itemData: any, isEditing: boolean, itemId?: string) => {
    let updatedItems;
    const currentItems = (profileData[sectionKey] as any[] || []);
    if (isEditing && itemId) {
      updatedItems = currentItems.map(item => item.id === itemId ? { ...item, ...itemData } : item);
    } else {
      updatedItems = [...currentItems, { ...itemData, id: `${sectionKey.slice(0,2)}-${Date.now()}` }];
    }
    const updatedProfile = { ...profileData, [sectionKey]: updatedItems };
    saveProfile(updatedProfile); // This will also call setProfileData internally after successful save
  };

  const handleDeleteSectionItem = (sectionKey: ProfileSectionKey, itemId: string) => {
    const currentItems = (profileData[sectionKey] as any[] || []);
    const updatedItems = currentItems.filter(item => item.id !== itemId);
    const updatedProfile = { ...profileData, [sectionKey]: updatedItems };
    saveProfile(updatedProfile); // This will also call setProfileData internally
  };

  const handleAddWorkExperience = () => { setEditingWorkExperience(null); workExperienceForm.reset({ company: '', role: '', startDate: '', endDate: '', description: '', achievements: '' }); setIsWorkExperienceModalOpen(true); };
  const handleEditWorkExperience = (experience: WorkExperience) => { setEditingWorkExperience(experience); workExperienceForm.reset({ ...experience, company: experience.company || '', role: experience.role || '', startDate: experience.startDate || '', endDate: experience.endDate || '', description: experience.description || '', achievements: experience.achievements?.join('\\n') || '' }); setIsWorkExperienceModalOpen(true); };
  const handleDeleteWorkExperience = (id: string) => { handleDeleteSectionItem('workExperiences', id); toast({ title: "Work Experience Removed", variant: "destructive" }); };
  const onWorkExperienceSubmit = (data: WorkExperienceFormData) => {
    const achievementsArray = data.achievements?.split('\\n').map(s => s.trim()).filter(Boolean);
    handleAddOrUpdateSectionItem('workExperiences', { ...data, achievements: achievementsArray }, !!editingWorkExperience, editingWorkExperience?.id);
    toast({ title: editingWorkExperience ? "Work Experience Updated" : "Work Experience Added" });
    setIsWorkExperienceModalOpen(false); setEditingWorkExperience(null);
  };

  const handleAddProject = () => { setEditingProject(null); projectForm.reset({ name: '', description: '', technologies: '', achievements: '', link: '' }); setIsProjectModalOpen(true); };
  const handleEditProject = (project: Project) => { setEditingProject(project); projectForm.reset({ ...project, name: project.name || '', description: project.description || '', technologies: project.technologies?.join(', ') || '', achievements: project.achievements?.join('\\n') || '', link: project.link || '' }); setIsProjectModalOpen(true); };
  const handleDeleteProject = (id: string) => { handleDeleteSectionItem('projects', id); toast({ title: "Project Removed", variant: "destructive" }); };
  const onProjectSubmit = (data: ProjectFormData) => {
    const techArray = data.technologies?.split(',').map(s => s.trim()).filter(Boolean);
    const achievementsArray = data.achievements?.split('\\n').map(s => s.trim()).filter(Boolean);
    handleAddOrUpdateSectionItem('projects', { ...data, technologies: techArray, achievements: achievementsArray }, !!editingProject, editingProject?.id);
    toast({ title: editingProject ? "Project Updated" : "Project Added" });
    setIsProjectModalOpen(false); setEditingProject(null);
  };
  
  const handleAddEducation = () => { setEditingEducation(null); educationForm.reset({ institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', gpa: '', thesisTitle: '', relevantCourses: '', description: '' }); setIsEducationModalOpen(true); };
  const handleEditEducation = (edu: Education) => { setEditingEducation(edu); educationForm.reset({...edu, institution: edu.institution || '', degree: edu.degree || '', fieldOfStudy: edu.fieldOfStudy || '', startDate: edu.startDate || '', endDate: edu.endDate || '', gpa: edu.gpa || '', thesisTitle: edu.thesisTitle || '', relevantCourses: edu.relevantCourses?.join(', ') || '', description: edu.description || '' }); setIsEducationModalOpen(true); };
  const handleDeleteEducation = (id: string) => { handleDeleteSectionItem('education', id); toast({ title: "Education Entry Removed", variant: "destructive" }); };
  const onEducationSubmit = (data: EducationFormData) => {
    const coursesArray = data.relevantCourses?.split(',').map(s => s.trim()).filter(Boolean);
    handleAddOrUpdateSectionItem('education', { ...data, relevantCourses: coursesArray }, !!editingEducation, editingEducation?.id);
    toast({ title: editingEducation ? "Education Updated" : "Education Added" });
    setIsEducationModalOpen(false); setEditingEducation(null);
  };

  const handleAddSkill = () => { setEditingSkill(null); skillForm.reset({ name: '', category: '', proficiency: undefined }); setIsSkillModalOpen(true); };
  const handleEditSkill = (skill: Skill) => { setEditingSkill(skill); skillForm.reset({ ...skill, name: skill.name || '', category: skill.category || '', proficiency: skill.proficiency || undefined }); setIsSkillModalOpen(true); };
  const handleDeleteSkill = (id: string) => { handleDeleteSectionItem('skills', id); toast({ title: "Skill Removed", variant: "destructive" }); };
  const onSkillSubmit = (data: SkillFormData) => {
    handleAddOrUpdateSectionItem('skills', data, !!editingSkill, editingSkill?.id);
    toast({ title: editingSkill ? "Skill Updated" : "Skill Added" });
    setIsSkillModalOpen(false); setEditingSkill(null);
  };

  const handleAddCertification = () => { setEditingCertification(null); certificationForm.reset({ name: '', issuingOrganization: '', issueDate: '', credentialId: '', credentialUrl: '' }); setIsCertificationModalOpen(true); };
  const handleEditCertification = (cert: Certification) => { setEditingCertification(cert); certificationForm.reset({ ...cert, name: cert.name || '', issuingOrganization: cert.issuingOrganization || '', issueDate: cert.issueDate || '', credentialId: cert.credentialId || '', credentialUrl: cert.credentialUrl || ''}); setIsCertificationModalOpen(true); };
  const handleDeleteCertification = (id: string) => { handleDeleteSectionItem('certifications', id); toast({ title: "Certification Removed", variant: "destructive" }); };
  const onCertificationSubmit = (data: CertificationFormData) => {
    handleAddOrUpdateSectionItem('certifications', data, !!editingCertification, editingCertification?.id);
    toast({ title: editingCertification ? "Certification Updated" : "Certification Added" });
    setIsCertificationModalOpen(false); setEditingCertification(null);
  };
  
  const handleAddHonorAward = () => { setEditingHonorAward(null); honorAwardForm.reset({ name: '', organization: '', date: '', description: '' }); setIsHonorAwardModalOpen(true); };
  const handleEditHonorAward = (item: HonorAward) => { setEditingHonorAward(item); honorAwardForm.reset({ ...item, name: item.name || '', organization: item.organization || '', date: item.date || '', description: item.description || '' }); setIsHonorAwardModalOpen(true); };
  const handleDeleteHonorAward = (id: string) => { handleDeleteSectionItem('honorsAndAwards', id); toast({ title: "Honor/Award Removed", variant: "destructive" }); };
  const onHonorAwardSubmit = (data: HonorAwardFormData) => {
    handleAddOrUpdateSectionItem('honorsAndAwards', data, !!editingHonorAward, editingHonorAward?.id);
    toast({ title: editingHonorAward ? "Honor/Award Updated" : "Honor/Award Added" });
    setIsHonorAwardModalOpen(false); setEditingHonorAward(null);
  };

  const handleAddPublication = () => { setEditingPublication(null); publicationForm.reset({ title: '', authors: '', journalOrConference: '', publicationDate: '', link: '', doi: '', description: '' }); setIsPublicationModalOpen(true); };
  const handleEditPublication = (item: Publication) => { setEditingPublication(item); publicationForm.reset({ ...item, title: item.title || '', authors: item.authors?.join(', ') || '', journalOrConference: item.journalOrConference || '', publicationDate: item.publicationDate || '', link: item.link || '', doi: item.doi || '', description: item.description || '' }); setIsPublicationModalOpen(true); };
  const handleDeletePublication = (id: string) => { handleDeleteSectionItem('publications', id); toast({ title: "Publication Removed", variant: "destructive" }); };
  const onPublicationSubmit = (data: PublicationFormData) => {
    const authorsArray = data.authors?.split(',').map(s => s.trim()).filter(Boolean);
    handleAddOrUpdateSectionItem('publications', { ...data, authors: authorsArray }, !!editingPublication, editingPublication?.id);
    toast({ title: editingPublication ? "Publication Updated" : "Publication Added" });
    setIsPublicationModalOpen(false); setEditingPublication(null);
  };

  const handleAddReference = () => { setEditingReference(null); referenceForm.reset({ name: '', titleAndCompany: '', contactDetailsOrNote: '' }); setIsReferenceModalOpen(true); };
  const handleEditReference = (item: Reference) => { setEditingReference(item); referenceForm.reset({ ...item, name: item.name || '', titleAndCompany: item.titleAndCompany || '', contactDetailsOrNote: item.contactDetailsOrNote || '' }); setIsReferenceModalOpen(true); };
  const handleDeleteReference = (id: string) => { handleDeleteSectionItem('references', id); toast({ title: "Reference Removed", variant: "destructive" }); };
  const onReferenceSubmit = (data: ReferenceFormData) => {
    handleAddOrUpdateSectionItem('references', data, !!editingReference, editingReference?.id);
    toast({ title: editingReference ? "Reference Updated" : "Reference Added" });
    setIsReferenceModalOpen(false); setEditingReference(null);
  };

  const handleAddCustomSection = () => { setEditingCustomSection(null); customSectionForm.reset({ heading: '', content: '' }); setIsCustomSectionModalOpen(true); };
  const handleEditCustomSection = (item: CustomSection) => { setEditingCustomSection(item); customSectionForm.reset({ ...item, heading: item.heading || '', content: item.content || ''}); setIsCustomSectionModalOpen(true); };
  const handleDeleteCustomSection = (id: string) => { handleDeleteSectionItem('customSections', id); toast({ title: "Custom Section Removed", variant: "destructive" }); };
  const onCustomSectionSubmit = (data: CustomSectionFormData) => {
    handleAddOrUpdateSectionItem('customSections', data, !!editingCustomSection, editingCustomSection?.id);
    toast({ title: editingCustomSection ? "Custom Section Updated" : "Custom Section Added" });
    setIsCustomSectionModalOpen(false); setEditingCustomSection(null);
  };

  const handleDownloadMd = () => {
    if (!currentUser) { toast({ title: "Not Authenticated", variant: "destructive" }); return; }
    const resumeMd = profileToResumeText(profileData);
    const blob = new Blob([resumeMd], { type: 'text/markdown;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${(profileData.fullName || currentUser.displayName || 'resume').replace(/\s+/g, '_')}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    toast({ title: "Markdown Download Started" });
  };

  const handleDownloadDocx = () => {
    if (!currentUser) { toast({ title: "Not Authenticated", variant: "destructive" }); return; }
    const resumeHtml = profileToResumeHtml(profileData);
    const blob = new Blob([resumeHtml], { type: 'application/msword;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${(profileData.fullName || currentUser.displayName || 'resume').replace(/\s+/g, '_')}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    toast({ title: "Word (.docx) Download Started" });
  };
  
  const handlePrintToPdf = () => {
    if (!currentUser) { toast({ title: "Not Authenticated", variant: "destructive" }); return; }
    const resumeHtml = profileToResumeHtml(profileData);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(resumeHtml);
      printWindow.document.close(); 
      printWindow.focus(); 
      setTimeout(() => {
        printWindow.print();
      }, 500); 
      toast({ title: "Preparing PDF for Print" });
    } else {
      toast({ title: "Print Error", description: "Could not open print window. Check pop-up blocker.", variant: "destructive" });
    }
  };
  
  const formatSectionTitleLocal = (key: ProfileSectionKey): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };
  
  const handleMoveSection = (sectionKey: ProfileSectionKey, direction: 'up' | 'down') => {
    const currentActiveOrder = (profileData.sectionOrder && profileData.sectionOrder.length > 0) ? [...profileData.sectionOrder] : [...DEFAULT_SECTION_ORDER];
    const currentIndex = currentActiveOrder.indexOf(sectionKey);
  
    if (currentIndex === -1) return; 
  
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  
    if (newIndex < 0 || newIndex >= currentActiveOrder.length) return; 
  
    const itemToMove = currentActiveOrder.splice(currentIndex, 1)[0];
    currentActiveOrder.splice(newIndex, 0, itemToMove);
  
    saveProfile({ ...profileData, sectionOrder: currentActiveOrder });
    toast({ title: "Section Order Updated", description: `${formatSectionTitleLocal(sectionKey)} moved ${direction}.` });
  };

  const handleCvFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === "text/plain" || file.type === "text/markdown" || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setCvFileContent(e.target?.result as string);
        };
        reader.readAsText(file);
      } else {
        toast({ title: "Invalid File Type", description: "Please upload a .txt or .md file.", variant: "destructive" });
        if(fileInputRef.current) fileInputRef.current.value = "";
        setCvFileContent(null);
      }
    }
  };

  const handleProcessCvImport = async () => {
    if (!cvFileContent) {
      toast({ title: "No CV Content", description: "Please select a CV file first.", variant: "default" });
      return;
    }
    if (!currentUser) {
      toast({ title: "Not Authenticated", description: "Please sign in to import a CV.", variant: "destructive" });
      return;
    }
    setIsImportingCv(true);
    try {
      const extractedData = await extractProfileFromCv({ cvText: cvFileContent });
      
      if (window.confirm("AI has extracted data from your CV. Do you want to apply this to your profile? This may overwrite current form data for matching sections.")) {
        applyExtractedDataToProfile(extractedData);
        toast({ title: "CV Data Ready!", description: "Profile forms populated. Review and save general info or individual sections to persist changes."});
        setIsImportCvModalOpen(false); 
      } else {
        toast({ title: "Import Cancelled", description: "CV data was not applied to your profile.", variant: "default"});
      }

    } catch (err) {
      console.error("Error importing CV data:", err);
      let description = `Could not process CV: ${err instanceof Error ? err.message : 'Unknown error'}.`;
      if (err instanceof Error && err.message.toLowerCase().includes("offline")) {
        description = "Failed to process CV: You appear to be offline. Please check your internet connection.";
      } else if (err instanceof Error) {
        description = `Could not process CV: ${err.message}.`;
      }
      toast({ title: "CV Import Error", description, variant: "destructive" });
    } finally {
      setIsImportingCv(false);
      setCvFileContent(null); 
      if(fileInputRef.current) fileInputRef.current.value = ""; 
    }
  };

  const applyExtractedDataToProfile = (data: ExtractProfileFromCvOutput) => {
    if (!currentUser) return; 

    let updatedProfile = { ...profileData };

    updatedProfile.id = currentUser.uid;
    if (currentUser.email) updatedProfile.email = currentUser.email;
    else if (data.email) updatedProfile.email = data.email;


    if (data.fullName) updatedProfile.fullName = data.fullName;
    if (data.phone) updatedProfile.phone = data.phone;
    if (data.address) updatedProfile.address = data.address;
    if (data.linkedin) updatedProfile.linkedin = data.linkedin;
    if (data.github) updatedProfile.github = data.github;
    if (data.portfolio) updatedProfile.portfolio = data.portfolio;
    if (data.summary) updatedProfile.summary = data.summary;
    
    generalInfoForm.reset({
      fullName: updatedProfile.fullName || "",
      email: updatedProfile.email || "",
      phone: updatedProfile.phone || "",
      address: updatedProfile.address || "",
      linkedin: updatedProfile.linkedin || "",
      github: updatedProfile.github || "",
      portfolio: updatedProfile.portfolio || "",
      summary: updatedProfile.summary || "",
    });

    if (data.workExperiences) {
      updatedProfile.workExperiences = data.workExperiences.map((exp, index) => ({
        id: `imp-we-${Date.now()}-${index}`, company: exp.company || "", role: exp.role || "",
        startDate: exp.startDate || "", endDate: exp.endDate || "", description: exp.description || "",
        achievements: exp.achievements || [],
      }));
    } else { updatedProfile.workExperiences = []; }

    if (data.education) {
      updatedProfile.education = data.education.map((edu, index) => ({
        id: `imp-edu-${Date.now()}-${index}`, institution: edu.institution || "", degree: edu.degree || "",
        fieldOfStudy: edu.fieldOfStudy || "", startDate: edu.startDate || "", endDate: edu.endDate || "",
        gpa: edu.gpa || "", description: edu.description || "", thesisTitle: undefined, relevantCourses: undefined,
      }));
    } else { updatedProfile.education = []; }

    if (data.projects) {
      updatedProfile.projects = data.projects.map((proj, index) => ({
        id: `imp-proj-${Date.now()}-${index}`, name: proj.name || "", description: proj.description || "",
        technologies: proj.technologies || [], achievements: proj.achievements || [], link: proj.link || "",
      }));
    } else { updatedProfile.projects = []; }

    if (data.skills) {
      updatedProfile.skills = data.skills.map((skill, index) => ({
        id: `imp-skill-${Date.now()}-${index}`, name: skill.name || "", category: skill.category || "",
        proficiency: skill.proficiency as Skill['proficiency'] || undefined,
      }));
    } else { updatedProfile.skills = []; }

    if (data.certifications) {
      updatedProfile.certifications = data.certifications.map((cert, index) => ({
        id: `imp-cert-${Date.now()}-${index}`, name: cert.name || "", issuingOrganization: cert.issuingOrganization || "",
        issueDate: cert.issueDate || "", credentialId: cert.credentialId || "", credentialUrl: cert.credentialUrl || "",
      }));
    } else { updatedProfile.certifications = []; }

    if (data.honorsAndAwards) {
      updatedProfile.honorsAndAwards = data.honorsAndAwards.map((item, index) => ({
        id: `imp-ha-${Date.now()}-${index}`, name: item.name || "", organization: item.organization || "",
        date: item.date || "", description: item.description || "",
      }));
    } else { updatedProfile.honorsAndAwards = []; }

    if (data.publications) {
      updatedProfile.publications = data.publications.map((item, index) => ({
        id: `imp-pub-${Date.now()}-${index}`, title: item.title || "", authors: item.authors || [],
        journalOrConference: item.journalOrConference || "", publicationDate: item.publicationDate || "",
        link: item.link || "", doi: item.doi || "", description: item.description || "",
      }));
    } else { updatedProfile.publications = []; }

    if (data.references) {
      updatedProfile.references = data.references.map((item, index) => ({
        id: `imp-ref-${Date.now()}-${index}`, name: item.name || "", titleAndCompany: item.titleAndCompany || "",
        contactDetailsOrNote: item.contactDetailsOrNote || "",
      }));
    } else { updatedProfile.references = []; }

    if (data.customSections) {
      updatedProfile.customSections = data.customSections.map((item, index) => ({
        id: `imp-cs-${Date.now()}-${index}`, heading: item.heading || "", content: item.content || "",
      }));
    } else { updatedProfile.customSections = []; }
    
    // Update the main profileData state. This will trigger a re-render.
    // The user still needs to click "Save General Info" or save individual sections if those dialogs were opened.
    setProfileData(updatedProfile); 
  };

  const handleSectionOrderUpdate = (newOrder: ProfileSectionKey[]) => {
    const updatedProfile = { ...profileData, sectionOrder: newOrder };
    saveProfile(updatedProfile); 
  };


  if (!isProfileLoaded || !currentUser) { 
    return (
      <div className="container mx-auto py-8 text-center flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" /> 
        <span className="ml-2">Loading profile data...</span>
      </div>
    );
  }

  const currentDisplayOrder = (profileData.sectionOrder && profileData.sectionOrder.length > 0) 
                              ? profileData.sectionOrder 
                              : DEFAULT_SECTION_ORDER;

  const renderSection = (sectionKey: ProfileSectionKey, index: number) => {
    const sectionTitle = formatSectionTitleLocal(sectionKey);
    const canMoveUp = index > 0;
    const canMoveDown = index < currentDisplayOrder.length - 1;

    switch (sectionKey) {
      case 'workExperiences':
        return (
          <AccordionItem value={sectionKey} key={sectionKey} className="border-none">
            <FormSection
              id="work-experience" title={sectionTitle} description="Detail your professional roles and accomplishments."
              actions={<Button onClick={handleAddWorkExperience}><PlusCircle className="mr-2 h-4 w-4" /> Add Work Experience</Button>}
              isReorderable={true} onMoveUp={() => handleMoveSection(sectionKey, 'up')} onMoveDown={() => handleMoveSection(sectionKey, 'down')}
              canMoveUp={canMoveUp} canMoveDown={canMoveDown} >
              <FormSectionList items={profileData.workExperiences || []}
                renderItem={(exp) => (
                  <div key={exp.id} className="flex justify-between items-center py-2">
                    <div><h4 className="font-semibold">{exp.role} at {exp.company}</h4><p className="text-sm text-muted-foreground">{exp.startDate} - {exp.endDate || 'Present'}</p></div>
                    <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => handleEditWorkExperience(exp)}><Edit3 className="mr-2 h-4 w-4"/>Edit</Button><Button variant="destructive" size="sm" onClick={() => handleDeleteWorkExperience(exp.id)}><Trash2 className="mr-2 h-4 w-4"/>Delete</Button></div>
                  </div> )}
                emptyState={<p className="text-sm text-muted-foreground">No work experiences added yet.</p>} />
            </FormSection>
          </AccordionItem> );
      case 'projects':
        return (
          <AccordionItem value={sectionKey} key={sectionKey} className="border-none">
            <FormSection id="projects" title={sectionTitle} description="Showcase your personal or professional projects."
              actions={<Button onClick={handleAddProject}><PlusCircle className="mr-2 h-4 w-4" /> Add Project</Button>}
              isReorderable={true} onMoveUp={() => handleMoveSection(sectionKey, 'up')} onMoveDown={() => handleMoveSection(sectionKey, 'down')}
              canMoveUp={canMoveUp} canMoveDown={canMoveDown} >
              <FormSectionList items={profileData.projects || []}
                renderItem={(item) => (
                  <div key={item.id} className="flex justify-between items-center py-2">
                    <div><h4 className="font-semibold">{item.name}</h4><p className="text-sm text-muted-foreground truncate max-w-md">{item.description}</p></div>
                    <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => handleEditProject(item)}><Edit3 className="mr-2 h-4 w-4"/>Edit</Button><Button variant="destructive" size="sm" onClick={() => handleDeleteProject(item.id)}><Trash2 className="mr-2 h-4 w-4"/>Delete</Button></div>
                  </div> )}
                emptyState={<p className="text-sm text-muted-foreground">No projects added yet.</p>} />
            </FormSection>
          </AccordionItem> );
      case 'education':
        return (
           <AccordionItem value={sectionKey} key={sectionKey} className="border-none">
            <FormSection id="education" title={sectionTitle} description="List your educational qualifications."
              actions={<Button onClick={handleAddEducation}><PlusCircle className="mr-2 h-4 w-4" /> Add Education</Button>}
              isReorderable={true} onMoveUp={() => handleMoveSection(sectionKey, 'up')} onMoveDown={() => handleMoveSection(sectionKey, 'down')}
              canMoveUp={canMoveUp} canMoveDown={canMoveDown} >
              <FormSectionList items={profileData.education || []}
                renderItem={(item) => (
                  <div key={item.id} className="flex justify-between items-center py-2">
                    <div><h4 className="font-semibold">{item.degree} - {item.institution}</h4><p className="text-sm text-muted-foreground">{item.fieldOfStudy}</p></div>
                    <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => handleEditEducation(item)}><Edit3 className="mr-2 h-4 w-4"/>Edit</Button><Button variant="destructive" size="sm" onClick={() => handleDeleteEducation(item.id)}><Trash2 className="mr-2 h-4 w-4"/>Delete</Button></div>
                  </div> )}
                emptyState={<p className="text-sm text-muted-foreground">No education entries added yet.</p>} />
            </FormSection>
          </AccordionItem> );
      case 'skills':
          return (
            <AccordionItem value={sectionKey} key={sectionKey} className="border-none">
              <FormSection id="skills" title={sectionTitle} description="List your skills and their proficiency levels."
                actions={<Button onClick={handleAddSkill}><PlusCircle className="mr-2 h-4 w-4" /> Add Skill</Button>}
                isReorderable={true} onMoveUp={() => handleMoveSection(sectionKey, 'up')} onMoveDown={() => handleMoveSection(sectionKey, 'down')}
                canMoveUp={canMoveUp} canMoveDown={canMoveDown} >
                <FormSectionList items={profileData.skills || []}
                  renderItem={(item) => (
                    <div key={item.id} className="flex justify-between items-center py-2">
                      <div><h4 className="font-semibold">{item.name}</h4><p className="text-sm text-muted-foreground">{item.category && <span>{item.category}</span>}{item.category && item.proficiency && <span> - </span>}{item.proficiency && <span>{item.proficiency}</span>}</p></div>
                      <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => handleEditSkill(item)}><Edit3 className="mr-2 h-4 w-4"/>Edit</Button><Button variant="destructive" size="sm" onClick={() => handleDeleteSkill(item.id)}><Trash2 className="mr-2 h-4 w-4"/>Delete</Button></div>
                    </div> )}
                  emptyState={<p className="text-sm text-muted-foreground">No skills added yet.</p>} />
              </FormSection>
            </AccordionItem> );
      case 'certifications':
        return (
          <AccordionItem value={sectionKey} key={sectionKey} className="border-none">
            <FormSection id="certifications" title={sectionTitle} description="List your certifications and credentials."
              actions={<Button onClick={handleAddCertification}><PlusCircle className="mr-2 h-4 w-4" /> Add Certification</Button>}
              isReorderable={true} onMoveUp={() => handleMoveSection(sectionKey, 'up')} onMoveDown={() => handleMoveSection(sectionKey, 'down')}
              canMoveUp={canMoveUp} canMoveDown={canMoveDown} >
              <FormSectionList items={profileData.certifications || []}
                renderItem={(item) => (
                  <div key={item.id} className="flex justify-between items-center py-2">
                    <div><h4 className="font-semibold">{item.name}</h4><p className="text-sm text-muted-foreground">{item.issuingOrganization} - {item.issueDate}</p></div>
                    <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => handleEditCertification(item)}><Edit3 className="mr-2 h-4 w-4"/>Edit</Button><Button variant="destructive" size="sm" onClick={() => handleDeleteCertification(item.id)}><Trash2 className="mr-2 h-4 w-4"/>Delete</Button></div>
                  </div> )}
                emptyState={<p className="text-sm text-muted-foreground">No certifications added yet.</p>} />
            </FormSection>
          </AccordionItem> );
      case 'honorsAndAwards':
          return (
            <AccordionItem value={sectionKey} key={sectionKey} className="border-none">
              <FormSection id="honors-awards" title={sectionTitle} description="Showcase your honors and awards."
                actions={<Button onClick={handleAddHonorAward}><PlusCircle className="mr-2 h-4 w-4" /> Add Honor/Award</Button>}
                isReorderable={true} onMoveUp={() => handleMoveSection(sectionKey, 'up')} onMoveDown={() => handleMoveSection(sectionKey, 'down')}
                canMoveUp={canMoveUp} canMoveDown={canMoveDown} >
                <FormSectionList items={profileData.honorsAndAwards || []}
                  renderItem={(item) => (
                    <div key={item.id} className="flex justify-between items-center py-2">
                      <div><h4 className="font-semibold">{item.name}</h4><p className="text-sm text-muted-foreground">{item.organization && <span>{item.organization}</span>}{item.organization && item.date && <span> - </span>}{item.date && <span>{item.date}</span>}</p></div>
                      <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => handleEditHonorAward(item)}><Edit3 className="mr-2 h-4 w-4"/>Edit</Button><Button variant="destructive" size="sm" onClick={() => handleDeleteHonorAward(item.id)}><Trash2 className="mr-2 h-4 w-4"/>Delete</Button></div>
                    </div> )}
                  emptyState={<p className="text-sm text-muted-foreground">No honors or awards added yet.</p>} />
              </FormSection>
            </AccordionItem> );
      case 'publications':
        return (
          <AccordionItem value={sectionKey} key={sectionKey} className="border-none">
            <FormSection id="publications" title={sectionTitle} description="List your publications."
              actions={<Button onClick={handleAddPublication}><PlusCircle className="mr-2 h-4 w-4" /> Add Publication</Button>}
              isReorderable={true} onMoveUp={() => handleMoveSection(sectionKey, 'up')} onMoveDown={() => handleMoveSection(sectionKey, 'down')}
              canMoveUp={canMoveUp} canMoveDown={canMoveDown} >
              <FormSectionList items={profileData.publications || []}
                renderItem={(item) => (
                  <div key={item.id} className="flex justify-between items-center py-2">
                    <div><h4 className="font-semibold">{item.title}</h4><p className="text-sm text-muted-foreground">{item.journalOrConference && <span>{item.journalOrConference}</span>}{item.journalOrConference && item.publicationDate && <span> - </span>}{item.publicationDate && <span>{item.publicationDate}</span>}</p></div>
                    <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => handleEditPublication(item)}><Edit3 className="mr-2 h-4 w-4"/>Edit</Button><Button variant="destructive" size="sm" onClick={() => handleDeletePublication(item.id)}><Trash2 className="mr-2 h-4 w-4"/>Delete</Button></div>
                  </div> )}
                emptyState={<p className="text-sm text-muted-foreground">No publications added yet.</p>} />
            </FormSection>
          </AccordionItem> );
      case 'references':
        return (
          <AccordionItem value={sectionKey} key={sectionKey} className="border-none">
            <FormSection id="references" title={sectionTitle} description="Provide professional references if needed."
              actions={<Button onClick={handleAddReference}><PlusCircle className="mr-2 h-4 w-4" /> Add Reference</Button>}
              isReorderable={true} onMoveUp={() => handleMoveSection(sectionKey, 'up')} onMoveDown={() => handleMoveSection(sectionKey, 'down')}
              canMoveUp={canMoveUp} canMoveDown={canMoveDown} >
              <FormSectionList items={profileData.references || []}
                renderItem={(item) => (
                  <div key={item.id} className="flex justify-between items-center py-2">
                    <div><h4 className="font-semibold">{item.name}</h4><p className="text-sm text-muted-foreground">{item.titleAndCompany || item.contactDetailsOrNote}</p></div>
                    <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => handleEditReference(item)}><Edit3 className="mr-2 h-4 w-4"/>Edit</Button><Button variant="destructive" size="sm" onClick={() => handleDeleteReference(item.id)}><Trash2 className="mr-2 h-4 w-4"/>Delete</Button></div>
                  </div> )}
                emptyState={<p className="text-sm text-muted-foreground">No references added yet.</p>} />
            </FormSection>
          </AccordionItem> );
      case 'customSections':
        return (
          <AccordionItem value={sectionKey} key={sectionKey} className="border-none">
            <FormSection id="custom-sections" title={sectionTitle} description="Add any other relevant sections to your profile."
              actions={<Button onClick={handleAddCustomSection}><PlusCircle className="mr-2 h-4 w-4" /> Add Custom Section</Button>}
              isReorderable={true} onMoveUp={() => handleMoveSection(sectionKey, 'up')} onMoveDown={() => handleMoveSection(sectionKey, 'down')}
              canMoveUp={canMoveUp} canMoveDown={canMoveDown} >
              <FormSectionList items={profileData.customSections || []}
                renderItem={(item) => (
                  <div key={item.id} className="flex justify-between items-center py-2">
                    <div><h4 className="font-semibold">{item.heading}</h4><p className="text-sm text-muted-foreground truncate max-w-md">{item.content}</p></div>
                    <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => handleEditCustomSection(item)}><Edit3 className="mr-2 h-4 w-4"/>Edit</Button><Button variant="destructive" size="sm" onClick={() => handleDeleteCustomSection(item.id)}><Trash2 className="mr-2 h-4 w-4"/>Delete</Button></div>
                  </div> )}
                emptyState={<p className="text-sm text-muted-foreground">No custom sections added yet.</p>} />
            </FormSection>
          </AccordionItem> );
      default:
        return null;
    }
  };

  return (
    <TooltipProvider>
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
            <h1 className="font-headline text-3xl font-bold">Your Professional Profile</h1>
            <p className="text-muted-foreground">
            Complete your profile to enable AI-powered resume tailoring. Data is saved to the cloud.
            </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={() => setIsImportCvModalOpen(true)} variant="outline" size="lg" disabled={!currentUser || isSaving}>
                <UploadCloud className="mr-2 h-5 w-5" /> Import CV
            </Button>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="lg" disabled={!currentUser || isSaving}>
                        <DownloadCloud className="mr-2 h-5 w-5" /> Download / Print
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleDownloadMd}><FileText className="mr-2 h-4 w-4" /> Download as .md</DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDownloadDocx}><FileText className="mr-2 h-4 w-4" /> Download as Word (.docx)</DropdownMenuItem>
                    <DropdownMenuItem onClick={handlePrintToPdf}><Printer className="mr-2 h-4 w-4" /> Print to PDF...</DropdownMenuItem>
                     <DropdownMenuItem onSelect={() => setIsCvCustomizationModalOpen(true)}>
                        <ListRestart className="mr-2 h-4 w-4" /> Customize & Reorder CV...
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>

      <Accordion type="multiple" 
        defaultValue={['general-info', ...((profileData.sectionOrder && profileData.sectionOrder.length > 0) ? profileData.sectionOrder : DEFAULT_SECTION_ORDER).map(s => s.toLowerCase())]} 
        className="w-full space-y-4">
        <AccordionItem value="general-info" className="border-none">
            <FormSection title="General Information" description="Basic contact and summary details." isReorderable={false} >
              <Form {...generalInfoForm}>
                <form onSubmit={generalInfoForm.handleSubmit(onGeneralInfoSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={generalInfoForm.control} name="fullName" render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={generalInfoForm.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} disabled/></FormControl><FormDescription>Email is managed via your account.</FormDescription><FormMessage /></FormItem>)} />
                    <FormField control={generalInfoForm.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={generalInfoForm.control} name="address" render={({ field }) => (<FormItem><FormLabel>Address (Optional)</FormLabel><FormControl><Input placeholder="e.g. 123 Main St, Anytown, USA" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={generalInfoForm.control} name="linkedin" render={({ field }) => (<FormItem><FormLabel>LinkedIn Profile URL (Optional)</FormLabel><FormControl><Input placeholder="https://linkedin.com/in/yourprofile" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={generalInfoForm.control} name="github" render={({ field }) => (<FormItem><FormLabel>GitHub Profile URL (Optional)</FormLabel><FormControl><Input placeholder="https://github.com/yourusername" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={generalInfoForm.control} name="portfolio" render={({ field }) => (<FormItem><FormLabel>Portfolio URL (Optional)</FormLabel><FormControl><Input placeholder="https://yourportfolio.com" type="url" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <FormField control={generalInfoForm.control} name="summary"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between items-center">
                            <FormLabel>Professional Summary</FormLabel>
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleAIPolish('summary', generalInfoForm)} disabled={polishingField === 'summary' || generalInfoForm.formState.isSubmitting || isSaving}>
                                {polishingField === 'summary' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary" />}
                            </Button>
                        </div>
                        <FormControl><Textarea placeholder="A brief summary of your career..." {...field} rows={4} /></FormControl><FormMessage />
                      </FormItem> )} />
                  <Button type="submit" size="lg" disabled={generalInfoForm.formState.isSubmitting || !currentUser || isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/> }
                    Save General Info
                  </Button>
                </form>
              </Form>
            </FormSection>
        </AccordionItem>
        {currentDisplayOrder.map((sectionKey, index) => renderSection(sectionKey, index))}
      </Accordion>

      <Dialog open={isImportCvModalOpen} onOpenChange={(isOpen) => { setIsImportCvModalOpen(isOpen); if (!isOpen) { setCvFileContent(null); if(fileInputRef.current) fileInputRef.current.value = "";}}}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle className="font-headline">Import CV</DialogTitle><DialogDescription>Upload your CV (.txt or .md file) to automatically populate your profile. Data will be saved to Firestore after review and explicit save actions.</DialogDescription></DialogHeader>
          <div className="py-4 space-y-4">
            <div><Label htmlFor="cv-file-input">CV File (.txt, .md)</Label><Input id="cv-file-input" type="file" accept=".txt,.md,text/plain,text/markdown" onChange={handleCvFileChange} ref={fileInputRef} className="mt-1"/></div>
            {cvFileContent && (<div className="p-2 border rounded-md bg-muted max-h-40 overflow-y-auto text-xs"><h4 className="font-medium mb-1">File Preview:</h4><pre className="whitespace-pre-wrap">{cvFileContent.substring(0, 300)}{cvFileContent.length > 300 ? "..." : ""}</pre></div>)}
          </div>
          <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="button" onClick={handleProcessCvImport} disabled={!cvFileContent || isImportingCv || !currentUser || isSaving}>
              {isImportingCv ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {isImportingCv ? 'Processing...' : 'Process & Populate Forms'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CvCustomizationModal
        isOpen={isCvCustomizationModalOpen}
        onOpenChange={setIsCvCustomizationModalOpen}
        currentProfile={profileData}
        onOrderUpdate={handleSectionOrderUpdate}
      />

      <Dialog open={isWorkExperienceModalOpen} onOpenChange={setIsWorkExperienceModalOpen}><DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle className="font-headline">{editingWorkExperience ? 'Edit Work Experience' : 'Add New Work Experience'}</DialogTitle><DialogDescription>Provide details about your professional role.</DialogDescription></DialogHeader><Form {...workExperienceForm}><form onSubmit={workExperienceForm.handleSubmit(onWorkExperienceSubmit)} className="space-y-6 py-4"><WorkExperienceFormFields control={workExperienceForm.control} onPolishRequest={(fieldName) => handleAIPolish(fieldName, workExperienceForm)} polishingField={polishingField as keyof WorkExperienceFormData | null} isSubmitting={workExperienceForm.formState.isSubmitting || isSaving} /><DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit" disabled={workExperienceForm.formState.isSubmitting || isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}{editingWorkExperience ? 'Save Changes' : 'Add Experience'}</Button></DialogFooter></form></Form></DialogContent></Dialog>
      <Dialog open={isProjectModalOpen} onOpenChange={setIsProjectModalOpen}><DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle className="font-headline">{editingProject ? 'Edit Project' : 'Add New Project'}</DialogTitle><DialogDescription>Detail your project.</DialogDescription></DialogHeader><Form {...projectForm}><form onSubmit={projectForm.handleSubmit(onProjectSubmit)} className="space-y-6 py-4"><ProjectFormFields control={projectForm.control} onPolishRequest={(fieldName) => handleAIPolish(fieldName, projectForm)} polishingField={polishingField as keyof ProjectFormData | null} isSubmitting={projectForm.formState.isSubmitting || isSaving} /><DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit" disabled={projectForm.formState.isSubmitting || isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}{editingProject ? 'Save Changes' : 'Add Project'}</Button></DialogFooter></form></Form></DialogContent></Dialog>
      <Dialog open={isEducationModalOpen} onOpenChange={setIsEducationModalOpen}><DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col"><DialogHeader><DialogTitle className="font-headline">{editingEducation ? 'Edit Education' : 'Add New Education'}</DialogTitle><DialogDescription>Provide your educational qualifications and details.</DialogDescription></DialogHeader><div className="flex-grow overflow-y-auto pr-3"><Form {...educationForm}><form id="educationFormModal" onSubmit={educationForm.handleSubmit(onEducationSubmit)} className="space-y-6 py-4"><EducationFormFields control={educationForm.control} onPolishRequest={(fieldName) => handleAIPolish(fieldName, educationForm)} polishingField={polishingField as keyof EducationFormData | null} isSubmitting={educationForm.formState.isSubmitting || isSaving} /></form></Form></div><DialogFooter className="pt-4 mt-auto border-t"><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit" form="educationFormModal" disabled={educationForm.formState.isSubmitting || isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}{editingEducation ? 'Save Changes' : 'Add Education'}</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={isHonorAwardModalOpen} onOpenChange={setIsHonorAwardModalOpen}><DialogContent className="sm:max-w-xl"><DialogHeader><DialogTitle className="font-headline">{editingHonorAward ? 'Edit Honor/Award' : 'Add New Honor/Award'}</DialogTitle><DialogDescription>Detail your honors and awards.</DialogDescription></DialogHeader><Form {...honorAwardForm}><form onSubmit={honorAwardForm.handleSubmit(onHonorAwardSubmit)} className="space-y-6 py-4"><HonorAwardFormFields control={honorAwardForm.control} onPolishRequest={(fieldName) => handleAIPolish(fieldName, honorAwardForm)} polishingField={polishingField as keyof HonorAwardFormData | null} isSubmitting={honorAwardForm.formState.isSubmitting || isSaving} /><DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit" disabled={honorAwardForm.formState.isSubmitting || isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}{editingHonorAward ? 'Save Changes' : 'Add Honor/Award'}</Button></DialogFooter></form></Form></DialogContent></Dialog>
      <Dialog open={isPublicationModalOpen} onOpenChange={setIsPublicationModalOpen}><DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle className="font-headline">{editingPublication ? 'Edit Publication' : 'Add New Publication'}</DialogTitle><DialogDescription>Detail your published work.</DialogDescription></DialogHeader><Form {...publicationForm}><form onSubmit={publicationForm.handleSubmit(onPublicationSubmit)} className="space-y-6 py-4"><PublicationFormFields control={publicationForm.control} onPolishRequest={(fieldName) => handleAIPolish(fieldName, publicationForm)} polishingField={polishingField as keyof PublicationFormData | null} isSubmitting={publicationForm.formState.isSubmitting || isSaving} /><DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit" disabled={publicationForm.formState.isSubmitting || isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}{editingPublication ? 'Save Changes' : 'Add Publication'}</Button></DialogFooter></form></Form></DialogContent></Dialog>
      <Dialog open={isReferenceModalOpen} onOpenChange={setIsReferenceModalOpen}><DialogContent className="sm:max-w-xl"><DialogHeader><DialogTitle className="font-headline">{editingReference ? 'Edit Reference' : 'Add New Reference'}</DialogTitle><DialogDescription>Provide reference details.</DialogDescription></DialogHeader><Form {...referenceForm}><form onSubmit={referenceForm.handleSubmit(onReferenceSubmit)} className="space-y-6 py-4"><ReferenceFormFields control={referenceForm.control} onPolishRequest={(fieldName) => handleAIPolish(fieldName, referenceForm)} polishingField={polishingField as keyof ReferenceFormData | null} isSubmitting={referenceForm.formState.isSubmitting || isSaving} /><DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit" disabled={referenceForm.formState.isSubmitting || isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}{editingReference ? 'Save Changes' : 'Add Reference'}</Button></DialogFooter></form></Form></DialogContent></Dialog>
      <Dialog open={isCustomSectionModalOpen} onOpenChange={setIsCustomSectionModalOpen}><DialogContent className="sm:max-w-xl"><DialogHeader><DialogTitle className="font-headline">{editingCustomSection ? 'Edit Custom Section' : 'Add New Custom Section'}</DialogTitle><DialogDescription>Define a custom heading and content for your profile.</DialogDescription></DialogHeader><Form {...customSectionForm}><form onSubmit={customSectionForm.handleSubmit(onCustomSectionSubmit)} className="space-y-6 py-4"><CustomSectionFormFields control={customSectionForm.control} onPolishRequest={(fieldName) => handleAIPolish(fieldName, customSectionForm)} polishingField={polishingField as keyof CustomSectionFormData | null} isSubmitting={customSectionForm.formState.isSubmitting || isSaving} /><DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit" disabled={customSectionForm.formState.isSubmitting || isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}{editingCustomSection ? 'Save Changes' : 'Add Custom Section'}</Button></DialogFooter></form></Form></DialogContent></Dialog>
      <Dialog open={isSkillModalOpen} onOpenChange={setIsSkillModalOpen}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle className="font-headline">{editingSkill ? 'Edit Skill' : 'Add New Skill'}</DialogTitle><DialogDescription>Add a skill and optionally categorize it.</DialogDescription></DialogHeader><Form {...skillForm}><form onSubmit={skillForm.handleSubmit(onSkillSubmit)} className="space-y-6 py-4"><SkillFormFields control={skillForm.control} /><DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit" disabled={skillForm.formState.isSubmitting || isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}{editingSkill ? 'Save Changes' : 'Add Skill'}</Button></DialogFooter></form></Form></DialogContent></Dialog>
      <Dialog open={isCertificationModalOpen} onOpenChange={setIsCertificationModalOpen}><DialogContent className="sm:max-w-xl"><DialogHeader><DialogTitle className="font-headline">{editingCertification ? 'Edit Certification' : 'Add New Certification'}</DialogTitle><DialogDescription>Detail your certifications.</DialogDescription></DialogHeader><Form {...certificationForm}><form onSubmit={certificationForm.handleSubmit(onCertificationSubmit)} className="space-y-6 py-4"><CertificationFormFields control={certificationForm.control} /><DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit" disabled={certificationForm.formState.isSubmitting || isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}{editingCertification ? 'Save Changes' : 'Add Certification'}</Button></DialogFooter></form></Form></DialogContent></Dialog>
    </div>
    </TooltipProvider>
  );
}

