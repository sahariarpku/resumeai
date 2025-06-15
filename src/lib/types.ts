
import type { Timestamp } from 'firebase/firestore';

export interface WorkExperience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string; // Can be "Present"
  description: string;
  achievements?: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  technologies?: string[];
  achievements?: string[];
  link?: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string; // Can be "Present" or expected graduation
  gpa?: string; // e.g., "3.8/4.0" or "First Class"
  thesisTitle?: string;
  relevantCourses?: string[];
  description?: string;
}

export interface Skill {
  id: string;
  name: string;
  category?: string; // e.g., Programming Language, Tool, Soft Skill
  proficiency?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
}

export interface Certification {
  id: string;
  name: string;
  issuingOrganization: string;
  issueDate: string; // Consider YYYY-MM format
  credentialId?: string;
  credentialUrl?: string;
}

export interface HonorAward {
  id: string;
  name: string;
  organization?: string;
  date?: string; // YYYY or YYYY-MM
  description?: string;
}

export interface Publication {
  id: string;
  title: string;
  authors?: string[];
  journalOrConference?: string;
  publicationDate?: string; // YYYY or YYYY-MM
  link?: string;
  doi?: string;
  description?: string;
}

export interface Reference {
  id: string;
  name: string;
  titleAndCompany?: string;
  contactDetailsOrNote?: string;
}

export interface CustomSection {
  id: string;
  heading: string;
  content: string;
}

export type ProfileSectionKey = 
  | 'workExperiences' 
  | 'projects' 
  | 'education' 
  | 'skills' 
  | 'certifications' 
  | 'honorsAndAwards' 
  | 'publications' 
  | 'references' 
  | 'customSections';

export const DEFAULT_SECTION_ORDER: ProfileSectionKey[] = [
  'workExperiences',
  'education',
  'projects',
  'skills',
  'honorsAndAwards',
  'publications',
  'certifications',
  'references',
  'customSections',
];

export interface UserProfile {
  id: string; // Should map to currentUser.uid
  fullName?: string;
  email?: string; // Should map to currentUser.email
  phone?: string;
  address?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  summary?: string;
  workExperiences: WorkExperience[];
  projects: Project[];
  education: Education[];
  skills: Skill[];
  certifications: Certification[];
  honorsAndAwards: HonorAward[];
  publications: Publication[];
  references: Reference[];
  customSections: CustomSection[];
  sectionOrder?: ProfileSectionKey[];
  // Timestamps for tracking, managed by Firestore or server-side logic
  createdAt?: Timestamp | any; // Allow 'any' for serverTimestamp() before conversion
  updatedAt?: Timestamp | any; // Allow 'any' for serverTimestamp() before conversion
}

export interface JobDescriptionItem {
  id: string; // Firestore document ID
  title: string;
  company?: string;
  description: string; // The full job description text
  createdAt: Timestamp | string; // Firestore Timestamp or ISO string for client
  userId?: string; // To associate with a user if stored in a top-level collection
  matchPercentage?: number;
  matchSummary?: string;
  matchCategory?: 'Excellent Match' | 'Good Match' | 'Fair Match' | 'Poor Match';
}

export interface StoredResume {
  id: string; // Firestore document ID
  name: string; // e.g., "Resume for Software Engineer at Google"
  jobDescriptionId?: string; // Link to the JD it was tailored for
  baseResumeSnapshot?: string; // Snapshot of user profile data used
  tailoredContent: string; // The tailored resume text (e.g., Markdown or plain text)
  aiAnalysis?: string; // AI analysis of match
  aiSuggestions?: string; // AI suggestions for improvement
  createdAt: Timestamp | string; // Firestore Timestamp or ISO string for client
  userId?: string; // To associate with a user
}

// For the "Jobs RSS" feature
export interface JobPostingRssItem {
  id: string; // Client-generated unique ID
  title: string; // Extracted directly from RSS <title>
  link: string;  // Extracted directly from RSS <link>
  pubDate?: string; // Extracted directly from RSS <pubDate>
  
  rssItemXml: string; // Store the raw XML of the <item> for deferred AI processing

  // Fields to be populated by AI after user action
  role?: string; // Usually same as title, but AI can confirm/refine
  company?: string;
  requirementsSummary?: string;
  deadlineText?: string; // AI might derive a better deadline from description
  location?: string;
  jobUrl?: string; // Usually same as link, AI can confirm/refine

  // CV Match fields
  matchPercentage?: number;
  matchSummary?: string;
  matchCategory?: 'Excellent Match' | 'Good Match' | 'Fair Match' | 'Poor Match';
  
  isProcessingDetails?: boolean; // UI loading state for AI processing this item
  isCalculatingMatch?: boolean; // UI loading state for CV match calculation for this item (can reuse or differentiate)
}

