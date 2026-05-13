import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_SECTION_ORDER, type ProfileSectionKey } from '@/lib/types';

export const maxDuration = 60;

// ─── Router types ─────────────────────────────────────────────────────────────

interface RouterProvider {
  id: string;
  name: string;
  type: 'openai' | 'anthropic' | 'custom';
  baseUrl: string;
  apiKey: string;
  enabled: boolean;
  refreshToken?: string;
  tokenExpiresAt?: number;
}

interface RouterCombo {
  id: string;
  name: string;
  models: string[]; // "providerId/modelName"
  strategy: 'fallback' | 'round-robin';
  stickyLimit?: number;
}

interface RouterConfig {
  providers: RouterProvider[];
  combos: RouterCombo[];
  activeComboId: string | null;
  activeModel?: string; // "providerId/modelName" — single-model activation, no combo needed
}

interface ResolvedModel {
  providerId: string;
  model: string;
  baseUrl: string;
  apiKey: string;
  type: 'openai' | 'anthropic' | 'custom';
  refreshToken?: string;
  tokenExpiresAt?: number;
}

// ─── Firestore REST reader ────────────────────────────────────────────────────

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '';

// 60-second cache so every request doesn't hit Firestore
let configCache: { data: RouterConfig; ts: number } | null = null;

function parseFirestoreValue(val: unknown): unknown {
  const v = val as Record<string, unknown>;
  if (v.stringValue !== undefined) return v.stringValue;
  if (v.integerValue !== undefined) return Number(v.integerValue);
  if (v.doubleValue !== undefined) return v.doubleValue;
  if (v.booleanValue !== undefined) return v.booleanValue;
  if (v.nullValue !== undefined) return null;
  if (v.arrayValue) {
    const av = v.arrayValue as { values?: unknown[] };
    return (av.values ?? []).map(parseFirestoreValue);
  }
  if (v.mapValue) {
    const mv = v.mapValue as { fields?: Record<string, unknown> };
    const obj: Record<string, unknown> = {};
    for (const [k, fv] of Object.entries(mv.fields ?? {})) {
      obj[k] = parseFirestoreValue(fv);
    }
    return obj;
  }
  return undefined;
}

function parseFirestoreDoc(doc: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const fields = doc.fields as Record<string, unknown> | undefined;
  if (!fields) return result;
  for (const [k, v] of Object.entries(fields)) {
    result[k] = parseFirestoreValue(v);
  }
  return result;
}

async function loadRouterConfig(idToken: string): Promise<RouterConfig | null> {
  if (configCache && Date.now() - configCache.ts < 60_000) return configCache.data;

  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/config/router`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${idToken}` },
    cache: 'no-store',
  });

  if (!res.ok) return null;
  const raw = (await res.json()) as Record<string, unknown>;
  const data = parseFirestoreDoc(raw) as unknown as RouterConfig;
  configCache = { data, ts: Date.now() };
  return data;
}

// ─── Round-robin state (in-process, resets on server restart) ─────────────────

const rrState = new Map<string, { index: number; requestCount: number }>();

function resolveModels(config: RouterConfig, combo: RouterCombo): ResolvedModel[] {
  return combo.models.flatMap((entry) => {
    const slash = entry.indexOf('/');
    if (slash === -1) return [];
    const providerId = entry.slice(0, slash);
    const modelName = entry.slice(slash + 1);
    const provider = config.providers.find((p) => p.id === providerId && p.enabled);
    if (!provider) return [];
    return [{
      providerId, model: modelName,
      baseUrl: provider.baseUrl, apiKey: provider.apiKey, type: provider.type,
      refreshToken: provider.refreshToken, tokenExpiresAt: provider.tokenExpiresAt,
    }];
  });
}

