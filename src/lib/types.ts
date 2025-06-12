
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
  id: string;
  fullName?: string;
  email?: string;
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
}

export interface JobDescriptionItem {
  id: string;
  title: string;
  company?: string;
  description: string; // The full job description text
  createdAt: string; // ISO date string
  matchPercentage?: number;
  matchSummary?: string;
  matchCategory?: 'Excellent Match' | 'Good Match' | 'Fair Match' | 'Poor Match';
}

export interface StoredResume {
  id: string;
  name: string; // e.g., "Resume for Software Engineer at Google"
  jobDescriptionId?: string; // Link to the JD it was tailored for
  baseResumeSnapshot?: string; // Snapshot of user profile data used
  tailoredContent: string; // The tailored resume text (e.g., Markdown or plain text)
  aiAnalysis?: string; // AI analysis of match
  aiSuggestions?: string; // AI suggestions for improvement
  createdAt: string; // ISO date string
}
