
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

// TODO: Move API Key to an environment variable for security and configuration flexibility.
// For example, process.env.FIRECRAWL_API_KEY
const FIRECRAWL_API_KEY = 'fc-05948e6ee9d1492d8baa23c55717652b'; 

const FirecrawlSearchInputSchema = z.object({
  keywords: z.string().describe("Keywords for the job search, e.g., 'qualitative research assistant', 'software engineer'."),
  location: z.string().describe("Location for the job search, e.g., 'england', 'California', 'Remote'."),
});
export type FirecrawlSearchInput = z.infer<typeof FirecrawlSearchInputSchema>;

const FirecrawlJobResultSchema = z.object({
  url: z.string().url().describe("Direct URL to the job posting."),
  title: z.string().optional().describe("Title of the job posting, if available from search metadata."),
  markdownContent: z.string().describe("The scraped content of the job posting in Markdown format."),
  // Other potential fields from Firecrawl's result object if useful, e.g., source, description
  // For now, focusing on the core scraped content and URL.
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
      console.error("Firecrawl API key is not configured.");
      throw new Error("Firecrawl API key is missing. Cannot perform search.");
    }

    const firecrawlApp = new FireCrawlApp({ apiKey: FIRECRAWL_API_KEY });
    const searchPrompt = `search ${input.keywords} jobs in ${input.location}, give me the link and details, salary, deadline`;

    try {
      const searchResults = await firecrawlApp.search(searchPrompt, {
        limit: 7, // Limit to 7 results for now
        // If Firecrawl has a specific location parameter, use it. 
        // The example shows passing location in the query string, which is what we're doing.
        // location: input.location, // This might be a specific parameter for Firecrawl if available
        scrapeOptions: {
          formats: ["markdown"], // Request content in Markdown format
          // Add other scrape options if needed, e.g., for including specific elements or handling JS rendering
        },
        // pageOptions: { // If we need to control how Firecrawl crawls, e.g., only specific domains (unlikely for general search)
        //   onlyMainContent: true // Tries to extract only the main content of the page
        // }
      });
      
      // The `searchResults` from firecrawlApp.search is an array of objects.
      // Each object typically has `markdown`, `url`, and potentially `title`, `description`, etc.
      // We need to map this to our FirecrawlJobResultSchema.
      const mappedJobs = searchResults.map((result: any) => {
        return {
          url: result.url || '',
          title: result.title || (result.markdown ? result.markdown.substring(0,100).split('\n')[0] : 'Untitled Job'), // Fallback title from markdown
          markdownContent: result.markdown || 'No content scraped.',
        };
      }).filter(job => job.url); // Ensure there's a URL

      return { jobs: mappedJobs };

    } catch (error) {
      console.error("Error during Firecrawl search:", error);
      // It's important to return a valid structure even on error, or throw a specific error.
      // For now, let's return an empty list, but in production, more robust error handling is needed.
      let message = 'Failed to search for jobs using Firecrawl.';
      if (error instanceof Error) {
        message = `Firecrawl search failed: ${error.message}`;
      }
      // Propagate the error so the client can handle it.
      throw new Error(message);
    }
  }
);