// Refresh a Google OAuth access token when it's about to expire.
async function maybeRefreshGoogleToken(model: ResolvedModel): Promise<ResolvedModel> {
  if (!model.refreshToken || !model.tokenExpiresAt) return model;
  if (Date.now() < model.tokenExpiresAt - 120_000) return model; // still valid
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return model;
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId, client_secret: clientSecret,
        refresh_token: model.refreshToken, grant_type: 'refresh_token',
      }),
    });
    if (!res.ok) return model;
    const { access_token, expires_in } = await res.json() as { access_token: string; expires_in: number };
    const newExpiry = Date.now() + expires_in * 1000;
    // Update in-process cache so subsequent requests in this minute don't re-fetch
    if (configCache) {
      const p = configCache.data.providers.find((x) => x.id === model.providerId);
      if (p) { p.apiKey = access_token; p.tokenExpiresAt = newExpiry; }
    }
    return { ...model, apiKey: access_token, tokenExpiresAt: newExpiry };
  } catch { return model; }
}

function pickRoundRobin(comboId: string, models: ResolvedModel[], stickyLimit: number): ResolvedModel {
  const state = rrState.get(comboId) ?? { index: 0, requestCount: 0 };
  if (state.requestCount >= stickyLimit) {
    state.index = (state.index + 1) % models.length;
    state.requestCount = 0;
  }
  const picked = models[state.index % models.length];
  state.requestCount++;
  rrState.set(comboId, state);
  return picked;
}

// ─── AI provider callers ──────────────────────────────────────────────────────

interface Message { role: 'system' | 'user'; content: string; }

function normalizeBaseUrl(baseUrl: string): string {
  if (baseUrl.includes('generativelanguage.googleapis.com') && !baseUrl.includes('/openai')) {
    return 'https://generativelanguage.googleapis.com/v1beta/openai';
  }
  return baseUrl.replace(/\/$/, '');
}

async function callOpenAICompat(messages: Message[], model: ResolvedModel, jsonMode = true): Promise<string> {
  const base = normalizeBaseUrl(model.baseUrl);
  const body: Record<string, unknown> = {
    model: model.model,
    messages,
    temperature: 0.3,
    max_tokens: 4096,
  };
  if (jsonMode) body.response_format = { type: 'json_object' };

  let res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${model.apiKey}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://resumeai.app', 'X-Title': 'ResumeForge' },
    body: JSON.stringify(body),
  });

  if (!res.ok && jsonMode) {
    delete body.response_format;
    res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${model.apiKey}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://resumeai.app', 'X-Title': 'ResumeForge' },
      body: JSON.stringify(body),
    });
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[${model.providerId}/${model.model}] ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.choices[0].message.content as string;
}

async function callAnthropic(system: string, user: string, model: ResolvedModel): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': model.apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: model.model, max_tokens: 4096, system, messages: [{ role: 'user', content: user }] }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[${model.providerId}/${model.model}] ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.content[0].text as string;
}

async function callModel(system: string, user: string, model: ResolvedModel, jsonMode = true): Promise<string> {
  if (model.type === 'anthropic') return callAnthropic(system, user, model);
  return callOpenAICompat([{ role: 'system', content: system }, { role: 'user', content: user }], model, jsonMode);
}

