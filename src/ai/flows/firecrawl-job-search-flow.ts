
'use server';
/**
 * @fileOverview Genkit flow to search for jobs using Firecrawl's extract API.
 *
 * - searchJobsWithFirecrawl - A function that performs a job search via extraction.
 * - FirecrawlSearchInput - The input type for the function.
 * - FirecrawlSearchOutput - The return type for the function (defined in lib/schemas).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import FireCrawlApp from '@mendable/firecrawl-js';
import type { FirecrawlSearchInput, FirecrawlSearchOutput } from '@/lib/schemas'; // Import our application-specific output type

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

// Zod schema for Firecrawl's app.extract() method's `schema` parameter
const FirecrawlExtractSchema = z.object({
  jobs: z.array(z.object({
    title: z.string().describe("The job title."),
    company: z.string().optional().describe("The name of the company."),
    location: z.string().optional().describe("The location of the job."),
    description: z.string().optional().describe("A brief description of the job."),
    apply_link: z.string().url().optional().describe("The direct application link for the job.")
  }))
});
type FirecrawlExtractResultType = z.infer<typeof FirecrawlExtractSchema>;


export async function searchJobsWithFirecrawl(
  input: FirecrawlSearchInput
): Promise<FirecrawlSearchOutput> { // Returns our application-specific output type
  return firecrawlJobExtractFlow(input);
}

const firecrawlJobExtractFlow = ai.defineFlow(
  {
    name: 'firecrawlJobExtractFlow', // Renamed flow to reflect new method
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
    
    const dynamicPrompt = `Search for job listings related to "${input.keywords}" in "${input.location}". For each job found, extract the job title, company name, location, a brief description, and the application link if available. Focus on distinct job opportunities.`;

    console.log("Attempting Firecrawl extract with prompt:", dynamicPrompt);
    console.log("Targeting URL pattern: https://google.com/*");

    try {
      // Firecrawl's extract method returns any[] according to some typings, 
      // or could return the schema type directly if only one URL and successful.
      // We expect it to return an array of results, where each result conforms to the schema if a URL pattern is used.
      const extractCallResult: any = await firecrawlApp.extract(
        ["https://google.com/*"], 
        {
          prompt: dynamicPrompt,
          schema: FirecrawlExtractSchema, // Pass the Zod schema to Firecrawl
          mode: 'llm-extraction', // Recommended mode for schema-based extraction
          extractionOptions: { // Consistent with Python ScrapeOptions(formats)
            formats: ["markdown"] // Request markdown to populate description if it's richer
          },
          pageOptions: { // Options for the initial search/crawl phase
             maxPagesToCrawl: 3, // Limit pages from google.com/* to speed up and focus
             maxDepth: 1, // Only scrape initial search results
          }
        }
      );
      
      let extractedJobsData: z.infer<typeof FirecrawlExtractSchema.shape.jobs> = [];

      // Process the result from firecrawlApp.extract()
      // It's an array, results are per URL. Since we use one pattern, expect one main result object.
      if (extractCallResult && Array.isArray(extractCallResult) && extractCallResult.length > 0) {
        const firstResult = extractCallResult[0]; // This object should match our FirecrawlExtractSchema
        if (firstResult && typeof firstResult === 'object' && 'jobs' in firstResult && Array.isArray(firstResult.jobs)) {
          extractedJobsData = firstResult.jobs;
        } else {
          // If the structure is { data: { jobs: [...] } } (like scrape responses)
          if (firstResult && typeof firstResult === 'object' && 'data' in firstResult && 
              firstResult.data && typeof firstResult.data === 'object' && 'jobs' in firstResult.data && Array.isArray(firstResult.data.jobs)) {
            extractedJobsData = firstResult.data.jobs;
          } else {
            console.warn("Firecrawl extract result structure unexpected. Expected an object with a 'jobs' array in the first result element, or in its 'data' property.", JSON.stringify(extractCallResult, null, 2));
          }
        }
      } else if (extractCallResult && typeof extractCallResult === 'object' && 'jobs' in extractCallResult && Array.isArray(extractCallResult.jobs)) {
        // Fallback if extractCallResult is the direct object {jobs: [...]}
         extractedJobsData = extractCallResult.jobs;
      } else {
        console.warn("Firecrawl extract returned no data or unexpected format.", JSON.stringify(extractCallResult, null, 2));
      }


      const mappedJobs = extractedJobsData.map(job => {
        const jobTitle = job.title || "Untitled Job";
        const companyName = job.company;
        const jobLocation = job.location;
        
        let displayTitle = jobTitle;
        if (companyName) displayTitle += ` at ${companyName}`;
        if (jobLocation) displayTitle += ` in ${jobLocation}`;

        return {
          title: displayTitle,
          url: job.apply_link, 
          markdownContent: job.description, // Use description as markdown content
          company: companyName,
          location: jobLocation,
        };
      });

      return { jobs: mappedJobs };

    } catch (error) {
      console.error("Error during Firecrawl extract. Input provided:", JSON.stringify(input, null, 2));
      console.error("Full error object from Firecrawl SDK:", error);

      let message = 'Failed to extract job data using Firecrawl.';
      if (error instanceof Error) {
        message = `Firecrawl extract failed: ${error.message}`; 
      }
      
      // Check for more specific error details if available from Firecrawl response
      if (error && typeof (error as any).response === 'object' && (error as any).response && 
          typeof (error as any).response.data === 'object' && (error as any).response.data && 
          typeof (error as any).response.data.error === 'string') {
        message = `Firecrawl API error: ${(error as any).response.data.error}`;
      } else if (error instanceof Error && !message.toLowerCase().includes("request failed with status code 500")) { 
         message = `Firecrawl extract failed: ${error.message}`;
      }

      throw new Error(message);
    }
  }
);
