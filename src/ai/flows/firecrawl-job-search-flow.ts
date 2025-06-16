
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
      console.error("Firecrawl API key is not configured in environment variables (FIRECRAWL_API_KEY).");
      throw new Error("Firecrawl API key is missing. Cannot perform search.");
    }

    const firecrawlApp = new FireCrawlApp({ apiKey: FIRECRAWL_API_KEY });
    
    // Construct the query string focusing on keywords.
    // Location will be passed as a separate parameter.
    const searchQuery = `search ${input.keywords} jobs, include details like salary and application deadline if available`;
    
    console.log("Sending search to Firecrawl. Query:", searchQuery, "Location:", input.location, "Input:", input);

    try {
      // Pass location as a separate parameter in the options object
      const searchResults = await firecrawlApp.search(searchQuery, {
        limit: 7, 
        location: input.location, // Explicitly pass location here
        scrapeOptions: {
          formats: ["markdown"], 
        },
      });
      
      const mappedJobs = searchResults.map((result: any) => {
        // The Firecrawl SDK search result type might be `any` or a specific type from the lib.
        // Assuming result has `url`, `title`, and `markdown` based on previous code and typical API responses.
        return {
          url: result.url || '',
          title: result.title || (result.markdown ? result.markdown.substring(0,100).split('\n')[0] : 'Untitled Job'), // Fallback title from markdown
          markdownContent: result.markdown || 'No content scraped.',
        };
      }).filter(job => job.url); // Ensure there's a URL

      return { jobs: mappedJobs };

    } catch (error) {
      console.error("Error during Firecrawl search with input:", input, "Error:", error);
      let message = 'Failed to search for jobs using Firecrawl.';
      if (error instanceof Error) {
        message = `Firecrawl search failed: ${error.message}`;
      }
      
      if (error && typeof (error as any).response === 'object' && (error as any).response && typeof (error as any).response.data === 'object' && (error as any).response.data && typeof (error as any).response.data.error === 'string') {
        message = `Firecrawl API error: ${(error as any).response.data.error}`;
      } else if (error instanceof Error && !message.startsWith('Firecrawl search failed:')) {
         message = `Firecrawl search failed: ${error.message}`;
      }

      throw new Error(message);
    }
  }
);
