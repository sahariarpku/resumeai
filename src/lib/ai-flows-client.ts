/**
 * Client-side AI flow wrappers.
 * Provider config lives in Firestore (admin-controlled). The API route reads
 * it server-side — no API keys ever reach the browser.
 */

import type { ProfileSectionKey } from './types';

// ─── Re-export types so components can import from one place ──────────────────
export type { TailorResumeToJobDescriptionInput, TailorResumeToJobDescriptionOutput } from '@/ai/flows/tailor-resume-to-job-description';
export type { ImproveResumeInput, ImproveResumeOutput } from '@/ai/flows/improve-resume-based-on-job-description';
export type { GenerateCoverLetterInput, GenerateCoverLetterOutput } from '@/ai/flows/generate-cover-letter-flow';
export type { PolishTextInput, PolishTextOutput } from '@/ai/flows/polish-text-flow';
export type { CalculateProfileJdMatchInput, CalculateProfileJdMatchOutput } from '@/ai/flows/calculate-profile-jd-match-flow';
export type { ExtractJobDetailsInput, ExtractJobDetailsOutput } from '@/ai/flows/extract-job-details-flow';
export type { ExtractTextFromHtmlInput, ExtractTextFromHtmlOutput } from '@/ai/flows/extract-text-from-html-flow';
export type { SuggestCvSectionOrderInput, SuggestCvSectionOrderOutput } from '@/lib/schemas';
export type { GenerateLatexCvInput, GenerateLatexCvOutput } from '@/ai/flows/generate-latex-cv-flow';
export type { ExtractProfileFromCvInput, ExtractProfileFromCvOutput } from '@/ai/flows/extract-profile-from-cv-flow';
export type { SelectJobFeedInput, SelectJobFeedOutput } from '@/ai/flows/select-job-feed-flow';
export type { ExtractRssItemInput, ExtractRssItemOutput } from '@/ai/flows/extract-rss-item-flow';
export type { JobSearchInput, JobSearchOutput } from '@/ai/flows/job-search-flow';

// ─── Core dispatcher ──────────────────────────────────────────────────────────

async function callFlow<T>(flowName: string, input: unknown): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  // Attach Firebase ID token so the API route can read Firestore as this user
  if (typeof window !== 'undefined') {
    try {
      const { getAuth } = await import('firebase/auth');
      const user = getAuth().currentUser;
      if (user) {
        const idToken = await user.getIdToken();
        headers['Authorization'] = `Bearer ${idToken}`;
      }
    } catch {
      // proceed without token — API route will return 401
    }
  }

  const res = await fetch('/api/ai/generate', {
    method: 'POST',
    headers,
    body: JSON.stringify({ flowName, input }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? 'AI request failed');
  }

  return res.json() as Promise<T>;
}

// ─── Flow wrappers ────────────────────────────────────────────────────────────

export async function tailorResumeToJobDescription(input: {
  resume: string;
  jobDescription: string;
}) {
  return callFlow<{ tailoredResume: string; analysis: string }>('tailorResume', input);
}

export async function improveResume(input: {
  resume: string;
  jobDescription: string;
}) {
  return callFlow<{ suggestions: string }>('improveResume', input);
}

export async function generateCoverLetter(input: {
  resumeText: string;
  jobDescriptionText: string;
  userName?: string;
}) {
  return callFlow<{ coverLetterText: string }>('generateCoverLetter', input);
}

export async function polishText(input: { textToPolish: string }) {
  return callFlow<{ polishedText: string }>('polishText', input);
}

export async function calculateProfileJdMatch(input: {
  profileText: string;
  jobDescriptionText: string;
}) {
  return callFlow<{
    matchPercentage: number;
    matchSummary: string;
    matchCategory: 'Excellent Match' | 'Good Match' | 'Fair Match' | 'Poor Match';
  }>('calculateProfileJdMatch', input);
}

export async function extractJobDetails(input: { jobDescriptionText: string }) {
  return callFlow<{ jobTitle: string; companyName: string }>('extractJobDetails', input);
}

export async function extractTextFromHtml(input: { htmlContent: string }) {
  return callFlow<{ extractedText: string }>('extractTextFromHtml', input);
}

export async function suggestCvSectionOrder(input: {
  userPreference: string;
  currentSectionOrder: ProfileSectionKey[];
  availableSections: ProfileSectionKey[];
}) {
  return callFlow<{ newSectionOrder: ProfileSectionKey[]; reasoning?: string }>(
    'suggestCvSectionOrder',
    input
  );
}

export async function generateLatexCv(input: {
  profileAsText: string;
  cvStylePreference?: string;
}) {
  return callFlow<{ latexCode: string; markdownCode: string; htmlCode: string }>('generateLatexCv', input);
}

export async function extractProfileFromCv(input: { cvText: string }) {
  return callFlow<Record<string, unknown>>('extractProfileFromCv', input);
}

export async function selectJobFeed(input: {
  userPrompt: string;
  availableFeeds: Array<{
    name: string;
    url: string;
    type: string;
    category?: string;
    categoryDetail: string;
  }>;
}) {
  return callFlow<{ selectedFeedUrl: string; reasoning?: string }>('selectJobFeed', input);
}

export async function extractJobDetailsFromRssItem(input: { rssItemXml: string }) {
  return callFlow<{
    role: string;
    company: string;
    requirementsSummary: string;
    deadlineText: string;
    location: string;
    jobUrl: string;
  }>('extractRssItem', input);
}

export async function jobSearch(input: { prompt: string }) {
  return callFlow<{
    links: Array<{ siteName: string; query: string; url: string }>;
  }>('jobSearch', input);
}
