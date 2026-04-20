
'use server';
/**
 * @fileOverview AI flow to extract main textual content, specifically a job description, from an HTML string.
 *
 * - extractTextFromHtml - A function that extracts job description text from HTML.
 * - ExtractTextFromHtmlInput - The input type for the extractTextFromHtml function.
 * - ExtractTextFromHtmlOutput - The return type for the extractTextFromHtml function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractTextFromHtmlInputSchema = z.object({
  htmlContent: z
    .string()
    .describe('The full HTML content of a job posting page.'),
});
export type ExtractTextFromHtmlInput = z.infer<
  typeof ExtractTextFromHtmlInputSchema
>;

const ExtractTextFromHtmlOutputSchema = z.object({
  extractedText: z
    .string()
    .describe('The extracted plain text of the job description. Returns an empty string if no relevant text is found.'),
});
export type ExtractTextFromHtmlOutput = z.infer<
  typeof ExtractTextFromHtmlOutputSchema
>;

export async function extractTextFromHtml(
  input: ExtractTextFromHtmlInput
): Promise<ExtractTextFromHtmlOutput> {
  return extractTextFromHtmlFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractTextFromHtmlPrompt',
  input: {schema: ExtractTextFromHtmlInputSchema},
  output: {schema: ExtractTextFromHtmlOutputSchema},
  prompt: `You are an expert text extraction tool. Your task is to analyze the following HTML content and extract the main job description text.
Focus on the core details of the job, such as responsibilities, qualifications, and company information if present within the main body.
Ignore HTML tags, navigation elements, sidebars, ads, and other boilerplate content. Return only the clean, plain text of the job description.

HTML Content:
\`\`\`html
{{{htmlContent}}}
\`\`\`

Extracted Text:
`,
});

const extractTextFromHtmlFlow = ai.defineFlow(
  {
    name: 'extractTextFromHtmlFlow',
    inputSchema: ExtractTextFromHtmlInputSchema,
    outputSchema: ExtractTextFromHtmlOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return {
        extractedText: output?.extractedText || '',
    };
  }
);
