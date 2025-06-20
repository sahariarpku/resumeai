
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
  firecrawlSearchFormSchema,
  FirecrawlSearchOutput,
  FirecrawlJobResultSchema,
} from '@/lib/schemas';
import type {FirecrawlJobResult} from '@/lib/schemas';
import FireCrawlApp from '@mendable/firecrawl-js';
import {z} from 'zod';

export type FirecrawlSearchInput = z.infer<typeof firecrawlSearchFormSchema>;
export type FirecrawlSearchOutput = FirecrawlSearchOutput;

export async function firecrawlJobSearch(
  input: FirecrawlSearchInput
): Promise<FirecrawlSearchOutput> {
  if (!process.env.FIRECRAWL_API_KEY) {
    throw new Error('Firecrawl API key not found in environment variables.');
  }
  const firecrawlApp = new FireCrawlApp({
    apiKey: process.env.FIRECRAWL_API_KEY,
  });

  // Re-structured based on the new, successful example provided.
  // The main search terms go into the query.
  const searchQuery = `${input.keywords} jobs`;

  // Location and other parameters go into the options object.
  const searchOptions = {
    limit: 7,
    location: input.location, // Using the separate location parameter.
    tbs: 'qdr:w', // Default to searching for jobs in the "past week"
    scrapeOptions: {
      formats: ['markdown' as const],
    },
  };

  console.log('--- Firecrawl Search ---');
  console.log('Search Query:', searchQuery);
  console.log('Search Options:', JSON.stringify(searchOptions, null, 2));

  try {
    // The Firecrawl SDK's search method returns an array of results directly or an object with a data property
    const searchResult: any = await firecrawlApp.search(searchQuery, searchOptions);
    
    console.log('Firecrawl raw result:', JSON.stringify(searchResult, null, 2));

    // Defensively handle the response structure. It could be an array or an object with a `data` property.
    let rawJobs: any[] = [];
    if (searchResult && Array.isArray(searchResult.data)) {
        rawJobs = searchResult.data;
    } else if (searchResult && Array.isArray(searchResult)) {
        rawJobs = searchResult;
    } else {
      console.error('Firecrawl search returned an unexpected format:', searchResult);
      throw new Error('Invalid response format from Firecrawl search API.');
    }
    
    console.log(`Firecrawl returned ${rawJobs.length} potential job results.`);

    // Map the results to our defined schema
    const jobPostings: FirecrawlJobResult[] = rawJobs.map((job: any) => ({
      // Prioritize metadata title, but fall back to the main title from the search result.
      title: job.metadata?.title || job.title || 'Untitled Job Posting',
      url: job.url || '',
      // Use the scraped markdown content, fall back to the search description snippet if markdown is not available.
      markdownContent: job.markdown || job.description || 'No content scraped.',
      company: job.metadata?.company || undefined,
      location: job.metadata?.location || undefined,
    }));
    
    // Validate each job posting against our schema to filter out malformed results
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
    // Make the error message more informative for the client-side toast.
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    throw new Error(`Firecrawl search failed: ${errorMessage}`);
  }
}
