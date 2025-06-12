
'use server';
/**
 * @fileOverview AI flow to extract structured profile information from CV text.
 *
 * - extractProfileFromCv - A function that extracts profile data from CV text.
 * - ExtractProfileFromCvInput - The input type for the function.
 * - ExtractProfileFromCvOutput - The return type for the function (mirrors UserProfile structure).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define schemas for sub-objects to match UserProfile structure closely
const AiWorkExperienceSchema = z.object({
  company: z.string().optional().describe("Name of the company or organization."),
  role: z.string().optional().describe("Job title or role."),
  startDate: z.string().optional().describe("Start date, e.g., YYYY-MM, Jan 2020."),
  endDate: z.string().optional().describe("End date, e.g., YYYY-MM, Jan 2021, Present."),
  description: z.string().optional().describe("Brief description of the role and main responsibilities."),
  achievements: z.array(z.string()).optional().describe("List of key achievements or responsibilities as bullet points/strings."),
});

const AiEducationSchema = z.object({
  institution: z.string().optional().describe("Name of the educational institution."),
  degree: z.string().optional().describe("Degree obtained, e.g., Bachelor of Science."),
  fieldOfStudy: z.string().optional().describe("Major or field of study."),
  startDate: z.string().optional().describe("Start date, e.g., YYYY-MM, Sep 2016."),
  endDate: z.string().optional().describe("End date or expected graduation, e.g., YYYY-MM, May 2020."),
  gpa: z.string().optional().describe("GPA or academic result, e.g., 3.8/4.0."),
  description: z.string().optional().describe("Relevant courses, thesis title, or other notes."), // Combined for simplicity for AI
});

const AiProjectSchema = z.object({
  name: z.string().optional().describe("Name of the project."),
  description: z.string().optional().describe("Description of the project."),
  technologies: z.array(z.string()).optional().describe("List of technologies used."),
  achievements: z.array(z.string()).optional().describe("List of key achievements or features as bullet points/strings."),
  link: z.string().url().optional().describe("URL link to the project if available."),
});

const AiSkillSchema = z.object({
  name: z.string().describe("Name of the skill."),
  category: z.string().optional().describe("Category of the skill, e.g., Programming Language, Tool, Soft Skill."),
  proficiency: z.string().optional().describe("Proficiency level, e.g., Beginner, Intermediate, Advanced, Expert."),
});

const AiCertificationSchema = z.object({
  name: z.string().optional().describe("Name of the certification."),
  issuingOrganization: z.string().optional().describe("Organization that issued the certification."),
  issueDate: z.string().optional().describe("Date the certification was issued, e.g., YYYY-MM."),
  credentialId: z.string().optional().describe("Credential ID if available."),
  credentialUrl: z.string().url().optional().describe("URL to verify the credential."),
});

const AiHonorAwardSchema = z.object({
  name: z.string().optional().describe("Name of the honor or award."),
  organization: z.string().optional().describe("Organization that gave the honor/award."),
  date: z.string().optional().describe("Date received, e.g., YYYY or YYYY-MM."),
  description: z.string().optional().describe("Brief description of the honor/award."),
});

const AiPublicationSchema = z.object({
  title: z.string().optional().describe("Title of the publication."),
  authors: z.array(z.string()).optional().describe("List of authors."),
  journalOrConference: z.string().optional().describe("Name of the journal or conference."),
  publicationDate: z.string().optional().describe("Date of publication, e.g., YYYY-MM."),
  link: z.string().url().optional().describe("URL link to the publication."),
  doi: z.string().optional().describe("Digital Object Identifier (DOI)."),
  description: z.string().optional().describe("Brief abstract or description."),
});

const AiReferenceSchema = z.object({
    name: z.string().optional().describe("Name of the reference person."),
    titleAndCompany: z.string().optional().describe("Title and company of the reference."),
    contactDetailsOrNote: z.string().optional().describe("Contact details or note like 'Available upon request'."),
});

const AiCustomSectionSchema = z.object({
    heading: z.string().optional().describe("Heading for the custom section, e.g., 'Languages', 'Interests'."),
    content: z.string().optional().describe("Content for the custom section, often a list or paragraph."),
});


export const ExtractProfileFromCvInputSchema = z.object({
  cvText: z.string().describe("The full text content of the user's CV/resume."),
});
export type ExtractProfileFromCvInput = z.infer<typeof ExtractProfileFromCvInputSchema>;

export const ExtractProfileFromCvOutputSchema = z.object({
  fullName: z.string().optional().describe("Full name of the person."),
  email: z.string().email().optional().describe("Email address."),
  phone: z.string().optional().describe("Phone number."),
  address: z.string().optional().describe("Physical address or city/country."),
  linkedin: z.string().url().optional().describe("URL to LinkedIn profile."),
  github: z.string().url().optional().describe("URL to GitHub profile."),
  portfolio: z.string().url().optional().describe("URL to personal portfolio website."),
  summary: z.string().optional().describe("Professional summary or objective statement."),
  workExperiences: z.array(AiWorkExperienceSchema).optional().describe("Array of work experiences."),
  projects: z.array(AiProjectSchema).optional().describe("Array of projects."),
  education: z.array(AiEducationSchema).optional().describe("Array of education entries."),
  skills: z.array(AiSkillSchema).optional().describe("Array of skills."),
  certifications: z.array(AiCertificationSchema).optional().describe("Array of certifications."),
  honorsAndAwards: z.array(AiHonorAwardSchema).optional().describe("Array of honors and awards."),
  publications: z.array(AiPublicationSchema).optional().describe("Array of publications."),
  references: z.array(AiReferenceSchema).optional().describe("Array of references or a note about them."),
  customSections: z.array(AiCustomSectionSchema).optional().describe("Array of custom sections found in the CV."),
});
export type ExtractProfileFromCvOutput = z.infer<typeof ExtractProfileFromCvOutputSchema>;

export async function extractProfileFromCv(
  input: ExtractProfileFromCvInput
): Promise<ExtractProfileFromCvOutput> {
  return extractProfileFromCvFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractProfileFromCvPrompt',
  input: {schema: ExtractProfileFromCvInputSchema},
  output: {schema: ExtractProfileFromCvOutputSchema},
  prompt: `You are an expert CV/Resume parsing assistant. Your task is to meticulously analyze the provided CV text and extract all relevant professional information into a structured JSON format.

CV Text:
\`\`\`
{{{cvText}}}
\`\`\`

Please parse the CV and extract the following information if available:
- Contact Information: fullName, email, phone, address, linkedin, github, portfolio.
- Professional Summary: A brief overview or objective.
- Work Experiences: For each role, extract company, role/title, startDate, endDate, a description of responsibilities, and a list of key achievements (as bullet points if possible).
- Education: For each degree, extract institution, degree, fieldOfStudy, startDate, endDate, GPA (if mentioned), and any description (like relevant courses or thesis title).
- Projects: For each project, extract name, description, technologies used (as a list), key achievements/features (as a list), and a project link.
- Skills: Extract skills. If possible, group them by category (e.g., "Programming Languages", "Tools", "Soft Skills") and note proficiency if mentioned. Each skill should be an object with 'name', 'category' (optional), and 'proficiency' (optional).
- Certifications: For each, extract name, issuingOrganization, issueDate, and credentialId/Url if available.
- Honors & Awards: For each, extract name, organization, date, and a brief description.
- Publications: For each, extract title, authors (as a list), journal/conference, publicationDate, link, DOI, and a brief description/abstract.
- References: Extract reference details or a note like "Available upon request".
- Custom Sections: Identify any other distinct sections (e.g., "Languages", "Interests", "Volunteer Experience") and extract their heading and content.

Ensure dates are captured as accurately as possible (e.g., "Jan 2020 - Present", "2019-09 - 2023-05").
For lists like achievements, technologies, or authors, provide them as arrays of strings.
If a section or piece of information is not present, omit the corresponding field or provide an empty array where appropriate.
The output MUST strictly follow the provided JSON schema.
`,
});

const extractProfileFromCvFlow = ai.defineFlow(
  {
    name: 'extractProfileFromCvFlow',
    inputSchema: ExtractProfileFromCvInputSchema,
    outputSchema: ExtractProfileFromCvOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      // Fallback to return at least an empty object matching the schema structure,
      // rather than null, to prevent downstream errors if a consumer expects an object.
      return {
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
    }
    return output;
  }
);
