import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LifeBuoy, MessageCircle, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const FAQS = [
  {
    q: "How do I set up an AI provider?",
    a: "Go to Settings → AI Integration. Choose a provider (e.g. OpenAI or Groq), click Configure, enter your API key, and click Set Active. All AI features will then use that provider.",
  },
  {
    q: "Which AI providers are supported?",
    a: "Google Gemini, OpenAI, Anthropic, Groq, OpenRouter, Mistral AI, Ollama (local), and any custom OpenAI-compatible endpoint.",
  },
  {
    q: "Where is my API key stored?",
    a: "API keys are stored only in your browser's local storage. They are never sent to our servers — they go directly from your browser to your chosen AI provider.",
  },
  {
    q: "How do I tailor my resume to a job?",
    a: "First add a job description under 'Jobs to Apply', then go to 'Tailor New Resume', paste your resume or load your profile, add the job description, and click Tailor Resume.",
  },
  {
    q: "Can I export my resume as PDF?",
    a: "Yes. Go to My Resumes, open any resume's download menu, and choose 'Save as PDF'. Your browser's print dialog will open — select 'Save as PDF' as the destination.",
  },
  {
    q: "Why is my match percentage low?",
    a: "Match percentage reflects how closely your profile keywords align with the job description. Update your profile with relevant skills and experience to improve your match.",
  },
  {
    q: "Is my data private?",
    a: "Your profile and resumes are stored in your own Firebase account. API keys never leave your browser. We do not have access to your generated resumes or AI conversations.",
  },
];

export default function SupportPage() {
  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="font-headline text-3xl font-bold tracking-tight md:text-4xl">Support</h1>
        <p className="text-muted-foreground mt-1">Find help and resources for using ResumeForge.</p>
      </div>

      <div className="space-y-6">
        {/* FAQs */}
        <Card>
          <CardHeader>
            <LifeBuoy className="h-8 w-8 text-primary mb-2" />
            <CardTitle className="font-headline">Frequently Asked Questions</CardTitle>
            <CardDescription>Answers to common questions about ResumeForge.</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {FAQS.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-left text-sm font-medium">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed">{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <MessageCircle className="h-8 w-8 text-primary mb-2" />
            <CardTitle className="font-headline">Get in Touch</CardTitle>
            <CardDescription>Found a bug or have a feature request?</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" className="gap-2" asChild>
              <Link href="https://github.com" target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4" />
                Open an Issue on GitHub
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
