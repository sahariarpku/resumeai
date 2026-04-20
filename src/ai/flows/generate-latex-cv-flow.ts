
'use server';
/**
 * @fileOverview AI flow to generate LaTeX code for a CV from profile text.
 *
 * - generateLatexCv - A function that generates LaTeX CV code.
 * - GenerateLatexCvInput - The input type for the function.
 * - GenerateLatexCvOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { GenerateLatexCvInputSchema, GenerateLatexCvOutputSchema } from '@/lib/schemas';

export type GenerateLatexCvInput = z.infer<typeof GenerateLatexCvInputSchema>;
export type GenerateLatexCvOutput = z.infer<typeof GenerateLatexCvOutputSchema>;

export async function generateLatexCv(
  input: GenerateLatexCvInput
): Promise<GenerateLatexCvOutput> {
  return generateLatexCvFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateLatexCvPrompt',
  input: {schema: GenerateLatexCvInputSchema},
  output: {schema: GenerateLatexCvOutputSchema},
  prompt: `You are an expert LaTeX CV generator. Your task is to convert the provided resume text into a complete, compilable LaTeX document.
Aim for a professional and clean style, often referred to as "Oxford style" or a classic academic CV style.

Resume Text (likely Markdown-formatted):
\`\`\`
{{{profileAsText}}}
\`\`\`

User's CV Style Preference (if any): "{{#if cvStylePreference}}{{cvStylePreference}}{{else}}default professional{{/if}}"

LaTeX CV Requirements:
1.  Document Class: Use \`\\documentclass[11pt,a4paper]{article}\`.
2.  Packages: Include necessary packages like \`geometry\` (for margins, e.g., \`\\\\usepackage[left=1in, right=1in, top=1in, bottom=1in]{geometry}\`), \`titlesec\` (for section title customization), \`enumitem\` (for list customization), \`hyperref\` (for clickable links).
3.  Contact Information: Display name prominently at the top, followed by email, phone, LinkedIn, GitHub, Portfolio links if available. Use \`\\href{}{} \` for links.
4.  Section Titles: Use \`\\section*{SECTION NAME}\` for main sections (e.g., Summary, Work Experience, Education). Customize section titles using \`titlesec\` for a clean look (e.g., \`\\titleformat{\\section*}{\\Large\\bfseries}{\\thesection}{1em}{}\` and \`\\titlespacing*{\\section}{0pt}{*2}{*1}\`). Section names should be derived from the Markdown headings (e.g., "## Work Experience" becomes "\\section*{Work Experience}").
5.  Content Formatting:
    *   Work Experience: For each role, display Company, Role, Dates. Use bullet points (\`\\itemize\`) for descriptions and achievements.
    *   Education: For each degree, display Institution, Degree, Field of Study, Dates. Include GPA, Thesis, Courses if provided.
    *   Projects: For each project, display Name, Description, Technologies, Achievements. Use bullet points.
    *   Skills: Group skills by category if provided, otherwise list them.
    *   Publications/Honors/Certifications/References/Custom Sections: Format these clearly, using itemization where appropriate.
6.  Dates: Align dates to the right if possible for experience and education entries, or place them consistently.
7.  Lists: Use \`\\itemize\` for bullet points and ensure consistent indentation. Consider \`\\setlist[itemize]{leftmargin=*,label=\\textbullet}\` for tighter lists.
8.  Emphasis: Convert Markdown \`**bold**\` to \`\\textbf{bold}\` and \`*italic*\` to \`\\textit{italic}\`.
9.  Special Characters: Escape LaTeX special characters like \`%\`, \`&\`, \`#\`, \`_\` (e.g., \`\\%\`, \`\\&\`, \`\\#\`, \`\\_\`). URLs often need careful handling or the \`url\` package.
10. No Page Numbers: Use \`\\pagestyle{empty}\`.
11. Output: Provide only the raw LaTeX code as a single string in the 'latexCode' field. Ensure it's a complete document from \`\\documentclass\` to \`\\end{document}\`.

Example Structure for a Work Experience Item:
\\textbf{Software Engineer} \\hfill Jan 2020 -- Present \\\\
\\textit{Awesome Company Inc.} \\\\
\\begin{itemize}
    \\item Developed new features for X.
    \\item Led a team of Y.
\\end{itemize}

Strive for a clean, readable, and professional LaTeX output. If the 'cvStylePreference' is 'Oxford style', prioritize a classic, single-column, text-focused layout.
`,
});

const generateLatexCvFlow = ai.defineFlow(
  {
    name: 'generateLatexCvFlow',
    inputSchema: GenerateLatexCvInputSchema,
    outputSchema: GenerateLatexCvOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output?.latexCode) {
      console.error("AI did not return LaTeX code.");
      // Fallback LaTeX code or error
      const fallbackLatex = `\\documentclass[11pt,a4paper]{article}
\\\\usepackage[left=1in, right=1in, top=1in, bottom=1in]{geometry}
\\title{Resume - Error}
\\author{Error Generating CV}
\\date{}
\\pagestyle{empty}
\\begin{document}
\\maketitle
\\section*{Error}
There was an error generating the LaTeX CV content. Please check the input profile text:
\\begin{verbatim}
${input.profileAsText.substring(0, 500).replace(/[&%$#_{}~^\\]/g, '\\$&')}
...
\\end{verbatim}
\\end{document}`;
      return { latexCode: fallbackLatex };
    }
    return output;
  }
);

