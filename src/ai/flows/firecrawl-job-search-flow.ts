
'use server';
/**
 * @fileOverview Genkit flow to search for jobs using Firecrawl's search API with scraping.
 *
 * - searchJobsWithFirecrawl - A function that performs a job search.
 * - FirecrawlSearchInput - The input type for the function (from lib/schemas).
 * - FirecrawlSearchOutput - The return type for the function (from lib/schemas).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import FireCrawlApp from '@mendable/firecrawl-js';
import type { FirecrawlSearchInput, FirecrawlSearchOutput, FirecrawlJobResult } from '@/lib/schemas';

// Ensure the API key is loaded from environment variables
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

export async function searchJobsWithFirecrawl(
  input: FirecrawlSearchInput
): Promise<FirecrawlSearchOutput> {
  return firecrawlJobSearchFlow(input);
}

// Interface for the raw search result item from Firecrawl's search method
// Based on OpenAPI spec and observed behavior when scraping is enabled.
interface FirecrawlRawSearchResultItem {
  title?: string;
  description?: string; // Search result snippet
  url?: string;
  markdown?: string | null; // Scraped markdown content
  html?: string | null;
  rawHtml?: string | null;
  links?: string[];
  screenshot?: string | null;
  metadata?: {
    title?: string;
    description?: string; // Metadata description, might differ from search snippet
    sourceURL?: string;
    statusCode?: number;
    error?: string | null;
  };
  [key: string]: any; // For any other fields
}

const firecrawlJobSearchFlow = ai.defineFlow(
  {
    name: 'firecrawlJobSearchFlow',
    inputSchema: z.object({ // Matches FirecrawlSearchInput from lib/schemas.ts
        keywords: z.string().describe("Keywords for the job search, e.g., 'qualitative research assistant', 'software engineer'."),
        location: z.string().describe("Location for the job search, e.g., 'england', 'California', 'Remote'."),
    }),
    outputSchema: z.object({ // Matches FirecrawlSearchOutput from lib/schemas.ts
        jobs: z.array(z.object({
            url: z.string().url().optional(),
            title: z.string(),
            markdownContent: z.string().optional(),
            company: z.string().optional(),
            location: z.string().optional(),
        })),
    }),
  },
  async (input): Promise<FirecrawlSearchOutput> => {
    if (!FIRECRAWL_API_KEY) {
      console.error("Firecrawl API key is not configured in environment variables (FIRECRAWL_API_KEY).");
      throw new Error("Firecrawl API key is missing. Cannot perform search.");
    }

    const firecrawlApp = new FireCrawlApp({ apiKey: FIRECRAWL_API_KEY });
    
    // Construct the query string as per the user's Python example structure
    const searchQuery = `"${input.keywords}" jobs in "${input.location}"`;

    const searchOptions = {
      limit: 7, // Fetch a few results
      scrapeOptions: {
        formats: ["markdown"] as ("markdown" | "html" | "rawHtml" | "links" | "screenshot" | "screenshot@fullPage" | "json")[] 
      }
    };

    console.log("Attempting Firecrawl search with Query:", searchQuery);
    console.log("Search Options:", JSON.stringify(searchOptions, null, 2));

    try {
      // app.search() should return an array of results or throw.
      const searchResults: FirecrawlRawSearchResultItem[] = await firecrawlApp.search(searchQuery, searchOptions);
      
      if (!searchResults || !Array.isArray(searchResults)) {
        console.warn("Firecrawl search returned unexpected data format or no results:", searchResults);
        return { jobs: [] };
      }

      const mappedJobs: FirecrawlJobResult[] = searchResults.map(job => {
        // Prefer metadata.title if available and more complete, otherwise use job.title
        const jobTitle = job.metadata?.title || job.title || "Untitled Job";
        // Company and location are not directly provided by the /search endpoint's top-level item structure.
        // They might be part of the title or within the scraped markdown.
        // We leave them as undefined for now, and the UI can handle their absence.
        const companyName = undefined; 
        const jobLocation = undefined;

        return {
          title: jobTitle,
          url: job.url, 
          markdownContent: job.markdown || job.description, // Use scraped markdown if available, else fallback to search snippet
          company: companyName,
          location: jobLocation,
        };
      }).filter(job => job.url && job.title); // Ensure basic job info is present

      return { jobs: mappedJobs };

    } catch (error) {
      console.error("Error during Firecrawl search. Input provided:", JSON.stringify(input, null, 2));
      console.error("Full error object from Firecrawl SDK:", error);

      let message = 'Failed to search for job data using Firecrawl.';
      if (error instanceof Error) {
        message = `Firecrawl search failed: ${error.message}`; 
      }
      
      // Check for more specific error details if available
      // The Firecrawl SDK might wrap the actual API error response.
      if (error && typeof (error as any).response === 'object' && (error as any).response && 
          typeof (error as any).response.data === 'object' && (error as any).response.data && 
          typeof (error as any).response.data.error === 'string') {
        message = `Firecrawl API error: ${(error as any).response.data.error}`;
      } else if (error && typeof (error as any).error === 'string') { // Sometimes error is directly on the error object
        message = `Firecrawl error: ${(error as any).error}`;
      }

      throw new Error(message);
    }
  }
);
