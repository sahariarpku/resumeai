import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_SECTION_ORDER, type ProfileSectionKey } from '@/lib/types';

export const maxDuration = 60;

interface ProviderConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

interface Message {
  role: 'system' | 'user';
  content: string;
}

// ─── Provider routing ─────────────────────────────────────────────────────────

function normalizeBaseUrl(baseUrl: string): string {
  // Google Gemini → use their OpenAI-compatible endpoint
  if (
    baseUrl.includes('generativelanguage.googleapis.com') &&
    !baseUrl.includes('/openai')
  ) {
    return 'https://generativelanguage.googleapis.com/v1beta/openai';
  }
  return baseUrl.replace(/\/$/, '');
}

function isAnthropic(baseUrl: string) {
  return baseUrl.includes('api.anthropic.com');
}

async function callOpenAICompat(
  messages: Message[],
  provider: ProviderConfig,
  jsonMode = true
): Promise<string> {
  const base = normalizeBaseUrl(provider.baseUrl);
  const body: Record<string, unknown> = {
    model: provider.model,
    messages,
    temperature: 0.3,
    max_tokens: 4096,
  };
  if (jsonMode) body.response_format = { type: 'json_object' };

  let res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://resumeai.app',
      'X-Title': 'ResumeForge',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok && jsonMode) {
    // Retry without json_mode for providers that don't support it
    delete body.response_format;
    res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://resumeai.app',
        'X-Title': 'ResumeForge',
      },
      body: JSON.stringify(body),
    });
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI API ${res.status}: ${text.slice(0, 300)}`);
  }
  const data = await res.json();
  return data.choices[0].message.content as string;
}

async function callAnthropic(
  system: string,
  user: string,
  provider: ProviderConfig
): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': provider.apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: provider.model,
      max_tokens: 4096,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic API ${res.status}: ${text.slice(0, 300)}`);
  }
  const data = await res.json();
  return data.content[0].text as string;
}

