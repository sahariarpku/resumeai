
import { z } from "zod";
import type { ProfileSectionKey } from "./types"; // Ensure this is imported

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

// Schemas for CV Section Reordering Flow
const ProfileSectionKeyEnum = z.enum([
  'workExperiences', 'projects', 'education', 'skills', 
  'certifications', 'honorsAndAwards', 'publications', 'references', 'customSections'
]);

export const SuggestCvSectionOrderInputSchema = z.object({
  userPreference: z.string().describe("User's stated preference for the CV type or focus, e.g., 'academic CV', 'chronological work-focused', 'skills-based for tech'. An empty string means suggest a general default order."),
  currentSectionOrder: z.array(ProfileSectionKeyEnum).describe("The current order of sections in the user's profile."),
  availableSections: z.array(ProfileSectionKeyEnum).describe("All available sections that can be ordered."),
});
export type SuggestCvSectionOrderInput = z.infer<typeof SuggestCvSectionOrderInputSchema>;

export const SuggestCvSectionOrderOutputSchema = z.object({
  newSectionOrder: z.array(ProfileSectionKeyEnum).describe("The AI-suggested new order of sections. This should include all sections from 'availableSections', just reordered."),
  reasoning: z.string().optional().describe("A brief explanation for the suggested order, if applicable."),
});
export type SuggestCvSectionOrderOutput = z.infer<typeof SuggestCvSectionOrderOutputSchema>;


// Schemas for LaTeX CV Generation Flow
export const GenerateLatexCvInputSchema = z.object({
  profileAsText: z.string().describe("The complete resume content as a plain text string. This text should be well-structured, ideally with Markdown-like headings for sections."),
  cvStylePreference: z.string().optional().describe("Optional user preference for the LaTeX CV style, e.g., 'Oxford style', 'modern', 'classic two-column'.")
});
export type GenerateLatexCvInput = z.infer<typeof GenerateLatexCvInputSchema>;

export const GenerateLatexCvOutputSchema = z.object({
  latexCode: z.string().describe("The generated LaTeX code for the CV. This should be a complete, compilable LaTeX document."),
});
export type GenerateLatexCvOutput = z.infer<typeof GenerateLatexCvOutputSchema>;

// Schemas for Find Jobs Flow (Simulated RSS)
export const FindJobsInputSchema = z.object({
  keywords: z.string().min(1, "Keywords are required.").describe("Keywords for job search, e.g., 'software engineer react remote'"),
  location: z.string().optional().describe("Optional location preference for the job search, e.g., 'Remote', 'New York, NY'.")
});
export type FindJobsInput = z.infer<typeof FindJobsInputSchema>;

const SimulatedJobPostingSchema = z.object({
  role: z.string().describe("The job title or role."),
  company: z.string().describe("The name of the company."),
  requirementsSummary: z.string().describe("A brief 1-3 sentence summary of the key requirements for the job."),
  deadlineText: z.string().describe("A textual representation of the application deadline (e.g., 'In 2 weeks', 'August 15, 2024', 'Open until filled'). This should represent a future date or an open status."),
  location: z.string().describe("The location of the job (e.g., 'Remote, USA', 'London, UK', 'Berlin, Germany (Hybrid)'). This should be relevant to the user's location preference if provided."),
  jobUrl: z.string().optional().describe("A fictional but plausible-looking and well-formed URL for the job posting (e.g., \"https://boards.greenhouse.io/fictional-company/jobs/12345\", \"https://fictionaltech.jobs/senior-developer\", \"https://careers.examplecorp.com/en/jobs/software-engineer-remote-123\")."),
});

export const FindJobsOutputSchema = z.object({
  jobPostings: z.array(SimulatedJobPostingSchema).describe("A list of simulated job postings found based on the keywords and location."),
});
export type FindJobsOutput = z.infer<typeof FindJobsOutputSchema>;

