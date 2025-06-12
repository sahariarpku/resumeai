
'use server';
/**
 * @fileOverview AI flow to calculate the match score between a user's profile and a job description.
 *
 * - calculateProfileJdMatch - A function that calculates the match score.
 * - CalculateProfileJdMatchInput - The input type for the function.
 * - CalculateProfileJdMatchOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CalculateProfileJdMatchInputSchema = z.object({
  profileText: z
    .string()
    .describe("The user's full resume or professional profile text."),
  jobDescriptionText: z
    .string()
    .describe('The full text of the job description.'),
});
export type CalculateProfileJdMatchInput = z.infer<
  typeof CalculateProfileJdMatchInputSchema
>;

const CalculateProfileJdMatchOutputSchema = z.object({
  matchPercentage: z
    .number()
    .min(0)
    .max(100)
    .describe('A numerical match score from 0 to 100%.'),
  matchSummary: z
    .string()
    .describe(
      'A brief summary explaining the match, highlighting 2-3 key matching skills/experiences and 1-2 key gaps.'
    ),
  matchCategory: z
    .enum(['Excellent Match', 'Good Match', 'Fair Match', 'Poor Match'])
    .describe('A categorical assessment of the match.'),
});
export type CalculateProfileJdMatchOutput = z.infer<
  typeof CalculateProfileJdMatchOutputSchema
>;

export async function calculateProfileJdMatch(
  input: CalculateProfileJdMatchInput
): Promise<CalculateProfileJdMatchOutput> {
  return calculateProfileJdMatchFlow(input);
}

const prompt = ai.definePrompt({
  name: 'calculateProfileJdMatchPrompt',
  input: {schema: CalculateProfileJdMatchInputSchema},
  output: {schema: CalculateProfileJdMatchOutputSchema},
  prompt: `You are an expert career advisor and resume analyst. Your task is to meticulously compare the provided user profile/resume text against a job description and assess the match.

User Profile/Resume:
\`\`\`text
{{{profileText}}}
\`\`\`

Job Description:
\`\`\`text
{{{jobDescriptionText}}}
\`\`\`

Based on this comparison, provide:
1.  A numerical match percentage (0-100%). Consider skills, years of experience mentioned, keywords, and overall alignment of the profile to the job requirements. Be critical and realistic.
2.  A brief summary (2-4 sentences) explaining the match. Highlight 2-3 key strengths or matching points from the profile that align well with the job description, and 1-2 key areas where the profile might be lacking or could be improved for this specific role.
3.  A match category: "Excellent Match", "Good Match", "Fair Match", or "Poor Match".

Output these in the specified JSON format. Be precise and constructive in your summary.
`,
});

const calculateProfileJdMatchFlow = ai.defineFlow(
  {
    name: 'calculateProfileJdMatchFlow',
    inputSchema: CalculateProfileJdMatchInputSchema,
    outputSchema: CalculateProfileJdMatchOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
        // Fallback or error handling if the LLM doesn't return expected output
        // This is crucial for production to avoid crashes.
        // For now, we'll throw an error, but a more graceful fallback could be implemented.
        console.error("AI did not return expected output for profile-JD match.");
        return {
            matchPercentage: 0,
            matchSummary: "Could not determine match. The AI model did not provide a valid response.",
            matchCategory: "Poor Match" // Default to Poor Match
        };
    }
    return output;
  }
);

    