async function generate(
  system: string,
  user: string,
  provider: ProviderConfig,
  jsonMode = true
): Promise<string> {
  if (isAnthropic(provider.baseUrl)) {
    return callAnthropic(system, user, provider);
  }
  return callOpenAICompat(
    [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    provider,
    jsonMode
  );
}

function parseJson(text: string): unknown {
  const t = text.trim();
  try {
    return JSON.parse(t);
  } catch {}
  const block = t.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (block) {
    try {
      return JSON.parse(block[1]);
    } catch {}
  }
  const obj = t.match(/(\{[\s\S]*\})/);
  if (obj) {
    try {
      return JSON.parse(obj[1]);
    } catch {}
  }
  throw new Error('Could not parse JSON from AI response');
}

// ─── Flow handlers ────────────────────────────────────────────────────────────

async function tailorResume(input: { resume: string; jobDescription: string }, p: ProviderConfig) {
  const system = `You are an expert resume writer. Tailor the given resume to the job description.
Respond with ONLY a JSON object: {"tailoredResume": "...", "analysis": "..."}
tailoredResume: the complete tailored resume text.
analysis: 2-3 sentences explaining what was changed and why.`;
  const user = `Resume:\n${input.resume}\n\nJob Description:\n${input.jobDescription}`;
  return parseJson(await generate(system, user, p)) as { tailoredResume: string; analysis: string };
}

async function improveResume(input: { resume: string; jobDescription: string }, p: ProviderConfig) {
  const system = `You are an expert resume advisor. Provide actionable suggestions to improve the resume for the given job.
Respond with ONLY a JSON object: {"suggestions": "..."}
suggestions: detailed, actionable bullet-point suggestions as a string.`;
  const user = `Resume:\n${input.resume}\n\nJob Description:\n${input.jobDescription}`;
  return parseJson(await generate(system, user, p)) as { suggestions: string };
}

async function generateCoverLetter(
  input: { resumeText: string; jobDescriptionText: string; userName?: string },
  p: ProviderConfig
) {
  const system = `You are an expert career advisor and professional writer. Write a compelling, tailored cover letter.
Respond with ONLY a JSON object: {"coverLetterText": "..."}
The cover letter should be 3-4 paragraphs, professional, and specific to the job.
${input.userName ? `The applicant's name is ${input.userName}.` : ''}`;
  const user = `Resume:\n${input.resumeText}\n\nJob Description:\n${input.jobDescriptionText}`;
  return parseJson(await generate(system, user, p)) as { coverLetterText: string };
}

async function polishText(input: { textToPolish: string }, p: ProviderConfig) {
  const system = `You are an expert resume writing assistant. Polish the given text to be more concise, impactful, and professional. Use strong action verbs and professional language.
Respond with ONLY a JSON object: {"polishedText": "..."}`;
  const user = `Text to polish:\n${input.textToPolish}`;
  return parseJson(await generate(system, user, p)) as { polishedText: string };
}

async function calculateProfileJdMatch(
  input: { profileText: string; jobDescriptionText: string },
  p: ProviderConfig
) {
  const system = `You are an expert HR analyst. Calculate how well a candidate's profile matches a job description.
Respond with ONLY a JSON object:
{"matchPercentage": <0-100>, "matchSummary": "...", "matchCategory": "Excellent Match"|"Good Match"|"Fair Match"|"Poor Match"}
matchSummary: 2-3 sentences highlighting key matches and gaps.`;
  const user = `Profile:\n${input.profileText}\n\nJob Description:\n${input.jobDescriptionText}`;
  const result = parseJson(await generate(system, user, p)) as {
    matchPercentage: number;
    matchSummary: string;
    matchCategory: string;
  };
  // Clamp matchPercentage to 0-100
  result.matchPercentage = Math.min(100, Math.max(0, Number(result.matchPercentage) || 0));
  return result;
}

async function extractJobDetails(input: { jobDescriptionText: string }, p: ProviderConfig) {
  const system = `Extract the job title and company name from the job description.
Respond with ONLY a JSON object: {"jobTitle": "...", "companyName": "..."}
Use empty strings if a field cannot be found.`;
  const user = input.jobDescriptionText;
  return parseJson(await generate(system, user, p)) as { jobTitle: string; companyName: string };
}

async function extractTextFromHtml(input: { htmlContent: string }, p: ProviderConfig) {
  const system = `Extract the main job description text from the HTML. Remove all HTML tags, navigation, ads, and boilerplate. Return only the clean job description text.
Respond with ONLY a JSON object: {"extractedText": "..."}`;
  const user = input.htmlContent.slice(0, 20000); // Limit to avoid token overflow
  return parseJson(await generate(system, user, p)) as { extractedText: string };
}

async function suggestCvSectionOrder(
  input: {
    userPreference: string;
    currentSectionOrder: ProfileSectionKey[];
    availableSections: ProfileSectionKey[];
  },
  p: ProviderConfig
) {
  const system = `You are an expert CV advisor. Reorder CV sections based on the user's preference.
Available section keys: workExperiences, projects, education, skills, certifications, honorsAndAwards, publications, references, customSections
Respond with ONLY a JSON object: {"newSectionOrder": [...], "reasoning": "..."}
IMPORTANT: newSectionOrder MUST contain ALL sections from availableSections, no more, no less.
Priorities:
- academic/research: education, publications, projects, workExperiences, skills, honorsAndAwards, certifications, references, customSections
- work/professional/chronological: workExperiences, projects, skills, education, certifications, honorsAndAwards, publications, references, customSections
- skills-based/functional: skills, projects, workExperiences, certifications, education, honorsAndAwards, publications, references, customSections
- entry-level/graduate: education, projects, skills, workExperiences, certifications, honorsAndAwards, publications, references, customSections`;
  const user = `User preference: "${input.userPreference || 'General Purpose CV'}"
Current order: ${input.currentSectionOrder.join(', ')}
Available sections: ${input.availableSections.join(', ')}`;

  const raw = parseJson(await generate(system, user, p)) as {
    newSectionOrder: ProfileSectionKey[];
    reasoning?: string;
  };

  // Validate — all availableSections must be present exactly once
  const available = new Set(input.availableSections);
  const received = raw.newSectionOrder?.filter((s: string) => available.has(s as ProfileSectionKey)) ?? [];
  const missing = input.availableSections.filter((s) => !received.includes(s));
  const corrected = [...new Set([...received, ...missing])] as ProfileSectionKey[];

  return { newSectionOrder: corrected, reasoning: raw.reasoning ?? '' };
}

async function generateLatexCv(
  input: { profileAsText: string; cvStylePreference?: string },
  p: ProviderConfig
) {
  const system = `You are an expert LaTeX CV generator. Convert the provided resume to a complete, compilable LaTeX document.
Style: ${input.cvStylePreference || 'professional classic'}

Requirements:
- Use \\documentclass[11pt,a4paper]{article}
- Include geometry, titlesec, enumitem, hyperref packages
- Display contact info prominently at top
- Use \\section*{} for sections
- Use itemize for bullet points
- Clickable links with \\href{}{}
- Professional, clean layout

Respond with ONLY a JSON object: {"latexCode": "..."}
The latexCode value should be the complete LaTeX document as a string.`;
  const user = `Resume Text:\n${input.profileAsText}`;
  return parseJson(await generate(system, user, p)) as { latexCode: string };
}

async function extractProfileFromCv(input: { cvText: string }, p: ProviderConfig) {
  const system = `You are an expert CV parser. Extract structured information from the CV text.
Respond with ONLY a JSON object with these fields (all optional except where noted):
{
  "fullName": "", "email": "", "phone": "", "address": "", "linkedin": "", "github": "", "portfolio": "", "summary": "",
  "workExperiences": [{"company":"","role":"","startDate":"","endDate":"","description":"","achievements":[]}],
  "projects": [{"name":"","description":"","technologies":[],"achievements":[],"link":""}],
  "education": [{"institution":"","degree":"","fieldOfStudy":"","startDate":"","endDate":"","gpa":"","description":""}],
  "skills": [{"name":"","category":"","proficiency":""}],
  "certifications": [{"name":"","issuingOrganization":"","issueDate":"","credentialId":"","credentialUrl":""}],
  "honorsAndAwards": [{"name":"","organization":"","date":"","description":""}],
  "publications": [{"title":"","authors":[],"journalOrConference":"","publicationDate":"","link":"","doi":"","description":""}],
  "references": [{"name":"","titleAndCompany":"","contactDetailsOrNote":""}],
  "customSections": [{"heading":"","content":""}]
}`;
  const user = input.cvText;
  return parseJson(await generate(system, user, p));
}

async function selectJobFeed(
  input: { userPrompt: string; availableFeeds: Array<{ name: string; url: string; type: string; category?: string; categoryDetail: string }> },
  p: ProviderConfig
) {
  const system = `You are an expert job search assistant. Select the single best RSS feed URL for the user's request.
Respond with ONLY a JSON object: {"selectedFeedUrl": "...", "reasoning": "..."}
selectedFeedUrl MUST be one of the URLs from the available feeds list.`;
  const feedList = input.availableFeeds
    .map((f) => `- Name: ${f.name}, Category: ${f.category ?? ''}, Type: ${f.type}, URL: ${f.url}`)
    .join('\n');
  const user = `User request: "${input.userPrompt}"\n\nAvailable feeds:\n${feedList}`;
  const result = parseJson(await generate(system, user, p)) as {
    selectedFeedUrl: string;
    reasoning?: string;
  };
  // Validate the URL is from the available list
  const validUrls = new Set(input.availableFeeds.map((f) => f.url));
  if (!validUrls.has(result.selectedFeedUrl)) {
    const general = input.availableFeeds.find((f) => f.name.includes('General'));
    result.selectedFeedUrl = general?.url ?? input.availableFeeds[0]?.url ?? '';
  }
  return result;
}

async function extractRssItem(input: { rssItemXml: string }, p: ProviderConfig) {
  const system = `You are an expert job data extractor. Extract structured details from a job posting RSS item XML.
Respond with ONLY a JSON object:
{"role":"","company":"","requirementsSummary":"","deadlineText":"","location":"","jobUrl":""}
All fields are strings. Use empty string if not found. requirementsSummary should be a concise plain-text summary.`;
  const user = input.rssItemXml;
  return parseJson(await generate(system, user, p)) as {
    role: string;
    company: string;
    requirementsSummary: string;
    deadlineText: string;
    location: string;
    jobUrl: string;
  };
}

const JOB_SITES = [
  { name: 'Indeed UK', urlTemplate: 'https://uk.indeed.com/jobs?q={query}' },
  { name: 'Glassdoor UK', urlTemplate: 'https://www.glassdoor.co.uk/Job/jobs.htm?sc.keyword={query}' },
  { name: 'Jobs.ac.uk', urlTemplate: 'https://www.jobs.ac.uk/search/?keywords={query}' },
];

async function jobSearch(input: { prompt: string }, p: ProviderConfig) {
  const system = `You are an expert career advisor. Generate 3-5 effective, concise job search queries for the user's description.
Respond with ONLY a JSON object: {"queries": ["query1", "query2", "query3"]}`;
  const user = `Job search description: "${input.prompt}"`;
  const { queries } = parseJson(await generate(system, user, p)) as { queries: string[] };

  const links = queries.flatMap((query) =>
    JOB_SITES.map((site) => ({
      siteName: site.name,
      query,
      url: site.urlTemplate.replace('{query}', encodeURIComponent(query)),
    }))
  );
  return { links };
}

// ─── Route handler ────────────────────────────────────────────────────────────

const FLOW_MAP: Record<string, (input: unknown, p: ProviderConfig) => Promise<unknown>> = {
  tailorResume: (i, p) => tailorResume(i as Parameters<typeof tailorResume>[0], p),
  improveResume: (i, p) => improveResume(i as Parameters<typeof improveResume>[0], p),
  generateCoverLetter: (i, p) => generateCoverLetter(i as Parameters<typeof generateCoverLetter>[0], p),
  polishText: (i, p) => polishText(i as Parameters<typeof polishText>[0], p),
  calculateProfileJdMatch: (i, p) => calculateProfileJdMatch(i as Parameters<typeof calculateProfileJdMatch>[0], p),
  extractJobDetails: (i, p) => extractJobDetails(i as Parameters<typeof extractJobDetails>[0], p),
  extractTextFromHtml: (i, p) => extractTextFromHtml(i as Parameters<typeof extractTextFromHtml>[0], p),
  suggestCvSectionOrder: (i, p) => suggestCvSectionOrder(i as Parameters<typeof suggestCvSectionOrder>[0], p),
  generateLatexCv: (i, p) => generateLatexCv(i as Parameters<typeof generateLatexCv>[0], p),
  extractProfileFromCv: (i, p) => extractProfileFromCv(i as Parameters<typeof extractProfileFromCv>[0], p),
  selectJobFeed: (i, p) => selectJobFeed(i as Parameters<typeof selectJobFeed>[0], p),
  extractRssItem: (i, p) => extractRssItem(i as Parameters<typeof extractRssItem>[0], p),
  jobSearch: (i, p) => jobSearch(i as Parameters<typeof jobSearch>[0], p),
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { flowName, input, provider } = body as {
      flowName: string;
      input: unknown;
      provider: ProviderConfig;
    };

    if (!flowName || !provider?.baseUrl || !provider?.model) {
      return NextResponse.json(
        { message: 'Missing flowName, provider.baseUrl, or provider.model' },
        { status: 400 }
      );
    }

    const handler = FLOW_MAP[flowName];
    if (!handler) {
      return NextResponse.json({ message: `Unknown flow: ${flowName}` }, { status: 400 });
    }

    const result = await handler(input, provider);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'AI generation failed';
    console.error('[ai/generate]', message);
    return NextResponse.json({ message }, { status: 500 });
  }
}
