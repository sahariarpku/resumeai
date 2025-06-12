
'use server';
/**
 * @fileOverview AI flow to simulate finding job postings based on keywords and location.
 * This flow does not actually parse RSS feeds but generates plausible job data.
 *
 * - findJobs - A function that simulates a job search.
 * - FindJobsInput - The input type for the findJobs function.
 * - FindJobsOutput - The return type for the findJobs function.
 */

import {ai} from '@/ai/genkit';
import {FindJobsInputSchema, FindJobsOutputSchema} from '@/lib/schemas';
import type {FindJobsInput, FindJobsOutput} from '@/lib/schemas';

export type {FindJobsInput, FindJobsOutput};

export async function findJobs(
  input: FindJobsInput
): Promise<FindJobsOutput> {
  return findJobsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'findJobsPrompt',
  input: {schema: FindJobsInputSchema},
  output: {schema: FindJobsOutputSchema},
  prompt: `You are a helpful job search assistant that simulates finding jobs from various sources.
Based on the provided keywords and optional location preference, generate a list of 3 to 5 diverse and plausible fictional job postings.

Keywords: "{{{keywords}}}"
{{#if location}}
Location Preference: "{{{location}}}"
Consider this location preference heavily when generating job locations. For example, if 'Remote' is specified, prioritize remote jobs. If a city is specified, generate jobs in or near that city.
{{/if}}

For each job posting, provide:
1.  'role': The job title.
2.  'company': A realistic but fictional company name.
3.  'requirementsSummary': A concise 1-3 sentence summary of the key skills and experience needed. This summary will be used as the "job description" for matching and tailoring.
4.  'deadlineText': A textual representation of the application deadline. This MUST represent a future deadline or an open status (e.g., "October 31, 2024" (assuming current date is before this), "In 3 weeks", "Open until filled", "Hiring immediately", "Applications reviewed on a rolling basis"). Avoid any dates that would appear to be in the past.
5.  'location': A plausible fictional location (e.g., "Remote, USA", "London, UK", "Berlin, Germany (Hybrid)"). If a location preference was provided by the user, this generated location should align with it.
6.  'jobUrl': A fictional but plausible-looking and well-formed URL for the job posting (e.g., "https://boards.greenhouse.io/fictional-company/jobs/12345", "https://fictionaltech.jobs/senior-developer", "https://careers.examplecorp.com/en/jobs/software-engineer-remote-123").

Ensure variety in the roles, companies, deadlines, locations, and URLs.
Present the output as a JSON object matching the 'jobPostings' array structure.
Example of a single job posting object:
{
  "role": "Frontend Developer",
  "company": "Innovate Solutions Inc.",
  "requirementsSummary": "Seeking a Frontend Developer with 3+ years of experience in React, TypeScript, and modern CSS frameworks. Strong understanding of responsive design and API integration is crucial. Experience with Next.js is a plus.",
  "deadlineText": "November 1, 2024",
  "location": "Remote (US Preferred)",
  "jobUrl": "https://innovatesolutions.example.com/careers/frontend-dev-1124"
}
`,
});

const findJobsFlow = ai.defineFlow(
  {
    name: 'findJobsFlow',
    inputSchema: FindJobsInputSchema,
    outputSchema: FindJobsOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output || !output.jobPostings) {
      // Fallback or error handling if the LLM doesn't return expected output
      console.error("AI did not return expected job postings output for keywords:", input.keywords, "and location:", input.location);
      return { jobPostings: [] }; // Return empty list on failure
    }
    // Ensure each job posting has at least an empty string for optional fields if missing
    const processedPostings = output.jobPostings.map(job => ({
      ...job,
      location: job.location || "Not specified", // Should always be provided by AI based on new prompt
      jobUrl: job.jobUrl || undefined, 
    }));
    return { jobPostings: processedPostings };
  }
);

