export interface WorkExperience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string; // Can be "Present"
  description: string;
  achievements?: string[]; // Comma-separated or array
}

export interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[]; // Comma-separated or array
  achievements?: string[]; // Comma-separated or array
  link?: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string; // Can be "Present" or expected graduation
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
  issueDate: string;
  credentialId?: string;
  credentialUrl?: string;
}

export interface UserProfile {
  id: string;
  fullName?: string;
  email?: string; // Usually from auth
  phone?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  summary?: string; // Professional summary
  workExperiences: WorkExperience[];
  projects: Project[];
  education: Education[];
  skills: Skill[];
  certifications: Certification[];
}

export interface JobDescriptionItem {
  id: string;
  title: string;
  company?: string;
  description: string; // The full job description text
  createdAt: string; // ISO date string
  // Potentially add tailored resume IDs linked to this JD
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
  // downloadUrl?: string; // if stored in R2, or generated on demand
}
