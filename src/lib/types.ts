
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
  relevantCourses?: string[]; // Stored as array, handled as comma-separated in form
  description?: string; // For additional notes, achievements during education
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
  authors?: string[]; // Stored as array, handled as comma-separated in form
  journalOrConference?: string;
  publicationDate?: string; // YYYY or YYYY-MM
  link?: string;
  doi?: string;
  description?: string; // Abstract or summary
}

export interface UserProfile {
  id: string;
  fullName?: string;
  email?: string; // Usually from auth
  phone?: string;
  address?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  summary?: string; // Professional summary
  workExperiences: WorkExperience[];
  projects: Project[];
  education: Education[];
  skills: Skill[];
  certifications: Certification[];
  honorsAndAwards: HonorAward[];
  publications: Publication[];
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
