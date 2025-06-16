
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

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

export async function searchJobsWithFirecrawl(
  input: FirecrawlSearchInput
): Promise<FirecrawlSearchOutput> {
  return firecrawlJobSearchFlow(input);
}

// Define the expected structure of a single job item from Firecrawl's search response when scraping
// This is based on their OpenAPI for the /search endpoint response data array items.
interface FirecrawlRawSearchResultItem {
  title?: string;
  description?: string; // This is usually a short snippet from search, not the full scraped content
  url?: string;
  markdown?: string | null; // This is where the scraped markdown content will be
  html?: string | null;
  rawHtml?: string | null;
  links?: string[];
  screenshot?: string | null;
  metadata?: {
    title?: string;
    description?: string;
    sourceURL?: string;
    statusCode?: number;
    error?: string | null;
  };
  // Other potential fields from Firecrawl's actual response
  [key: string]: any;
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
            company: z.string().optional(), // Retain these for potential future enhancement if extractable
            location: z.string().optional(), // Retain these
        })),
    }),
  },
  async (input): Promise<FirecrawlSearchOutput> => {
    if (!FIRECRAWL_API_KEY) {
      console.error("Firecrawl API key is not configured in environment variables (FIRECRAWL_API_KEY).");
      throw new Error("Firecrawl API key is missing. Cannot perform search.");
    }

    const firecrawlApp = new FireCrawlApp({ apiKey: FIRECRAWL_API_KEY });
    
    // Construct the query string as per the Python example that worked for app.search
    const searchQuery = `find me jobs on "${input.keywords}" in "${input.location}"`;

    const searchOptions = {
      limit: 7, // Let's try fetching a few more to increase chances of good results
      scrapeOptions: {
        formats: ["markdown"] as ("markdown" | "html" | "rawHtml" | "links" | "screenshot" | "screenshot@fullPage" | "json")[] // Type assertion
      }
    };

    console.log("Attempting Firecrawl search with Query:", searchQuery);
    console.log("Search Options:", JSON.stringify(searchOptions, null, 2));

    try {
      // app.search() should return an array of results directly or throw.
      // The structure of each item in the array should match FirecrawlRawSearchResultItem
      const searchResults: FirecrawlRawSearchResultItem[] = await firecrawlApp.search(searchQuery, searchOptions);
      
      if (!searchResults || !Array.isArray(searchResults)) {
        console.warn("Firecrawl search returned unexpected data format:", searchResults);
        return { jobs: [] };
      }

      const mappedJobs: FirecrawlJobResult[] = searchResults.map(job => {
        // Prefer metadata.title if available and more complete, otherwise use job.title
        const jobTitle = job.metadata?.title || job.title || "Untitled Job";
        // For company and location, Firecrawl's /search endpoint doesn't explicitly extract these as separate fields
        // unlike a dedicated extraction schema. We'll leave them undefined for now.
        // If this information is present in job.title or job.description (snippet), it will remain there.
        const companyName = undefined; // Not directly available from /search response structure
        const jobLocation = undefined; // Not directly available from /search response structure

        let displayTitle = jobTitle;
        // We don't have separate company/location fields from /search
        // So, we won't append them here. They might be part of the job.title already.

        return {
          title: displayTitle,
          url: job.url, 
          markdownContent: job.markdown || job.description, // Use scraped markdown if available, else fallback to search description
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
      
      // Check for more specific error details if available (though 500 errors are less descriptive)
      if (error && typeof (error as any).response === 'object' && (error as any).response && 
          typeof (error as any).response.data === 'object' && (error as any).response.data && 
          typeof (error as any).response.data.error === 'string') {
        message = `Firecrawl API error: ${(error as any).response.data.error}`;
      } else if (error instanceof Error) { // Generic error message if not already specific
         if (!message.toLowerCase().includes("request failed with status code 500") && 
             !message.toLowerCase().includes("firecrawl api error")) { // Avoid duplicating "failed"
            message = `Firecrawl search failed: ${error.message}`;
         }
      }
      throw new Error(message);
    }
  }
);

