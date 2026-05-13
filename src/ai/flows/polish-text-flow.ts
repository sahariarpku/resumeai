
'use server';
/**
 * @fileOverview AI flow to polish a given text for professional impact.
 *
 * - polishText - A function that takes a text string and returns a polished version.
 * - PolishTextInput - The input type for the polishText function.
 * - PolishTextOutput - The return type for the polishText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {polishTextSchema, polishTextOutputSchema, PolishTextSchema, PolishTextOutputSchema} from '@/lib/schemas';

export type PolishTextInput = PolishTextSchema;
export type PolishTextOutput = PolishTextOutputSchema;

export async function polishText(
  input: PolishTextInput
): Promise<PolishTextOutput> {
  return polishTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'polishTextPrompt',
  input: {schema: polishTextSchema},
  output: {schema: polishTextOutputSchema},
  prompt: `You are an expert resume and professional writing assistant.
Your task is to polish the following text to make it more concise, impactful, and professional, suitable for a resume or professional profile.
Focus on using strong action verbs, quantifiable achievements if possible, and clear, professional language. Remove any fluff or overly casual phrasing.

Original Text:
{{{textToPolish}}}

Polished Text:
`,
});

const polishTextFlow = ai.defineFlow(
  {
    name: 'polishTextFlow',
    inputSchema: polishTextSchema,
    outputSchema: polishTextOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output?.polishedText) {
      // Fallback if AI doesn't return expected output
      console.error("AI did not return polished text.");
      return { polishedText: input.textToPolish }; // Return original text as fallback
    }
    return output;
  }
);
