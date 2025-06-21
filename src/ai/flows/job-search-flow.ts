'use server';
/**
 * @fileOverview Genkit flow to perform a job search using the Firecrawl search API.
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

  console.log('--- Firecrawl Search ---');
  console.log('Using prompt:', input.prompt);
  
  try {
    // Use the search method, which is the correct function for this operation.
    const searchResult = await app.search(input.prompt, {
      limit: 7, // Limit the number of results
      scrapeOptions: {
        formats: ["markdown"] // Ensure we get markdown content back
      }
    });

    console.log('Received raw response from Firecrawl Search API:', JSON.stringify(searchResult, null, 2));

    if (!searchResult || !Array.isArray(searchResult)) {
        console.error('Firecrawl search returned an unexpected format. Expected an array of job objects.');
        throw new Error('Invalid response format from Firecrawl search API.');
    }
    
    // The result of `search` is directly the array of objects
    const jobs: JobExtractionResult[] = searchResult.map((item: any) => ({
      title: item.title || 'Untitled Job Posting',
      url: item.url || undefined,
      markdown: item.markdown || 'No description extracted.', // The field is 'markdown'
      company: item.company || undefined,
      location: item.location || undefined,
    }));

    return { jobs };

  } catch (error) {
    console.error('--- Firecrawl Search Failed ---');
    console.error('Full error object:', error);
    
    let errorMessage = 'An unknown error occurred during the job search.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }

    throw new Error(`Job search failed: ${errorMessage}`);
  }
}
