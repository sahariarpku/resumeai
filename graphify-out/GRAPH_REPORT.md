# Graph Report - .  (2026-05-07)

## Corpus Check
- Corpus is ~49,795 words - fits in a single context window. You may not need a graph.

## Summary
- 409 nodes · 561 edges · 36 communities detected
- Extraction: 86% EXTRACTED · 14% INFERRED · 0% AMBIGUOUS · INFERRED: 77 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Resume Editor Page|Resume Editor Page]]
- [[_COMMUNITY_Product Blueprint & Docs|Product Blueprint & Docs]]
- [[_COMMUNITY_CV Customization Modal|CV Customization Modal]]
- [[_COMMUNITY_AI API Route Handlers|AI API Route Handlers]]
- [[_COMMUNITY_AI Provider Settings UI|AI Provider Settings UI]]
- [[_COMMUNITY_Auth & App Layout|Auth & App Layout]]
- [[_COMMUNITY_AI Flows Client|AI Flows Client]]
- [[_COMMUNITY_AI Settings Context|AI Settings Context]]
- [[_COMMUNITY_Job RSS Feed Library|Job RSS Feed Library]]
- [[_COMMUNITY_Fetch Utility Routes|Fetch Utility Routes]]
- [[_COMMUNITY_Sidebar Component|Sidebar Component]]
- [[_COMMUNITY_Chart Component|Chart Component]]
- [[_COMMUNITY_Root Layout|Root Layout]]
- [[_COMMUNITY_Dashboard Page|Dashboard Page]]
- [[_COMMUNITY_Billing Page|Billing Page]]
- [[_COMMUNITY_Auth Layout|Auth Layout]]
- [[_COMMUNITY_Logo Component|Logo Component]]
- [[_COMMUNITY_Badge Component|Badge Component]]
- [[_COMMUNITY_Skeleton Component|Skeleton Component]]
- [[_COMMUNITY_Form Section Component|Form Section Component]]
- [[_COMMUNITY_Header Component|Header Component]]
- [[_COMMUNITY_Main Nav Component|Main Nav Component]]
- [[_COMMUNITY_Extract Job Details Flow|Extract Job Details Flow]]
- [[_COMMUNITY_Select Job Feed Flow|Select Job Feed Flow]]
- [[_COMMUNITY_Extract Profile from CV Flow|Extract Profile from CV Flow]]
- [[_COMMUNITY_Extract RSS Item Flow|Extract RSS Item Flow]]
- [[_COMMUNITY_Generate LaTeX CV Flow|Generate LaTeX CV Flow]]
- [[_COMMUNITY_Tailor Resume to JD Flow|Tailor Resume to JD Flow]]
- [[_COMMUNITY_Polish Text Flow|Polish Text Flow]]
- [[_COMMUNITY_Generate Cover Letter Flow|Generate Cover Letter Flow]]
- [[_COMMUNITY_JD Match Score Flow|JD Match Score Flow]]
- [[_COMMUNITY_Extract HTML Text Flow|Extract HTML Text Flow]]
- [[_COMMUNITY_Suggest CV Section Order Flow|Suggest CV Section Order Flow]]
- [[_COMMUNITY_Improve Resume Flow|Improve Resume Flow]]
- [[_COMMUNITY_Mobile Detection Hook|Mobile Detection Hook]]
- [[_COMMUNITY_Utility Functions|Utility Functions]]

