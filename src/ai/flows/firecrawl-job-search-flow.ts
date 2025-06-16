
'use server';
/**
 * @fileOverview Genkit flow to search for jobs using Firecrawl.
 *
 * - searchJobsWithFirecrawl - A function that performs a job search.
 * - FirecrawlSearchInput - The input type for the function.
 * - FirecrawlSearchOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import FireCrawlApp from '@mendable/firecrawl-js';

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY; 

const FirecrawlSearchInputSchema = z.object({
  keywords: z.string().describe("Keywords for the job search, e.g., 'qualitative research assistant', 'software engineer'."),
  location: z.string().describe("Location for the job search, e.g., 'england', 'California', 'Remote'."),
});
export type FirecrawlSearchInput = z.infer<typeof FirecrawlSearchInputSchema>;

const FirecrawlJobResultSchema = z.object({
  url: z.string().url().describe("Direct URL to the job posting."),
  title: z.string().optional().describe("Title of the job posting, if available from search metadata."),
  markdownContent: z.string().describe("The scraped content of the job posting in Markdown format."),
});

const FirecrawlSearchOutputSchema = z.object({
  jobs: z.array(FirecrawlJobResultSchema).describe("List of job postings found and scraped by Firecrawl."),
});
export type FirecrawlSearchOutput = z.infer<typeof FirecrawlSearchOutputSchema>;

export async function searchJobsWithFirecrawl(
  input: FirecrawlSearchInput
): Promise<FirecrawlSearchOutput> {
  return firecrawlJobSearchFlow(input);
}

const firecrawlJobSearchFlow = ai.defineFlow(
  {
    name: 'firecrawlJobSearchFlow',
    inputSchema: FirecrawlSearchInputSchema,
    outputSchema: FirecrawlSearchOutputSchema,
  },
  async (input) => {
    if (!FIRECRAWL_API_KEY) {
      console.error("Firecrawl API key is not configured in environment variables (FIRECRAWL_API_KEY).");
      throw new Error("Firecrawl API key is missing. Cannot perform search.");
    }

    const firecrawlApp = new FireCrawlApp({ apiKey: FIRECRAWL_API_KEY });
    
    // Simplify the search query to just keywords. Location is handled by the `location` option.
    const searchQuery = input.keywords;
    
    const searchOptions = {
      limit: 7, 
      location: input.location,
      scrapeOptions: {
        formats: ["markdown"], 
      },
      // timeout: 30000 // Optional: set a timeout in ms if default is too long/short
    };

    console.log("Attempting Firecrawl search with the following parameters:");
    console.log("Search Query:", searchQuery);
    console.log("Search Options:", JSON.stringify(searchOptions, null, 2));

    try {
      const searchResults = await firecrawlApp.search(searchQuery, searchOptions);
      
      const mappedJobs = searchResults.map((result: any) => {
        return {
          url: result.url || '',
          title: result.title || (result.markdown ? result.markdown.substring(0,100).split('\n')[0] : 'Untitled Job'),
          markdownContent: result.markdown || 'No content scraped.',
        };
      }).filter(job => job.url); 

      return { jobs: mappedJobs };

    } catch (error) {
      console.error("Error during Firecrawl search. Input provided:", JSON.stringify(input, null, 2));
      console.error("Full error object from Firecrawl SDK:", error);

      let message = 'Failed to search for jobs using Firecrawl.';
      if (error instanceof Error) {
        message = `Firecrawl search failed: ${error.message}`; // This usually includes "Request failed with status code 500"
      }
      
      // Attempt to extract more specific error from Firecrawl if their SDK structures it
      if (error && typeof (error as any).response === 'object' && (error as any).response && typeof (error as any).response.data === 'object' && (error as any).response.data && typeof (error as any).response.data.error === 'string') {
        message = `Firecrawl API error: ${(error as any).response.data.error}`;
      } else if (error instanceof Error && !message.includes("Request failed with status code 500")) { 
         // If we have an error.message but it's not the generic HTTP status, prefer it.
         message = `Firecrawl search failed: ${error.message}`;
      }

      throw new Error(message);
    }
  }
);

