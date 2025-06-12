'use server';
/**
 * @fileOverview AI flow to extract job title and company name from a job description.
 *
 * - extractJobDetails - A function that extracts job title and company name.
 * - ExtractJobDetailsInput - The input type for the extractJobDetails function.
 * - ExtractJobDetailsOutput - The return type for the extractJobDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractJobDetailsInputSchema = z.object({
  jobDescriptionText: z
    .string()
    .describe('The full text content of the job description.'),
});
export type ExtractJobDetailsInput = z.infer<
  typeof ExtractJobDetailsInputSchema
>;

const ExtractJobDetailsOutputSchema = z.object({
  jobTitle: z
    .string()
    .describe('The extracted job title. Returns an empty string if not found.'),
  companyName: z
    .string()
    .describe('The extracted company name. Returns an empty string if not found.'),
});
export type ExtractJobDetailsOutput = z.infer<
  typeof ExtractJobDetailsOutputSchema
>;

export async function extractJobDetails(
  input: ExtractJobDetailsInput
): Promise<ExtractJobDetailsOutput> {
  return extractJobDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractJobDetailsPrompt',
  input: {schema: ExtractJobDetailsInputSchema},
  output: {schema: ExtractJobDetailsOutputSchema},
  prompt: `You are an expert HR assistant. Your task is to carefully read the following job description and extract the specific job title and the company name.

Job Description:
{{{jobDescriptionText}}}

Extract the job title and company name. Provide the jobTitle and companyName in the output. If a field cannot be reliably extracted, provide an empty string for that field. Be precise.
`,
});

const extractJobDetailsFlow = ai.defineFlow(
  {
    name: 'extractJobDetailsFlow',
    inputSchema: ExtractJobDetailsInputSchema,
    outputSchema: ExtractJobDetailsOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    // Ensure output always matches the schema, providing empty strings if LLM fails
    return {
        jobTitle: output?.jobTitle || '',
        companyName: output?.companyName || '',
    };
  }
);
