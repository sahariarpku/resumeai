
import { config } from 'dotenv';
config();

import '@/ai/flows/improve-resume-based-on-job-description.ts';
import '@/ai/flows/tailor-resume-to-job-description.ts';
import '@/ai/flows/extract-job-details-flow.ts';
import '@/ai/flows/extract-text-from-html-flow.ts';
import '@/ai/flows/calculate-profile-jd-match-flow.ts'; // Added new flow

    