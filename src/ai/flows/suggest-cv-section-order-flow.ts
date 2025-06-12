
'use server';
/**
 * @fileOverview AI flow to suggest a new order for CV sections based on user preference.
 *
 * - suggestCvSectionOrder - A function that suggests a new section order.
 * - SuggestCvSectionOrderInput - The input type for the function.
 * - SuggestCvSectionOrderOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import { SuggestCvSectionOrderInputSchema, SuggestCvSectionOrderOutputSchema } from '@/lib/schemas';
import type { ProfileSectionKey } from '@/lib/types';
import { DEFAULT_SECTION_ORDER } from '@/lib/types';

export type SuggestCvSectionOrderInput = z.infer<typeof SuggestCvSectionOrderInputSchema>;
export type SuggestCvSectionOrderOutput = z.infer<typeof SuggestCvSectionOrderOutputSchema>;

export async function suggestCvSectionOrder(
  input: SuggestCvSectionOrderInput
): Promise<SuggestCvSectionOrderOutput> {
  return suggestCvSectionOrderFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestCvSectionOrderPrompt',
  input: {schema: SuggestCvSectionOrderInputSchema},
  output: {schema: SuggestCvSectionOrderOutputSchema},
  prompt: `You are an expert CV advisor. Your task is to reorder CV sections based on a user's preference for a specific CV type or focus.

User's Preference: "{{#if userPreference}}{{userPreference}}{{else}}General Purpose CV{{/if}}"

Current Section Order:
{{#each currentSectionOrder}}
- {{this}}
{{/each}}

Available Sections (all of these MUST be included in the output, just reordered):
{{#each availableSections}}
- {{this}}
{{/each}}

Based on the user's preference, provide a new optimal order for these sections in the 'newSectionOrder' array.
Ensure all 'availableSections' are present in 'newSectionOrder' exactly once.
Do not add or remove sections, only reorder them.

Prioritize sections as follows:
- For "academic" or "research" focus: Education, Publications, Projects, Work Experience, Skills, Honors & Awards, Certifications, References, Custom Sections.
- For "work-focused", "professional", or "chronological" focus: Work Experience, Projects, Skills, Education, Certifications, Honors & Awards, Publications, References, Custom Sections.
- For "skills-based" or "functional" focus: Skills, Projects, Work Experience, Certifications, Education, Honors & Awards, Publications, References, Custom Sections.
- For "entry-level" or "recent graduate": Education, Projects, Skills, Work Experience (if any), Certifications, Honors & Awards, Publications, References, Custom Sections.
- If the preference is unclear or "General Purpose CV", use a balanced order like: Work Experience, Education, Projects, Skills, Certifications, Honors & Awards, Publications, References, Custom Sections.

Output the 'newSectionOrder' array. You can optionally provide a brief 'reasoning'.
For example, if user preference is "academic", newSectionOrder might be ["education", "publications", "projects", "workExperiences", ...].
If user preference is "work-focused", newSectionOrder might be ["workExperiences", "projects", "skills", "education", ...].
If a section mentioned in the examples is not in 'availableSections', omit it from your suggested order for that example, but ensure all 'availableSections' are in the final output.
`,
});

const suggestCvSectionOrderFlow = ai.defineFlow(
  {
    name: 'suggestCvSectionOrderFlow',
    inputSchema: SuggestCvSectionOrderInputSchema,
    outputSchema: SuggestCvSectionOrderOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output?.newSectionOrder || output.newSectionOrder.length === 0) {
      console.warn("AI did not return a valid new section order. Falling back to default.");
      // Ensure all available sections are included in the fallback
      const fallbackOrder = DEFAULT_SECTION_ORDER.filter(s => input.availableSections.includes(s));
      const missingSections = input.availableSections.filter(s => !fallbackOrder.includes(s));
      return { newSectionOrder: [...fallbackOrder, ...missingSections] as ProfileSectionKey[], reasoning: "Fell back to default order due to AI error." };
    }

    // Validate that all available sections are present in the new order
    const receivedSections = new Set(output.newSectionOrder);
    const availableSectionsSet = new Set(input.availableSections);
    let isValid = true;
    if (receivedSections.size !== availableSectionsSet.size) {
      isValid = false;
    } else {
      for (const section of input.availableSections) {
        if (!receivedSections.has(section)) {
          isValid = false;
          break;
        }
      }
    }

    if (!isValid) {
        console.warn("AI returned an invalid section order (missing or extra sections). Falling back.");
        // Construct a valid order: AI's valid parts + missing parts from default/available
        let correctedOrder = output.newSectionOrder.filter(s => availableSectionsSet.has(s));
        const stillMissing = input.availableSections.filter(s => !correctedOrder.includes(s as ProfileSectionKey));
        correctedOrder = [...new Set([...correctedOrder, ...stillMissing])] as ProfileSectionKey[];


        // If still not quite right, use a more robust fallback
        if (correctedOrder.length !== input.availableSections.length || new Set(correctedOrder).size !== input.availableSections.length) {
            const fallbackOrder = DEFAULT_SECTION_ORDER.filter(s => input.availableSections.includes(s));
            const trulyMissingSections = input.availableSections.filter(s => !fallbackOrder.includes(s));
            correctedOrder = [...fallbackOrder, ...trulyMissingSections] as ProfileSectionKey[];
        }

        return { newSectionOrder: correctedOrder, reasoning: "AI output was corrected to include all available sections." };
    }

    return output;
  }
);
