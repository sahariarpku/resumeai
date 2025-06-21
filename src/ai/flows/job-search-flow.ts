'use server';
/**
 * @fileOverview Genkit flow to perform a sophisticated job search using the Firecrawl extract API.
 *
 * - jobSearch - A function that performs the job search using a natural language prompt.
 * - JobSearchInput - The input type for the function.
 * - JobSearchOutput - The return type for the function.
 */
import FireCrawlApp from '@mendable/firecrawl-js';
import { JobSearchInputSchema, JobSearchOutputSchema } from '@/lib/schemas';
import type { JobSearchInput, JobSearchOutput, JobExtractionResult } from '@/lib/schemas';

export async function jobSearch(
  input: JobSearchInput
): Promise<JobSearchOutput> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error('Firecrawl API key not found in environment variables.');
  }

  const app = new FireCrawlApp({ apiKey });

  // Define a set of reliable job board URL patterns
  const sources = [
    "https://jobs.ac.uk/*",
    "https://glassdoor.co.uk/Job/*",
    "https://uk.indeed.com/jobs?q=*",
    "https://www.linkedin.com/jobs/search/*"
  ];

  console.log('--- Firecrawl Extract Search ---');
  console.log('Using prompt:', input.prompt);
  
  try {
    // Use the extract method with enableWebSearch
    const extractResult = await app.extract(sources, {
      prompt: input.prompt,
      enableWebSearch: true,
      // Define a schema to get structured data back from the extraction
      schema: {
        type: "array",
        items: {
          type: "object",
          properties: {
            jobTitle: { type: "string" },
            companyName: { type: "string" },
            jobLocation: { type: "string" },
            jobDescription: { type: "string" },
            jobUrl: { type: "string" }
          }
        }
      }
    });

    console.log('Received raw response from Firecrawl Extract API:', JSON.stringify(extractResult, null, 2));

    if (!extractResult || !Array.isArray(extractResult)) {
        console.error('Firecrawl extract returned an unexpected format. Expected an array of job objects.');
        throw new Error('Invalid response format from Firecrawl extract API.');
    }
    
    // The result of `extract` with a schema is directly the array of objects
    const jobs: JobExtractionResult[] = extractResult.map((item: any) => ({
      title: item.jobTitle || 'Untitled Job Posting',
      url: item.jobUrl || undefined,
      markdownContent: item.jobDescription || 'No description extracted.',
      company: item.companyName || undefined,
      location: item.jobLocation || undefined,
    }));

    return { jobs };

  } catch (error) {
    console.error('--- Firecrawl Extract Failed ---');
    console.error('Full error object:', error);
    
    let errorMessage = 'An unknown error occurred during the job search.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }

    throw new Error(`Job search failed: ${errorMessage}`);
  }
}
