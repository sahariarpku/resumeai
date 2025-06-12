
import { z } from "zod";

export const workExperienceSchema = z.object({
  id: z.string().optional(),
  company: z.string().min(1, "Company name is required"),
  role: z.string().min(1, "Role/Title is required"),
  startDate: z.string().min(1, "Start date is required (YYYY-MM)"),
  endDate: z.string(), // Allow empty for "Present"
  description: z.string().min(1, "Description is required").max(1500, "Description is too long"),
  achievements: z.string().optional(), // Storing as comma-separated string for simplicity in form
});
export type WorkExperienceFormData = z.infer<typeof workExperienceSchema>;


export const projectSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Project name is required"),
  description: z.string().min(1, "Description is required").max(1500, "Description is too long"),
  technologies: z.string().optional(), // Comma-separated
  achievements: z.string().optional(), // Comma-separated
  link: z.string().url("Must be a valid URL").optional().or(z.literal('')),
});
export type ProjectFormData = z.infer<typeof projectSchema>;

export const educationSchema = z.object({
  id: z.string().optional(),
  institution: z.string().min(1, "Institution name is required"),
  degree: z.string().min(1, "Degree is required"),
  fieldOfStudy: z.string().min(1, "Field of study is required"),
  startDate: z.string().min(1, "Start date is required (YYYY-MM)"),
  endDate: z.string().optional(), // Allow empty for "Present" or expected (YYYY-MM)
  gpa: z.string().optional(),
  thesisTitle: z.string().max(500, "Thesis title is too long").optional(),
  relevantCourses: z.string().optional(), // Comma-separated
  description: z.string().max(1000, "Description is too long").optional(), // For notes/achievements
});
export type EducationFormData = z.infer<typeof educationSchema>;

export const skillSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Skill name is required"),
  category: z.string().optional(),
  proficiency: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']).optional(),
});
export type SkillFormData = z.infer<typeof skillSchema>;

export const certificationSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Certification name is required"),
  issuingOrganization: z.string().min(1, "Issuing organization is required"),
  issueDate: z.string().min(1, "Issue date is required (YYYY-MM)"), // Ensure YYYY-MM format if using type="month"
  credentialId: z.string().optional(),
  credentialUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
});
export type CertificationFormData = z.infer<typeof certificationSchema>;

export const honorAwardSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Award/Honor name is required"),
  organization: z.string().optional(),
  date: z.string().optional(), // YYYY or YYYY-MM
  description: z.string().max(1000, "Description is too long").optional(),
});
export type HonorAwardFormData = z.infer<typeof honorAwardSchema>;

export const publicationSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Publication title is required"),
  authors: z.string().optional(), // Comma-separated
  journalOrConference: z.string().optional(),
  publicationDate: z.string().optional(), // YYYY or YYYY-MM
  link: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  doi: z.string().optional(),
  description: z.string().max(2000, "Description/Abstract is too long").optional(),
});
export type PublicationFormData = z.infer<typeof publicationSchema>;

export const referenceSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Reference name is required"),
  titleAndCompany: z.string().optional(),
  contactDetailsOrNote: z.string().max(500, "Details are too long (max 500 chars)").optional(),
});
export type ReferenceFormData = z.infer<typeof referenceSchema>;

export const customSectionSchema = z.object({
  id: z.string().optional(),
  heading: z.string().min(1, "Custom section heading is required").max(100, "Heading is too long (max 100 chars)"),
  content: z.string().min(1, "Content is required").max(2000, "Content is too long (max 2000 chars)"),
});
export type CustomSectionFormData = z.infer<typeof customSectionSchema>;


export const userProfileSchema = z.object({
  fullName: z.string().min(1, "Full name is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  linkedin: z.string().url("Invalid LinkedIn URL").optional().or(z.literal('')),
  github: z.string().url("Invalid GitHub URL").optional().or(z.literal('')),
  portfolio: z.string().url("Invalid Portfolio URL").optional().or(z.literal('')),
  summary: z.string().max(2000, "Summary is too long").optional(),
});
export type UserProfileFormData = z.infer<typeof userProfileSchema>;


export const jobDescriptionFormSchema = z.object({
  title: z.string().min(1, "Job title is required"),
  company: z.string().optional(),
  description: z.string().min(50, "Job description must be at least 50 characters"),
});
export type JobDescriptionFormData = z.infer<typeof jobDescriptionFormSchema>;

export const tailorResumeFormSchema = z.object({
  jobDescription: z.string().min(50, "Job description must be at least 50 characters"),
  resumeContent: z.string().min(100, "Resume content must be at least 100 characters"),
});
export type TailorResumeFormData = z.infer<typeof tailorResumeFormSchema>;

export const polishTextSchema = z.object({
  textToPolish: z.string().min(1, "Text to polish cannot be empty."),
});
export type PolishTextSchema = z.infer<typeof polishTextSchema>;

export const polishTextOutputSchema = z.object({
  polishedText: z.string(),
});
export type PolishTextOutputSchema = z.infer<typeof polishTextOutputSchema>;

// Schemas for Cover Letter Flow
export const GenerateCoverLetterInputSchema = z.object({
  resumeText: z.string().describe("The full text of the user's resume or professional profile."),
  jobDescriptionText: z.string().describe("The full text of the job description the user is applying for."),
  userName: z.string().optional().describe("The user's full name, if available."),
});
export type GenerateCoverLetterInput = z.infer<typeof GenerateCoverLetterInputSchema>;

export const GenerateCoverLetterOutputSchema = z.object({
  coverLetterText: z.string().describe("The generated cover letter text, formatted professionally."),
});
export type GenerateCoverLetterOutput = z.infer<typeof GenerateCoverLetterOutputSchema>;
