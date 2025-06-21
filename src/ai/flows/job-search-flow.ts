
'use server';
/**
 * @fileOverview Genkit flow to perform a job search using a direct Firecrawl API call.
 *
 * - jobSearch - A function that performs the job search using a natural language prompt.
 * - JobSearchInput - The input type for the function.
 * - JobSearchOutput - The return type for the function.
 */
import { ai } from '@/ai/genkit';
import { JobSearchInputSchema, JobSearchOutputSchema } from '@/lib/schemas';
import type { JobSearchInput, JobSearchOutput, JobExtractionResult } from '@/lib/schemas';

export type { JobSearchInput, JobSearchOutput };

export const jobSearch = ai.defineFlow(
  {
    name: 'jobSearchFlow',
    inputSchema: JobSearchInputSchema,
    outputSchema: JobSearchOutputSchema,
  },
  async (input) => {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      throw new Error('FIRECRAWL_API_KEY is not set in the environment variables.');
    }

    try {
      console.log(`--- Calling Firecrawl Search API with prompt: "${input.prompt}" ---`);
      
      const response = await fetch('https://api.firecrawl.dev/v0/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ 
          query: input.prompt,
          pageOptions: {
            fetchPageContent: true // Ensure we get markdown content
          },
          searchOptions: {
            limit: 12 // Fetch a reasonable number of results
          }
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('--- Firecrawl Search API Request Failed ---');
        console.error(`Status: ${response.status}, Body: ${errorBody}`);
        throw new Error(`Request failed with status code ${response.status}.`);
      }

      const searchResult = await response.json();
      console.log('--- Firecrawl Search API Success ---');

      if (!searchResult || !searchResult.data || !Array.isArray(searchResult.data)) {
        console.error('Firecrawl search returned an unexpected format:', searchResult);
        throw new Error('Invalid response format from Firecrawl search API.');
      }
      
      // Map the raw result to our defined JobExtractionResult schema
      const jobs: JobExtractionResult[] = searchResult.data.map((item: any) => {
        return {
          title: item.name || 'Untitled Job Posting',
          url: item.url || undefined,
          markdown: item.markdown || item.content || 'No description extracted.',
          // The search API does not consistently provide company/location, so we leave them optional
          company: item.company || undefined, 
          location: item.location || undefined,
        }
      }).filter(job => job.title && job.url); // Filter out any potentially invalid results

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
