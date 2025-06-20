
'use server';
/**
 * @fileOverview Genkit flow to perform a job search using a direct fetch call to the Firecrawl API.
 *
 * - jobSearch - A function that performs the job search.
 * - JobSearchInput - The input type for the function.
 * - JobSearchOutput - The return type for the function.
 */

import { JobSearchInputSchema, JobSearchOutputSchema } from '@/lib/schemas';
import type { JobSearchInput, JobSearchOutput, JobSearchResult } from '@/lib/schemas';

export async function jobSearch(
  input: JobSearchInput
): Promise<JobSearchOutput> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error('Firecrawl API key not found in environment variables. Please check your .env file.');
  }

  // Construct the query and options to match the working curl command
  const requestBody = {
    query: `${input.keywords} jobs in ${input.location}`,
    limit: 10,
    location: input.location,
    scrapeOptions: {
      formats: ["markdown"]
    }
  };

  console.log('--- Firecrawl Direct Fetch Search ---');
  console.log('Sending request to Firecrawl API...');
  console.log('Request Body:', JSON.stringify(requestBody, null, 2));

  try {
    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error('Firecrawl API returned an error:', response.status, errorBody);
        throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
    }

    const searchResult = await response.json();
    console.log('Received raw response from Firecrawl API:', JSON.stringify(searchResult, null, 2));


    if (!searchResult || !searchResult.data || !Array.isArray(searchResult.data)) {
        console.error('Firecrawl search returned an unexpected format. Expected a "data" array:', searchResult);
        throw new Error('Invalid response format from Firecrawl search API.');
    }

    const jobs: JobSearchResult[] = searchResult.data.map((item: any) => ({
      title: item.title || 'Untitled Job Posting',
      url: item.url || '',
      markdownContent: item.markdown || item.description || 'No content scraped.',
      company: item.company || undefined,
      location: item.location || input.location,
    }));

    return { jobs };

  } catch (error) {
    console.error('--- Firecrawl Search Failed ---');
    console.error('Full error object:', error);
    
    let errorMessage = 'An unknown error occurred during the job search.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }

    throw new Error(`Job search failed: ${errorMessage}`);
  }
}