async function generateWithFallback(system: string, user: string, models: ResolvedModel[], jsonMode = true): Promise<string> {
  let lastError: Error | null = null;
  for (const model of models) {
    try {
      return await callModel(system, user, model, jsonMode);
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw lastError ?? new Error('All models in combo failed');
}

// ─── JSON helper ──────────────────────────────────────────────────────────────

function parseJson(text: string): unknown {
  const t = text.trim();
  try { return JSON.parse(t); } catch { }
  const block = t.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (block) { try { return JSON.parse(block[1]); } catch { } }
  const obj = t.match(/(\{[\s\S]*\})/);
  if (obj) { try { return JSON.parse(obj[1]); } catch { } }
  throw new Error('Could not parse JSON from AI response');
}

// ─── Flow handlers ────────────────────────────────────────────────────────────

async function tailorResume(input: { resume: string; jobDescription: string }, models: ResolvedModel[]) {
  const system = `You are an expert resume writer. Tailor the given resume to the job description.
Respond with ONLY a JSON object: {"tailoredResume": "...", "analysis": "..."}`;
  const user = `Resume:\n${input.resume}\n\nJob Description:\n${input.jobDescription}`;
  return parseJson(await generateWithFallback(system, user, models)) as { tailoredResume: string; analysis: string };
}

async function improveResume(input: { resume: string; jobDescription: string }, models: ResolvedModel[]) {
  const system = `You are an expert resume advisor. Provide actionable suggestions to improve the resume for the given job.
Respond with ONLY a JSON object: {"suggestions": "..."}`;
  const user = `Resume:\n${input.resume}\n\nJob Description:\n${input.jobDescription}`;
  return parseJson(await generateWithFallback(system, user, models)) as { suggestions: string };
}

async function generateCoverLetter(input: { resumeText: string; jobDescriptionText: string; userName?: string }, models: ResolvedModel[]) {
  const system = `You are an expert career advisor and professional writer. Write a compelling, tailored cover letter.
Respond with ONLY a JSON object: {"coverLetterText": "..."}
The cover letter should be 3-4 paragraphs, professional, and specific to the job.
${input.userName ? `The applicant's name is ${input.userName}.` : ''}`;
  const user = `Resume:\n${input.resumeText}\n\nJob Description:\n${input.jobDescriptionText}`;
  return parseJson(await generateWithFallback(system, user, models)) as { coverLetterText: string };
}

async function polishText(input: { textToPolish: string }, models: ResolvedModel[]) {
  const system = `You are an expert resume writing assistant. Polish the given text to be more concise, impactful, and professional.
Respond with ONLY a JSON object: {"polishedText": "..."}`;
  const user = `Text to polish:\n${input.textToPolish}`;
  return parseJson(await generateWithFallback(system, user, models)) as { polishedText: string };
}

async function calculateProfileJdMatch(input: { profileText: string; jobDescriptionText: string }, models: ResolvedModel[]) {
  const system = `You are an expert HR analyst. Calculate how well a candidate's profile matches a job description.
Respond with ONLY a JSON object:
{"matchPercentage": <0-100>, "matchSummary": "...", "matchCategory": "Excellent Match"|"Good Match"|"Fair Match"|"Poor Match"}`;
  const user = `Profile:\n${input.profileText}\n\nJob Description:\n${input.jobDescriptionText}`;
  const result = parseJson(await generateWithFallback(system, user, models)) as { matchPercentage: number; matchSummary: string; matchCategory: string };
  result.matchPercentage = Math.min(100, Math.max(0, Number(result.matchPercentage) || 0));
  return result;
}

async function extractJobDetails(input: { jobDescriptionText: string }, models: ResolvedModel[]) {
  const system = `Extract the job title and company name from the job description.
Respond with ONLY a JSON object: {"jobTitle": "...", "companyName": "..."}`;
  return parseJson(await generateWithFallback(system, input.jobDescriptionText, models)) as { jobTitle: string; companyName: string };
}

async function extractTextFromHtml(input: { htmlContent: string }, models: ResolvedModel[]) {
  const system = `Extract the main job description text from the HTML. Return only clean text.
Respond with ONLY a JSON object: {"extractedText": "..."}`;
  return parseJson(await generateWithFallback(system, input.htmlContent.slice(0, 20000), models)) as { extractedText: string };
}

async function suggestCvSectionOrder(input: { userPreference: string; currentSectionOrder: ProfileSectionKey[]; availableSections: ProfileSectionKey[] }, models: ResolvedModel[]) {
  const system = `You are an expert CV advisor. Reorder CV sections based on the user's preference.
Respond with ONLY a JSON object: {"newSectionOrder": [...], "reasoning": "..."}
IMPORTANT: newSectionOrder MUST contain ALL sections from availableSections, no more, no less.`;
  const user = `User preference: "${input.userPreference || 'General Purpose CV'}"\nCurrent order: ${input.currentSectionOrder.join(', ')}\nAvailable sections: ${input.availableSections.join(', ')}`;
  const raw = parseJson(await generateWithFallback(system, user, models)) as { newSectionOrder: ProfileSectionKey[]; reasoning?: string };
  const available = new Set(input.availableSections);
  const received = raw.newSectionOrder?.filter((s: string) => available.has(s as ProfileSectionKey)) ?? [];
  const missing = input.availableSections.filter((s) => !received.includes(s));
  return { newSectionOrder: [...new Set([...received, ...missing])] as ProfileSectionKey[], reasoning: raw.reasoning ?? '' };
}

async function generateLatexCv(input: { profileAsText: string; cvStylePreference?: string }, models: ResolvedModel[]) {
  const system = `You are a world-class executive CV writer. 
The user requires a high-end, professional CV. You MUST strictly follow the user's requested style and page constraints.

REQUESTED STYLE: "${input.cvStylePreference || 'professional classic'}"

### SPECIAL CASE: NARRATIVE CV / RESUME FOR RESEARCH (R4R)
If the user mentions "Narrative", "Research", or "Academic Narrative", follow this specific structure:
1. Personal Profile: A short, impactful summary of research dedication and goals.
2. Contributions to the Generation of Knowledge: New ideas, tools, discoveries, open-source work.
3. Contributions to the Development of Individuals: Mentoring, teaching, leadership, fostering others' success.
4. Contributions to the Wider Research Community: Peer review, committee work, organizing events, improving the ecosystem.
5. Contributions to Broader Society: Public engagement, policy advising, industry collaboration, societal impact.

STRICT GUIDELINES:
1. CONTENT QUALITY: Rewrite the resume to be highly impactful and result-oriented.
2. PAGE LIMIT: Strictly adhere to requested page lengths.
3. TONE: Maintain a sophisticated, executive-level tone.

YOU MUST OUTPUT EXACTLY THREE CODE BLOCKS:
1. \`\`\`markdown - The full CV in clean, perfectly formatted Markdown.
2. \`\`\`html - Standalone HTML with embedded CSS that mimics a high-end PDF layout (Inter font, clear margins, professional spacing).
3. \`\`\`latex - Complete, high-quality compilable LaTeX code.

Do NOT use JSON. Be precise.`;
  const text = await generateWithFallback(system, `Resume Text:\n${input.profileAsText}`, models, false);

  const mdBlock = text.match(/```(?:markdown|md)?\s*([\s\S]*?)\s*```/i);
  const htmlBlock = text.match(/```(?:html)?\s*([\s\S]*?)\s*```/i);
  const texBlock = text.match(/```(?:latex|tex)?\s*([\s\S]*?)\s*```/i);

  const markdownCode = mdBlock ? mdBlock[1].trim() : text.trim();
  const htmlCode = htmlBlock ? htmlBlock[1].trim() : "<html><body>" + (mdBlock ? mdBlock[1].trim().replace(/\n/g, '<br/>') : "Error parsing HTML") + "</body></html>";
  const latexCode = texBlock ? texBlock[1].trim() : "% LaTeX code parsing failed. Please try again.";

  return { latexCode, markdownCode, htmlCode };
}

async function extractProfileFromCv(input: { cvText: string }, models: ResolvedModel[]) {
  const system = `You are an expert CV parser. Extract structured information from the CV text.
Respond with ONLY a JSON object with these fields (all optional):
{"fullName":"","email":"","phone":"","address":"","linkedin":"","github":"","portfolio":"","summary":"",
"workExperiences":[{"company":"","role":"","startDate":"","endDate":"","description":"","achievements":[]}],
"projects":[{"name":"","description":"","technologies":[],"achievements":[],"link":""}],
"education":[{"institution":"","degree":"","fieldOfStudy":"","startDate":"","endDate":"","gpa":"","description":""}],
"skills":[{"name":"","category":"","proficiency":""}],
"certifications":[{"name":"","issuingOrganization":"","issueDate":"","credentialId":"","credentialUrl":""}],
"honorsAndAwards":[{"name":"","organization":"","date":"","description":""}],
"publications":[{"title":"","authors":[],"journalOrConference":"","publicationDate":"","link":"","doi":"","description":""}],
"references":[{"name":"","titleAndCompany":"","contactDetailsOrNote":""}],
"customSections":[{"heading":"","content":""}]}`;
  return parseJson(await generateWithFallback(system, input.cvText, models));
}

async function selectJobFeed(input: { userPrompt: string; availableFeeds: Array<{ name: string; url: string; type: string; category?: string; categoryDetail: string }> }, models: ResolvedModel[]) {
  const system = `You are an expert job search assistant. Select the single best RSS feed URL for the user's request.
Respond with ONLY a JSON object: {"selectedFeedUrl": "...", "reasoning": "..."}
selectedFeedUrl MUST be one of the URLs from the available feeds list.`;
  const feedList = input.availableFeeds.map((f) => `- Name: ${f.name}, Category: ${f.category ?? ''}, Type: ${f.type}, URL: ${f.url}`).join('\n');
  const user = `User request: "${input.userPrompt}"\n\nAvailable feeds:\n${feedList}`;
  const result = parseJson(await generateWithFallback(system, user, models)) as { selectedFeedUrl: string; reasoning?: string };
  const validUrls = new Set(input.availableFeeds.map((f) => f.url));
  if (!validUrls.has(result.selectedFeedUrl)) {
    const general = input.availableFeeds.find((f) => f.name.includes('General'));
    result.selectedFeedUrl = general?.url ?? input.availableFeeds[0]?.url ?? '';
  }
  return result;
}

async function extractRssItem(input: { rssItemXml: string }, models: ResolvedModel[]) {
  const system = `Extract structured details from a job posting RSS item XML.
Respond with ONLY a JSON object: {"role":"","company":"","requirementsSummary":"","deadlineText":"","location":"","jobUrl":""}`;
  return parseJson(await generateWithFallback(system, input.rssItemXml, models)) as { role: string; company: string; requirementsSummary: string; deadlineText: string; location: string; jobUrl: string };
}

const JOB_SITES = [
  { name: 'Indeed UK', urlTemplate: 'https://uk.indeed.com/jobs?q={query}' },
  { name: 'Glassdoor UK', urlTemplate: 'https://www.glassdoor.co.uk/Job/jobs.htm?sc.keyword={query}' },
  { name: 'Jobs.ac.uk', urlTemplate: 'https://www.jobs.ac.uk/search/?keywords={query}' },
];

async function jobSearch(input: { prompt: string }, models: ResolvedModel[]) {
  const system = `Generate 3-5 effective job search queries for the user's description.
Respond with ONLY a JSON object: {"queries": ["query1", "query2", "query3"]}`;
  const { queries } = parseJson(await generateWithFallback(system, `Job search: "${input.prompt}"`, models)) as { queries: string[] };
  const links = queries.flatMap((query) => JOB_SITES.map((site) => ({ siteName: site.name, query, url: site.urlTemplate.replace('{query}', encodeURIComponent(query)) })));
  return { links };
}

// ─── Flow map ─────────────────────────────────────────────────────────────────

type FlowHandler = (input: unknown, models: ResolvedModel[]) => Promise<unknown>;
const FLOW_MAP: Record<string, FlowHandler> = {
  tailorResume: (i, m) => tailorResume(i as Parameters<typeof tailorResume>[0], m),
  improveResume: (i, m) => improveResume(i as Parameters<typeof improveResume>[0], m),
  generateCoverLetter: (i, m) => generateCoverLetter(i as Parameters<typeof generateCoverLetter>[0], m),
  polishText: (i, m) => polishText(i as Parameters<typeof polishText>[0], m),
  calculateProfileJdMatch: (i, m) => calculateProfileJdMatch(i as Parameters<typeof calculateProfileJdMatch>[0], m),
  extractJobDetails: (i, m) => extractJobDetails(i as Parameters<typeof extractJobDetails>[0], m),
  extractTextFromHtml: (i, m) => extractTextFromHtml(i as Parameters<typeof extractTextFromHtml>[0], m),
  suggestCvSectionOrder: (i, m) => suggestCvSectionOrder(i as Parameters<typeof suggestCvSectionOrder>[0], m),
  generateLatexCv: (i, m) => generateLatexCv(i as Parameters<typeof generateLatexCv>[0], m),
  extractProfileFromCv: (i, m) => extractProfileFromCv(i as Parameters<typeof extractProfileFromCv>[0], m),
  selectJobFeed: (i, m) => selectJobFeed(i as Parameters<typeof selectJobFeed>[0], m),
  extractRssItem: (i, m) => extractRssItem(i as Parameters<typeof extractRssItem>[0], m),
  jobSearch: (i, m) => jobSearch(i as Parameters<typeof jobSearch>[0], m),
};

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const idToken = req.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
    if (!idToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    let config = await loadRouterConfig(idToken);

    // Env-var fallback: if no Firestore config (or no active model/combo), use OPENROUTER_API_KEY
    const envKey = process.env.OPENROUTER_API_KEY;
    if ((!config || (!config.activeComboId && !config.activeModel)) && envKey) {
      config = {
        providers: [{
          id: 'env-openrouter', name: 'OpenRouter', type: 'openai',
          baseUrl: 'https://openrouter.ai/api/v1', apiKey: envKey, enabled: true,
        }],
        combos: [{
          id: 'env-combo', name: 'Default',
          models: ['env-openrouter/openai/gpt-4o-mini'], strategy: 'fallback',
        }],
        activeComboId: 'env-combo',
      };
    }

    if (!config) {
      return NextResponse.json({ message: 'AI router not configured. An admin needs to connect a provider in the AI Router settings.' }, { status: 503 });
    }

    // Resolve active combo — support both combo-based and single-model activation
    let activeCombo = config.combos.find((c) => c.id === config!.activeComboId);
    if (!activeCombo && config.activeModel) {
      // Single-model activation (no combo needed)
      activeCombo = { id: '__direct__', name: 'Direct', models: [config.activeModel], strategy: 'fallback' };
    }
    if (!activeCombo) {
      return NextResponse.json({ message: 'No AI model activated. An admin needs to activate a provider in AI Router settings.' }, { status: 503 });
    }

    const resolved = resolveModels(config, activeCombo);
    if (resolved.length === 0) {
      return NextResponse.json({ message: 'Active model has no enabled provider. Check AI Router settings.' }, { status: 503 });
    }

    // Refresh any expired OAuth tokens (e.g. Google)
    const refreshed = await Promise.all(resolved.map(maybeRefreshGoogleToken));

    const body = await req.json();
    const { flowName, input } = body as { flowName: string; input: unknown };

    if (!flowName) {
      return NextResponse.json({ message: 'Missing flowName' }, { status: 400 });
    }

    const handler = FLOW_MAP[flowName];
    if (!handler) {
      return NextResponse.json({ message: `Unknown flow: ${flowName}` }, { status: 400 });
    }

    // Pick models based on strategy
    let modelsForRequest: ResolvedModel[];
    if (activeCombo.strategy === 'round-robin') {
      const picked = pickRoundRobin(activeCombo.id, refreshed, activeCombo.stickyLimit ?? 1);
      modelsForRequest = [picked, ...refreshed.filter((m) => m !== picked)];
    } else {
      modelsForRequest = refreshed;
    }

    const result = await handler(input, modelsForRequest);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'AI generation failed';
    console.error('[ai/generate]', message);
    return NextResponse.json({ message }, { status: 500 });
  }
}
