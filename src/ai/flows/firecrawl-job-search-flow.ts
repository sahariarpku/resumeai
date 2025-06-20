'use server';
/**
 * @fileOverview AI flow to perform a job search using Firecrawl.
 *
 * - firecrawlJobSearch - A function that performs the job search.
 * - FirecrawlSearchInput - The input type for the function.
 * - FirecrawlSearchOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {
  FirecrawlSearchInput as FirecrawlSearchFormData, // Alias for clarity
  FirecrawlSearchOutput,
  FirecrawlJobResultSchema,
} from '@/lib/schemas';
import type {FirecrawlSearchInput, FirecrawlJobResult} from '@/lib/schemas';
import FireCrawlApp from '@mendable/firecrawl-js';

export type {FirecrawlSearchInput, FirecrawlSearchOutput};

export async function firecrawlJobSearch(
  input: FirecrawlSearchInput
): Promise<FirecrawlSearchOutput> {
  const firecrawlApp = new FireCrawlApp({
    apiKey: process.env.FIRECRAWL_API_KEY,
  });

  // Construct the query string as per the working example
  const searchQuery = `"${input.keywords}" jobs in "${input.location}"`;

  const searchOptions = {
    limit: 7, // Fetch a few results
    scrapeOptions: {
      formats: ['markdown' as const],
    },
  };

  console.log('--- Firecrawl Search ---');
  console.log('Search Query:', searchQuery);
  console.log('Search Options:', JSON.stringify(searchOptions, null, 2));

  try {
    const searchResult = await firecrawlApp.search(searchQuery, searchOptions);

    if (!searchResult || !Array.isArray(searchResult)) {
      console.error('Firecrawl search did not return an array:', searchResult);
      throw new Error('Invalid response format from Firecrawl search API.');
    }
    
    console.log(`Firecrawl returned ${searchResult.length} results.`);

    // Map the raw results to our defined FirecrawlJobResult structure
    const jobPostings: FirecrawlJobResult[] = searchResult.map((job: any) => ({
      title: job.metadata?.title || job.title || 'Untitled Job Posting',
      url: job.url || '',
      markdownContent: job.markdown || job.description || 'No content scraped.',
      company: job.metadata?.company || undefined,
      location: job.metadata?.location || undefined,
    }));
    
    // Validate each mapped object to ensure it conforms to our schema
    const validatedJobPostings = jobPostings.filter(job => {
      try {
        FirecrawlJobResultSchema.parse(job);
        return true;
      } catch (e) {
        console.warn("Filtered out invalid job posting from Firecrawl:", job, e);
        return false;
      }
    });

    return {jobPostings: validatedJobPostings};
  } catch (error) {
    console.error('Firecrawl search failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    // Re-throw a more informative error to be caught by the UI
    throw new Error(`Firecrawl search failed: ${errorMessage}`);
  }
}
