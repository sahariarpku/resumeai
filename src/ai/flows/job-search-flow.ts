
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
    // Note: The API key is defined in the .env file and should not be hardcoded.
    const app = new FireCrawlApp({apiKey: process.env.FIRECRAWL_API_KEY});

    try {
      // Define the target sites for the job search.
      const predefinedUrls = [
        "https://jobs.ac.uk/*",  
        "https://uk.indeed.com/*",
        "https://glassdoor.co.uk/*"
      ];
      
      console.log(`--- Calling Firecrawl app.extract with prompt: "${input.prompt}" ---`);
      
      // Use the extract method with web search enabled, as per the user's working example.
      const extractResult = await app.extract(predefinedUrls, {
          prompt: input.prompt,
          enableWebSearch: true,
      });

      console.log('--- Firecrawl Extract API Success ---');
      if (!extractResult || !Array.isArray(extractResult)) {
        console.error('Firecrawl extract returned an unexpected format.');
        throw new Error('Invalid response format from Firecrawl extract API.');
      }
      
      // Map the raw result to our defined JobExtractionResult schema
      const jobs: JobExtractionResult[] = extractResult.map((item: any) => {
        // Log each raw item to help with debugging if the structure is unexpected
        console.log("Raw Firecrawl item:", item);
        return {
          title: item.title || 'Untitled Job Posting',
          url: item.url || undefined,
          // Use item.markdown or fallback to item.content for the description
          markdown: item.markdown || item.content || 'No description extracted.',
          company: item.company || undefined, 
          location: item.location || undefined,
        }
      }).filter(job => job.title && job.url); // Filter out any potentially empty or invalid results

      return { jobs };

    } catch (error) {
      console.error('--- Firecrawl Extract Request Failed ---');
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