## God Nodes (most connected - your core abstractions)
1. `toast()` - 47 edges
2. `ResumeForge AI` - 23 edges
3. `generate()` - 18 edges
4. `callFlow()` - 16 edges
5. `parseJson()` - 15 edges
6. `handleAddOrUpdateSectionItem()` - 12 edges
7. `handleDeleteSectionItem()` - 12 edges
8. `profileToResumeText()` - 9 edges
9. `ResumeForge (Blueprint)` - 9 edges
10. `GoogleIcon()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `NextAuth.js` --semantically_similar_to--> `Firebase Authentication`  [AMBIGUOUS] [semantically similar]
  docs/blueprint.md → README.md
- `Zod` --semantically_similar_to--> `Real-time Form Validation`  [INFERRED] [semantically similar]
  README.md → docs/blueprint.md
- `react-hook-form` --semantically_similar_to--> `Real-time Form Validation`  [INFERRED] [semantically similar]
  README.md → docs/blueprint.md
- `Firebase Firestore` --semantically_similar_to--> `Online Resume & JD Storage`  [INFERRED] [semantically similar]
  README.md → docs/blueprint.md
- `Firebase Authentication` --semantically_similar_to--> `Secure Authentication`  [INFERRED] [semantically similar]
  README.md → docs/blueprint.md

## Hyperedges (group relationships)
- **AI Resume Tailoring Pipeline** — readme_genkit, readme_genkit_flows, blueprint_ai_resume_tailoring, blueprint_ats_optimization [INFERRED 0.85]
- **Firebase Data Security Triad (Auth + Firestore + Security Rules)** — readme_firebase_authentication, readme_firestore, readme_firestore_security_rules [EXTRACTED 0.95]
- **Form Validation & Data Integrity Stack** — readme_react_hook_form, readme_zod, blueprint_realtime_form_validation [INFERRED 0.80]

## Communities

### Community 0 - "Resume Editor Page"
Cohesion: 0.11
Nodes (49): applyExtractedDataToProfile(), formatSectionTitleLocal(), handleAddCertification(), handleAddCustomSection(), handleAddEducation(), handleAddHonorAward(), handleAddOrUpdateSectionItem(), handleAddProject() (+41 more)

### Community 1 - "Product Blueprint & Docs"
Cohesion: 0.05
Nodes (44): AI-Powered Resume Tailoring, ATS Optimization, Cloudflare R2, Primary Color: Deep Violet (#673AB7), Design System & Style Guidelines, Body Font: Inter, NextAuth.js, One-Click PDF Download (+36 more)

### Community 2 - "CV Customization Modal"
Cohesion: 0.11
Nodes (26): handleApplyPreference(), handleDownload(), handleGenerateLatex(), handlePrintPdf(), loadProfileForModal(), getMatchBadgeVariant(), handleAddOrEditJd(), handleCalculateMatchScore() (+18 more)

### Community 3 - "AI API Route Handlers"
Cohesion: 0.3
Nodes (20): calculateProfileJdMatch(), callAnthropic(), callOpenAICompat(), extractJobDetails(), extractProfileFromCv(), extractRssItem(), extractTextFromHtml(), generate() (+12 more)

### Community 4 - "AI Provider Settings UI"
Cohesion: 0.18
Nodes (11): AnthropicIcon(), GoogleIcon(), GroqIcon(), handleSetActive(), handleToggle(), LandingPage(), MistralIcon(), OllamaIcon() (+3 more)

### Community 5 - "Auth & App Layout"
Cohesion: 0.15
Nodes (9): useAuth(), AppLayout(), TailorResumePage(), addToRemoveQueue(), dispatch(), genId(), reducer(), useToast() (+1 more)

### Community 6 - "AI Flows Client"
Cohesion: 0.32
Nodes (15): calculateProfileJdMatch(), callFlow(), extractJobDetails(), extractJobDetailsFromRssItem(), extractProfileFromCv(), extractTextFromHtml(), generateCoverLetter(), generateLatexCv() (+7 more)

### Community 7 - "AI Settings Context"
Cohesion: 0.22
Nodes (5): AISettingsProvider(), useAISettingsContext(), NoProviderBanner(), loadSettings(), useAISettings()

### Community 8 - "Job RSS Feed Library"
Cohesion: 0.53
Nodes (4): deriveFeedMetadata(), getFeedCategoriesByType(), getFeedDetailsByCategoryAndType(), getFeedsByType()

### Community 9 - "Fetch Utility Routes"
Cohesion: 0.4
Nodes (1): GET()

### Community 10 - "Sidebar Component"
Cohesion: 0.6
Nodes (3): cn(), handleKeyDown(), useSidebar()

### Community 11 - "Chart Component"
Cohesion: 0.67
Nodes (2): cn(), useChart()

### Community 12 - "Root Layout"
Cohesion: 0.67
Nodes (1): RootLayout()

### Community 13 - "Dashboard Page"
Cohesion: 0.67
Nodes (1): fetchDashboardData()

### Community 14 - "Billing Page"
Cohesion: 0.67
Nodes (1): BillingPage()

### Community 15 - "Auth Layout"
Cohesion: 0.67
Nodes (1): AuthLayout()

### Community 16 - "Logo Component"
Cohesion: 0.67
Nodes (1): ResumeForgeLogo()

### Community 17 - "Badge Component"
Cohesion: 0.67
Nodes (1): Badge()

### Community 18 - "Skeleton Component"
Cohesion: 0.67
Nodes (1): Skeleton()

### Community 19 - "Form Section Component"
Cohesion: 0.67
Nodes (1): renderItem()

### Community 20 - "Header Component"
Cohesion: 0.67
Nodes (1): Header()

### Community 21 - "Main Nav Component"
Cohesion: 0.67
Nodes (1): updateClientHref()

### Community 22 - "Extract Job Details Flow"
Cohesion: 0.67
Nodes (1): extractJobDetails()

### Community 23 - "Select Job Feed Flow"
Cohesion: 0.67
Nodes (1): selectJobFeed()

### Community 24 - "Extract Profile from CV Flow"
Cohesion: 0.67
Nodes (1): extractProfileFromCv()

### Community 25 - "Extract RSS Item Flow"
Cohesion: 0.67
Nodes (1): extractJobDetailsFromRssItem()

### Community 26 - "Generate LaTeX CV Flow"
Cohesion: 0.67
Nodes (1): generateLatexCv()

### Community 27 - "Tailor Resume to JD Flow"
Cohesion: 0.67
Nodes (1): tailorResumeToJobDescription()

### Community 28 - "Polish Text Flow"
Cohesion: 0.67
Nodes (1): polishText()

### Community 29 - "Generate Cover Letter Flow"
Cohesion: 0.67
Nodes (1): generateCoverLetter()

### Community 30 - "JD Match Score Flow"
Cohesion: 0.67
Nodes (1): calculateProfileJdMatch()

### Community 31 - "Extract HTML Text Flow"
Cohesion: 0.67
Nodes (1): extractTextFromHtml()

### Community 32 - "Suggest CV Section Order Flow"
Cohesion: 0.67
Nodes (1): suggestCvSectionOrder()

### Community 33 - "Improve Resume Flow"
Cohesion: 0.67
Nodes (1): improveResume()

### Community 34 - "Mobile Detection Hook"
Cohesion: 0.67
Nodes (1): useIsMobile()

### Community 35 - "Utility Functions"
Cohesion: 0.67
Nodes (1): cn()

## Ambiguous Edges - Review These
- `Firebase Authentication` → `NextAuth.js`  [AMBIGUOUS]
  docs/blueprint.md · relation: semantically_similar_to

## Knowledge Gaps
- **24 isolated node(s):** `Firebase Studio`, `Next.js`, `React`, `TypeScript`, `react-quill` (+19 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Fetch Utility Routes`** (5 nodes): `GET()`, `route.ts`, `route.ts`, `route.ts`, `route.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Chart Component`** (4 nodes): `cn()`, `useChart()`, `chart.tsx`, `chart.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Root Layout`** (3 nodes): `RootLayout()`, `layout.tsx`, `layout.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Dashboard Page`** (3 nodes): `fetchDashboardData()`, `page.tsx`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Billing Page`** (3 nodes): `BillingPage()`, `page.tsx`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Auth Layout`** (3 nodes): `AuthLayout()`, `layout.tsx`, `layout.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Logo Component`** (3 nodes): `ResumeForgeLogo()`, `resume-forge-logo.tsx`, `resume-forge-logo.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Badge Component`** (3 nodes): `Badge()`, `badge.tsx`, `badge.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Skeleton Component`** (3 nodes): `Skeleton()`, `skeleton.tsx`, `skeleton.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Form Section Component`** (3 nodes): `renderItem()`, `form-section.tsx`, `form-section.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Header Component`** (3 nodes): `Header()`, `header.tsx`, `header.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Main Nav Component`** (3 nodes): `updateClientHref()`, `main-nav.tsx`, `main-nav.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Extract Job Details Flow`** (3 nodes): `extractJobDetails()`, `extract-job-details-flow.ts`, `extract-job-details-flow.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Select Job Feed Flow`** (3 nodes): `selectJobFeed()`, `select-job-feed-flow.ts`, `select-job-feed-flow.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Extract Profile from CV Flow`** (3 nodes): `extractProfileFromCv()`, `extract-profile-from-cv-flow.ts`, `extract-profile-from-cv-flow.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Extract RSS Item Flow`** (3 nodes): `extractJobDetailsFromRssItem()`, `extract-rss-item-flow.ts`, `extract-rss-item-flow.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Generate LaTeX CV Flow`** (3 nodes): `generateLatexCv()`, `generate-latex-cv-flow.ts`, `generate-latex-cv-flow.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Tailor Resume to JD Flow`** (3 nodes): `tailor-resume-to-job-description.ts`, `tailorResumeToJobDescription()`, `tailor-resume-to-job-description.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Polish Text Flow`** (3 nodes): `polishText()`, `polish-text-flow.ts`, `polish-text-flow.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Generate Cover Letter Flow`** (3 nodes): `generateCoverLetter()`, `generate-cover-letter-flow.ts`, `generate-cover-letter-flow.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `JD Match Score Flow`** (3 nodes): `calculateProfileJdMatch()`, `calculate-profile-jd-match-flow.ts`, `calculate-profile-jd-match-flow.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Extract HTML Text Flow`** (3 nodes): `extractTextFromHtml()`, `extract-text-from-html-flow.ts`, `extract-text-from-html-flow.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Suggest CV Section Order Flow`** (3 nodes): `suggest-cv-section-order-flow.ts`, `suggestCvSectionOrder()`, `suggest-cv-section-order-flow.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Improve Resume Flow`** (3 nodes): `improveResume()`, `improve-resume-based-on-job-description.ts`, `improve-resume-based-on-job-description.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Mobile Detection Hook`** (3 nodes): `use-mobile.tsx`, `useIsMobile()`, `use-mobile.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Utility Functions`** (3 nodes): `utils.ts`, `utils.ts`, `cn()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Firebase Authentication` and `NextAuth.js`?**
  _Edge tagged AMBIGUOUS (relation: semantically_similar_to) - confidence is low._
- **Why does `toast()` connect `Resume Editor Page` to `CV Customization Modal`, `AI Provider Settings UI`, `Auth & App Layout`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Why does `onSubmit()` connect `CV Customization Modal` to `Resume Editor Page`, `AI Provider Settings UI`, `AI Flows Client`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Are the 43 inferred relationships involving `toast()` (e.g. with `onSubmit()` and `handleSetActive()`) actually correct?**
  _`toast()` has 43 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Firebase Studio`, `Next.js`, `React` to the rest of the system?**
  _24 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Resume Editor Page` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._
- **Should `Product Blueprint & Docs` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._