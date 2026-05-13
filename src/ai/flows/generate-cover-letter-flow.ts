
'use server';
/**
 * @fileOverview AI flow to generate a cover letter based on a resume and job description.
 *
 * - generateCoverLetter - A function that generates the cover letter.
 * - GenerateCoverLetterInput - The input type for the function.
 * - GenerateCoverLetterOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {GenerateCoverLetterInputSchema, GenerateCoverLetterOutputSchema} from '@/lib/schemas';
import type {GenerateCoverLetterInput, GenerateCoverLetterOutput} from '@/lib/schemas';

export type {GenerateCoverLetterInput, GenerateCoverLetterOutput};

export async function generateCoverLetter(
  input: GenerateCoverLetterInput
): Promise<GenerateCoverLetterOutput> {
  return generateCoverLetterFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCoverLetterPrompt',
  input: {schema: GenerateCoverLetterInputSchema},
  output: {schema: GenerateCoverLetterOutputSchema},
  prompt: `You are an expert career advisor and professional writer. Your task is to craft a compelling and professional cover letter.
The user, {{#if userName}}{{userName}}{{else}}applicant{{/if}}, is applying for a role described in the Job Description below.
Use the provided Resume/Profile Text to highlight relevant skills and experiences that match the Job Description.

Your cover letter should:
- Be tailored specifically to the job description.
- Maintain a professional and enthusiastic tone.
- Be well-structured with an introduction, body (highlighting 2-3 key matches), and conclusion.
- Address the hiring manager or recruitment team if possible (otherwise use a general salutation).
- Express strong interest in the role and the company.
- Be concise and impactful, typically 3-4 paragraphs.
- If a user name is provided, use it for the closing. Otherwise, use a generic closing like "Sincerely".

User's Resume/Profile Text:
\`\`\`
{{{resumeText}}}
\`\`\`

Job Description:
\`\`\`
{{{jobDescriptionText}}}
\`\`\`

Generate the cover letter text.
`,
});

const generateCoverLetterFlow = ai.defineFlow(
  {
    name: 'generateCoverLetterFlow',
    inputSchema: GenerateCoverLetterInputSchema,
    outputSchema: GenerateCoverLetterOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output?.coverLetterText) {
      console.error("AI did not return expected cover letter output.");
      return { coverLetterText: "Could not generate cover letter at this time. Please try again." };
    }
    return output;
  }
);
