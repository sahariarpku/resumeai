
'use server';
/**
 * @fileOverview Genkit flow to perform a job search using the Firecrawl search API.
 *
 * - jobSearch - A function that performs the job search using a natural language prompt.
 * - JobSearchInput - The input type for the function.
 * - JobSearchOutput - The return type for the function.
 */
import { ai } from '@/ai/genkit';
import { JobSearchInputSchema, JobSearchOutputSchema } from '@/lib/schemas';
import type { JobSearchInput, JobSearchOutput, JobExtractionResult } from '@/lib/schemas';
import FireCrawlApp from '@mendable/firecrawl-js';

export type { JobSearchInput, JobSearchOutput };

export const jobSearch = ai.defineFlow(
  {
    name: 'jobSearchFlow',
    inputSchema: JobSearchInputSchema,
    outputSchema: JobSearchOutputSchema,
  },
  async (input) => {
    const app = new FireCrawlApp({apiKey: process.env.FIRECRAWL_API_KEY});

    try {
      const searchResult = await app.search(input.prompt, {
        limit: 9, // Fetch a few results
        scrapeOptions: {
          // Ask for markdown as it's easier to process than raw HTML
          formats: ["markdown"]
        }
      });
      
      console.log('--- Firecrawl Search API Success ---');
      // The search result is an array of objects
      if (!searchResult || !Array.isArray(searchResult.data)) {
        console.error('Firecrawl search returned an unexpected format.');
        throw new Error('Invalid response format from Firecrawl search API.');
      }
      
      // Map the raw result to our defined JobExtractionResult schema
      const jobs: JobExtractionResult[] = searchResult.data.map((item: any) => ({
        title: item.title || 'Untitled Job Posting',
        url: item.url || undefined,
        markdown: item.markdown || 'No description extracted.',
        company: item.company || undefined, // These fields may or may not exist
        location: item.location || undefined,
      }));

      return { jobs };

    } catch (error) {
      console.error('--- Firecrawl Search Request Failed ---');
      console.error('Full error object:', error);
      
      let errorMessage = 'An unknown error occurred during the job search.';
      if (error instanceof Error) {
          errorMessage = error.message;
      }
      // Re-throw the error so the client-side can catch it
      throw new Error(`Job search failed: ${errorMessage}`);
    }
  }
);
