
'use server';
/**
 * @fileOverview AI flow to select the best job RSS feed based on a user's prompt.
 *
 * - selectJobFeed - A function that handles the feed selection process.
 * - SelectJobFeedInput - The input type for the selectJobFeed function.
 * - SelectJobFeedOutput - The return type for the selectJobFeed function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { RssFeed } from '@/lib/types';

const RssFeedSchemaForAI = z.object({
  name: z.string(),
  url: z.string(),
  type: z.string(),
  category: z.string().optional(),
  categoryDetail: z.string(),
});

const SelectJobFeedInputSchema = z.object({
  userPrompt: z
    .string()
    .describe("The user's natural language description of the job they want."),
  availableFeeds: z
    .array(RssFeedSchemaForAI)
    .describe(
      'A list of available RSS feeds with their names, URLs, and categories.'
    ),
});
export type SelectJobFeedInput = z.infer<typeof SelectJobFeedInputSchema>;

const SelectJobFeedOutputSchema = z.object({
  selectedFeedUrl: z
    .string()
    .describe(
      "The single best URL from the availableFeeds that matches the user's prompt."
    ),
  reasoning: z
    .string()
    .optional()
    .describe('A brief explanation for why this feed was chosen.'),
});
export type SelectJobFeedOutput = z.infer<typeof SelectJobFeedOutputSchema>;

export async function selectJobFeed(
  input: SelectJobFeedInput
): Promise<SelectJobFeedOutput> {
  return selectJobFeedFlow(input);
}

const prompt = ai.definePrompt({
  name: 'selectJobFeedPrompt',
  input: { schema: SelectJobFeedInputSchema },
  output: { schema: SelectJobFeedOutputSchema },
  prompt: `You are an expert job search assistant. Your task is to analyze the user's job search request and select the single most relevant RSS feed URL from the provided list.

User Request: "{{userPrompt}}"

Consider the user's specified job title, seniority, location, and subject area. Match these against the name, category, and type of the available feeds to find the best fit.

For example:
- If the user asks for "Computer Science jobs in London", the feed named "London" or "Computer Science" would be a good choice. Prioritize location if specified. If both a general "Computer Science" feed and a specific "Software Engineering" feed are available and the user asks for "software engineer", choose the more specific one.
- If the user asks for "entry-level marketing jobs", look for a feed related to "Marketing" or "Professional/Managerial" job levels.

Available RSS Feeds:
{{#each availableFeeds}}
- Name: {{name}}
  - Category: {{category}}
  - Type: {{type}}
  - URL: {{url}}
{{/each}}

Based on the user's request, choose the single best URL from the list above and provide it in the 'selectedFeedUrl' field.
Also provide a brief reasoning for your choice. If no specific feed is a great match, select the general "All Jobs (General)" feed.
`,
});

const selectJobFeedFlow = ai.defineFlow(
  {
    name: 'selectJobFeedFlow',
    inputSchema: SelectJobFeedInputSchema,
    outputSchema: SelectJobFeedOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output?.selectedFeedUrl) {
      // Fallback logic
      console.error('AI could not select a feed. Falling back to general feed.');
      const generalFeed = input.availableFeeds.find(
        (f) => f.name === 'All Jobs (General)'
      );
      return {
        selectedFeedUrl:
          generalFeed?.url || 'https://www.jobs.ac.uk/?format=rss', // A safe general fallback
        reasoning:
          'Could not determine a specific feed, so the general "All Jobs" feed was selected.',
      };
    }
    return output;
  }
);
