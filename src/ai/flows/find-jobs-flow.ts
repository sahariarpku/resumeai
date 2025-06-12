
'use server';
/**
 * @fileOverview AI flow to simulate finding job postings based on keywords.
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
  prompt: `You are a helpful job search assistant that simulates finding jobs from various sources (like RSS feeds).
Based on the provided keywords, generate a list of 3 to 5 diverse and plausible fictional job postings.

Keywords: "{{{keywords}}}"

For each job posting, provide:
1.  'role': The job title.
2.  'company': A realistic but fictional company name.
3.  'requirementsSummary': A concise 1-3 sentence summary of the key skills and experience needed. This summary will be used as the "job description" for matching and tailoring.
4.  'deadlineText': A textual representation of the application deadline (e.g., "August 15, 2024", "In 2 weeks", "Open until filled", "Urgent hiring").

Ensure variety in the roles, companies, and deadlines. Do not include actual URLs.
Present the output as a JSON object matching the 'jobPostings' array structure.
Example of a single job posting object:
{
  "role": "Frontend Developer",
  "company": "Innovate Solutions Inc.",
  "requirementsSummary": "Seeking a Frontend Developer with 3+ years of experience in React, TypeScript, and modern CSS frameworks. Strong understanding of responsive design and API integration is crucial. Experience with Next.js is a plus.",
  "deadlineText": "September 1, 2024"
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
      console.error("AI did not return expected job postings output for keywords:", input.keywords);
      return { jobPostings: [] }; // Return empty list on failure
    }
    return output;
  }
);
