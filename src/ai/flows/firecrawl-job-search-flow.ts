'use server';
/**
 * @fileOverview AI flow to perform a job search using Firecrawl's search API.
 *
 * - firecrawlJobSearch - A function that performs the job search.
 * - FirecrawlSearchInput - The input type for the function.
 * - FirecrawlSearchOutput - The return type for the function.
 */

import {
  firecrawlSearchFormSchema,
  FirecrawlSearchOutputSchema,
  FirecrawlJobResultSchema,
} from '@/lib/schemas';
import type { FirecrawlJobResult, FirecrawlSearchOutput } from '@/lib/schemas';
import FireCrawlApp from '@mendable/firecrawl-js';
import { z } from 'zod';

// For clarity, let's alias the input type for the flow function
export type FirecrawlSearchInput = z.infer<typeof firecrawlSearchFormSchema>;

export async function firecrawlJobSearch(
  input: FirecrawlSearchInput
): Promise<FirecrawlSearchOutput> {
  if (!process.env.FIRECRAWL_API_KEY) {
    throw new Error('Firecrawl API key not found in environment variables. Please check your .env file.');
  }

  const firecrawlApp = new FireCrawlApp({
    apiKey: process.env.FIRECRAWL_API_KEY,
  });

  // Corrected Approach: Keep query and location separate, as the SDK expects.
  // This mirrors the structure of the working curl command's JSON body.
  const searchQuery = input.keywords;
  const searchOptions = {
    limit: 7,
    location: input.location,
    scrapeOptions: {
      formats: ['markdown' as const],
    },
  };

  console.log('--- Firecrawl Search ---');
  console.log('Sending request to Firecrawl API with separated query and options...');
  console.log('Search Query:', searchQuery);
  console.log('Search Options:', JSON.stringify(searchOptions, null, 2));

  try {
    const searchResult: any = await firecrawlApp.search(searchQuery, searchOptions);
    
    console.log('Received raw response from Firecrawl API.');
    console.log('Firecrawl raw result:', JSON.stringify(searchResult, null, 2));

    // The API returns the job list inside a 'data' property.
    let rawJobs: any[] = [];
    if (searchResult && Array.isArray(searchResult.data)) {
        rawJobs = searchResult.data;
    } else {
      console.error('Firecrawl search returned an unexpected format. Expected a "data" array:', searchResult);
      throw new Error('Invalid response format from Firecrawl search API.');
    }
    
    console.log(`Firecrawl returned ${rawJobs.length} potential job results.`);

    const jobPostings: FirecrawlJobResult[] = rawJobs.map((job: any) => ({
      // Prioritize metadata, but fallback to root properties if metadata is missing.
      title: job.metadata?.title || job.title || 'Untitled Job Posting',
      url: job.url || '',
      // The scraped content comes from the 'markdown' property
      markdownContent: job.markdown || job.description || 'No content scraped.',
      company: job.metadata?.company || undefined,
      location: job.metadata?.location || undefined,
    }));
    
    // Validate each job posting against our schema to filter out malformed results.
    const validatedJobPostings = jobPostings.filter(job => {
      try {
        FirecrawlJobResultSchema.parse(job);
        return true;
      } catch (e) {
        console.warn("Filtered out invalid job posting from Firecrawl:", job, e);
        return false;
      }
    });

    return { jobPostings: validatedJobPostings };

  } catch (error) {
    console.error('--- Firecrawl Search Failed ---');
    // Log the entire error object to get more details
    console.error('Full error object:', JSON.stringify(error, null, 2));
    
    let errorMessage = 'An unknown error occurred during the job search.';
    // Check if the error object has response data from the API
    if (error && typeof error === 'object' && 'response' in error) {
        const responseError = error.response as any;
        if (responseError.data && responseError.data.error) {
            errorMessage = `Firecrawl API Error: ${responseError.data.error}`;
        } else {
            errorMessage = `Request failed with status code ${responseError.status || 'unknown'}.`;
        }
    } else if (error instanceof Error) {
        errorMessage = error.message;
    }

    throw new Error(`Firecrawl search failed: ${errorMessage}`);
  }
}
