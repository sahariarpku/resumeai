
'use server';
/**
 * @fileOverview AI flow to generate job search links based on a user's description.
 *
 * - jobSearch - A function that takes a natural language description and returns a list of search links.
 * - JobSearchInput - The input type for the function.
 * - JobSearchOutput - The return type for the function.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {
  JobSearchInputSchema,
  JobSearchOutputSchema,
} from '@/lib/schemas';
import type {
  JobSearchInput,
  JobSearchOutput,
  JobSearchLink,
} from '@/lib/schemas';

export type { JobSearchInput, JobSearchOutput };

const JOB_SITES = [
  {
    name: 'Indeed UK',
    urlTemplate: 'https://uk.indeed.com/jobs?q={query}',
  },
  {
    name: 'Glassdoor UK',
    urlTemplate: 'https://www.glassdoor.co.uk/Job/jobs.htm?sc.keyword={query}',
  },
  {
    name: 'Jobs.ac.uk',
    urlTemplate: 'https://www.jobs.ac.uk/search/?keywords={query}',
  },
];

// This schema defines the structure of the AI's output for search queries
const SearchQueriesOutputSchema = z.object({
  queries: z
    .array(z.string())
    .min(3)
    .max(5)
    .describe(
      'An array of 3 to 5 distinct, effective search query strings based on the user description.'
    ),
});

const generateQueriesPrompt = ai.definePrompt({
  name: 'generateSearchQueriesPrompt',
  input: { schema: JobSearchInputSchema },
  output: { schema: SearchQueriesOutputSchema },
  prompt: `You are an expert career advisor and search engine specialist. Your task is to analyze a user's description of their desired job and generate a list of 3-5 effective, concise search query strings. These queries will be used to search job websites.

Focus on extracting key terms, skills, job titles, and locations. Create variations to cover different ways a job might be posted. For example, if the user says "junior react dev in london", you might generate ["junior react developer london", "entry level frontend developer london", "react jobs london"].

User's job description:
"{{{prompt}}}"

Generate the list of search queries now.
`,
});

export const jobSearch = ai.defineFlow(
  {
    name: 'jobSearchFlow',
    inputSchema: JobSearchInputSchema,
    outputSchema: JobSearchOutputSchema,
  },
  async (input) => {
    // Step 1: Call the AI to generate a list of search query strings
    const { output } = await generateQueriesPrompt(input);
    if (!output || !output.queries || output.queries.length === 0) {
      throw new Error('AI failed to generate search queries.');
    }

    const generatedQueries = output.queries;
    const allLinks: JobSearchLink[] = [];

    // Step 2: For each generated query, create search links for each job site
    generatedQueries.forEach((query) => {
      JOB_SITES.forEach((site) => {
        allLinks.push({
          siteName: site.name,
          query,
          url: site.urlTemplate.replace(
            '{query}',
            encodeURIComponent(query)
          ),
        });
      });
    });

    return { links: allLinks };
  }
);
