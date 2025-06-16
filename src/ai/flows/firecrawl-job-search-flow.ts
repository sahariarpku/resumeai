
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
    
    // Construct the query string similar to the Python example
    // Using double quotes around keywords and location within the query string
    const searchQuery = `find me jobs on "${input.keywords}" in "${input.location}"`;
    
    // Options for the search, mirroring Python example's parameters for SDK
    const searchOptions = {
      limit: 7, // Or another reasonable limit, Python example used 5
      scrapeOptions: { // camelCase for JavaScript/TypeScript SDK
        // Explicitly type the array elements to satisfy the SDK's expected enum if necessary
        formats: ["markdown"] as ("markdown" | "html" | "rawHtml" | "links" | "screenshot" | "screenshot@fullPage" | "json")[], 
      },
      // Note: No explicit 'location' parameter here, as it's embedded in the query string.
      // timeout: 30000 // Optional: set a timeout in ms
    };

    console.log("Attempting Firecrawl search with the following parameters:");
    console.log("Search Query:", searchQuery);
    console.log("Search Options:", JSON.stringify(searchOptions, null, 2));

    try {
      // Call the search method with the query and options
      const searchResults = await firecrawlApp.search(searchQuery, searchOptions);
      
      const mappedJobs = searchResults.map((result: any) => {
        // The SDK might return 'title' and 'markdown' directly at the top level of each result item
        // or within a 'metadata' object if scrape was successful but content is under metadata.
        // The Python example implies direct access, so we try that first.
        let title = result.title;
        let markdown = result.markdown;

        // Fallback to metadata if top-level fields are not present or empty,
        // and metadata exists
        if ((!title || !markdown) && result.metadata) {
            title = title || result.metadata.title;
            // Markdown might not be in metadata typically, but other fields like description might be
        }
        
        return {
          url: result.url || '',
          title: title || (markdown ? markdown.substring(0,100).split('\n')[0] : 'Untitled Job'),
          markdownContent: markdown || 'No content scraped.',
        };
      }).filter(job => job.url); 

      return { jobs: mappedJobs };

    } catch (error) {
      console.error("Error during Firecrawl search. Input provided:", JSON.stringify(input, null, 2));
      console.error("Full error object from Firecrawl SDK:", error);

      let message = 'Failed to search for jobs using Firecrawl.';
      if (error instanceof Error) {
        message = `Firecrawl search failed: ${error.message}`; 
      }
      
      if (error && typeof (error as any).response === 'object' && (error as any).response && typeof (error as any).response.data === 'object' && (error as any).response.data && typeof (error as any).response.data.error === 'string') {
        message = `Firecrawl API error: ${(error as any).response.data.error}`;
      } else if (error instanceof Error && !message.toLowerCase().includes("request failed with status code 500")) { 
         message = `Firecrawl search failed: ${error.message}`;
      }

      throw new Error(message);
    }
  }
);

