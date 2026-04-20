// src/ai/flows/tailor-resume-to-job-description.ts
'use server';

/**
 * @fileOverview AI flow to tailor a resume to a specific job description.
 *
 * - tailorResumeToJobDescription - A function that tailors the resume based on the job description.
 * - TailorResumeToJobDescriptionInput - The input type for the tailorResumeToJobDescription function.
 * - TailorResumeToJobDescriptionOutput - The return type for the tailorResumeToJobDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TailorResumeToJobDescriptionInputSchema = z.object({
  resume: z.string().describe('The resume content as a string.'),
  jobDescription: z.string().describe('The job description to tailor the resume to.'),
});

export type TailorResumeToJobDescriptionInput = z.infer<
  typeof TailorResumeToJobDescriptionInputSchema
>;

const TailorResumeToJobDescriptionOutputSchema = z.object({
  tailoredResume: z.string().describe('The tailored resume content.'),
  analysis: z.string().describe('An analysis of the resume and its match to the job description.'),
});

export type TailorResumeToJobDescriptionOutput = z.infer<
  typeof TailorResumeToJobDescriptionOutputSchema
>;

export async function tailorResumeToJobDescription(
  input: TailorResumeToJobDescriptionInput
): Promise<TailorResumeToJobDescriptionOutput> {
  return tailorResumeToJobDescriptionFlow(input);
}

const tailorResumeToJobDescriptionPrompt = ai.definePrompt({
  name: 'tailorResumeToJobDescriptionPrompt',
  input: {schema: TailorResumeToJobDescriptionInputSchema},
  output: {schema: TailorResumeToJobDescriptionOutputSchema},
  prompt: `You are an expert resume writer and career advisor. Your goal is to tailor a user's resume to a specific job description.

  Here is the user's resume:
  {{resume}}

  Here is the job description:
  {{jobDescription}}

  Analyze the job description and identify the key skills and experiences the employer is looking for.  Then, rewrite the resume to highlight those skills and experiences.  Provide a detailed analysis explaining what changes you made and why, focusing on how the tailored resume better aligns with the job description. Make sure the tailored resume is ATS-optimized.
  Return the tailored resume and the analysis.
  `,
});

const tailorResumeToJobDescriptionFlow = ai.defineFlow(
  {
    name: 'tailorResumeToJobDescriptionFlow',
    inputSchema: TailorResumeToJobDescriptionInputSchema,
    outputSchema: TailorResumeToJobDescriptionOutputSchema,
  },
  async input => {
    const {output} = await tailorResumeToJobDescriptionPrompt(input);
    return output!;
  }
);
