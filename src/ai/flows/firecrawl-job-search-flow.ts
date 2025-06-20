
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

  const searchQuery = input.keywords;

  // Location and other parameters go into the options object.
  const searchOptions = {
    limit: 7,
    location: input.location,
    scrapeOptions: {
      formats: ['markdown' as const],
    },
  };

  console.log('--- Firecrawl Search ---');
  console.log('Search Query:', searchQuery);
  console.log('Search Options:', JSON.stringify(searchOptions, null, 2));

  try {
    const searchResult: any = await firecrawlApp.search(searchQuery, searchOptions);
    
    console.log('Firecrawl raw result:', JSON.stringify(searchResult, null, 2));

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

    const jobPostings: FirecrawlJobResult[] = rawJobs.map((job: any) => ({
      title: job.metadata?.title || job.title || 'Untitled Job Posting',
      url: job.url || '',
      markdownContent: job.markdown || job.description || 'No content scraped.',
      company: job.metadata?.company || undefined,
      location: job.metadata?.location || undefined,
    }));
    
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
    throw new Error(`Firecrawl search failed: ${errorMessage}`);
  }
}
