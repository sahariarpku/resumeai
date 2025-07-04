
import { config } from 'dotenv';
config();

import '@/ai/flows/improve-resume-based-on-job-description.ts';
import '@/ai/flows/tailor-resume-to-job-description.ts';
import '@/ai/flows/extract-job-details-flow.ts';
import '@/ai/flows/extract-text-from-html-flow.ts';
import '@/ai/flows/calculate-profile-jd-match-flow.ts';
import '@/ai/flows/polish-text-flow.ts'; // Added new flow
import '@/ai/flows/generate-cover-letter-flow.ts'; // Added cover letter flow
import '@/ai/flows/suggest-cv-section-order-flow.ts'; // Added CV reordering flow
import '@/ai/flows/generate-latex-cv-flow.ts'; // Added LaTeX CV generation flow
import '@/ai/flows/extract-rss-item-flow.ts'; // Added new flow for RSS item parsing
import '@/ai/flows/extract-profile-from-cv-flow.ts'; // Added new flow for CV parsing
import '@/ai/flows/select-job-feed-flow.ts'; // Added new flow for selecting job feed
