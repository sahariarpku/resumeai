'use server';
/**
 * @fileOverview Genkit flow to perform a job search using a direct call to the Firecrawl search API.
 *
 * - jobSearch - A function that performs the job search using a natural language prompt.
 * - JobSearchInput - The input type for the function.
 * - JobSearchOutput - The return type for the function.
 */
import { JobSearchInputSchema, JobSearchOutputSchema } from '@/lib/schemas';
import type { JobSearchInput, JobSearchOutput, JobExtractionResult } from '@/lib/schemas';

export async function jobSearch(
  input: JobSearchInput
): Promise<JobSearchOutput> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error('Firecrawl API key not found in environment variables.');
  }

  const payload = {
    query: input.prompt,
    limit: 7,
    scrapeOptions: {
      formats: ["markdown"]
    }
  };

  console.log('--- Calling Firecrawl Search API ---');
  console.log('Endpoint: https://api.firecrawl.dev/v1/search');
  console.log('Payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const responseBody = await response.json();

    if (!response.ok) {
      console.error('--- Firecrawl Search API Failed ---');
      console.error('Status:', response.status);
      console.error('Response Body:', JSON.stringify(responseBody, null, 2));
      const errorMessage = responseBody?.error || `API responded with status ${response.status}`;
      throw new Error(`Job search failed: ${errorMessage}`);
    }

    console.log('--- Firecrawl Search API Success ---');
    console.log('Received raw response:', JSON.stringify(responseBody, null, 2));
    
    if (!responseBody || !Array.isArray(responseBody.data)) {
        console.error('Firecrawl search returned an unexpected format. Expected an object with a "data" array.');
        throw new Error('Invalid response format from Firecrawl search API.');
    }

    const jobs: JobExtractionResult[] = responseBody.data.map((item: any) => ({
      title: item.title || 'Untitled Job Posting',
      url: item.url || undefined,
      markdown: item.markdown || 'No description extracted.',
      company: item.company || undefined,
      location: item.location || undefined,
    }));

    return { jobs };

  } catch (error) {
    console.error('--- Firecrawl Search Request Failed ---');
    console.error('Full error object:', error);
    
    let errorMessage = 'An unknown error occurred during the job search.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }

    throw new Error(`Job search failed: ${errorMessage}`);
  }
}
