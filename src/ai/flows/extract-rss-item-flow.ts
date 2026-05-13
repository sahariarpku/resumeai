
'use server';
/**
 * @fileOverview AI flow to extract structured job details from a single RSS feed <item> XML.
 *
 * - extractJobDetailsFromRssItem - A function that extracts job details.
 * - ExtractRssItemInput - The input type for the function.
 * - ExtractRssItemOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {
  ExtractRssItemInputSchema,
  ExtractRssItemOutputSchema,
} from '@/lib/schemas';
import type {
  ExtractRssItemInput,
  ExtractRssItemOutput,
} from '@/lib/schemas';

export type {ExtractRssItemInput, ExtractRssItemOutput};

export async function extractJobDetailsFromRssItem(
  input: ExtractRssItemInput
): Promise<ExtractRssItemOutput> {
  return extractRssItemDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractRssItemDetailsPrompt',
  input: {schema: ExtractRssItemInputSchema},
  output: {schema: ExtractRssItemOutputSchema},
  prompt: `You are an expert job data extractor. Given the XML content of a single job posting <item> from an RSS feed, extract the following details:
1.  'role': The job title. Look primarily in the <title> tag.
2.  'company': The name of the employer. Look for <dc:creator>, <jobs:employer_name>, or infer from the text if necessary.
3.  'requirementsSummary': A concise summary of the job's key responsibilities, skills, and qualifications. Extract this from the <description> tag. If the description contains HTML, extract the textual content. Try to summarize the main responsibilities and qualifications.
4.  'deadlineText': The application deadline. Look for phrases like "Closing Date:" within the <description> or other relevant date tags. If no explicit deadline is found, use the content of the <pubDate> tag, formatted as "Posted on: [Date from pubDate]".
5.  'location': The job location. Look for tags like <jobs:location_options> or infer from the text content (e.g. within the title or description). If multiple locations are mentioned, you can list them.
6.  'jobUrl': The direct URL to the job posting. Extract this from the <link> tag. Ensure this is a complete and valid-looking URL.

RSS Item XML:
\`\`\`xml
{{{rssItemXml}}}
\`\`\`

Provide the extracted information in the specified JSON format. Be precise. If a field cannot be reliably extracted, provide an empty string for that field or a sensible default (e.g., for deadlineText based on pubDate).
For requirementsSummary, provide a textual summary even if the input description contains HTML. Keep the summary concise, focusing on the core aspects of the job.
`,
});

const extractRssItemDetailsFlow = ai.defineFlow(
  {
    name: 'extractRssItemDetailsFlow',
    inputSchema: ExtractRssItemInputSchema,
    outputSchema: ExtractRssItemOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      console.error("AI did not return expected output for RSS item parsing.");
      // Fallback to ensure the function returns something matching the schema
      return {
        role: '',
        company: '',
        requirementsSummary: 'Could not parse job details from RSS item.',
        deadlineText: '',
        location: '',
        jobUrl: '',
      };
    }
    // Ensure all fields are present, even if empty, to match the schema
    return {
        role: output.role || '',
        company: output.company || '',
        requirementsSummary: output.requirementsSummary || 'Details not extracted.',
        deadlineText: output.deadlineText || '',
        location: output.location || '',
        jobUrl: output.jobUrl || '',
    };
  }
);
