
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, UserCircle, CheckCircle, Zap } from "lucide-react"; // Added Zap for consistency if Sparkles is used elsewhere.
import Link from "next/link";
import Image from "next/image";
import { ResumeForgeLogo } from "@/components/resume-forge-logo";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
        <Link href="/" className="flex items-center justify-center" prefetch={false}>
          <ResumeForgeLogo />
          <span className="sr-only">ResumeForge</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link
            href="#features"
            className="text-sm font-medium hover:underline underline-offset-4 text-foreground"
            prefetch={false}
          >
            Features
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link href="/auth/signin" prefetch={false}>
              Sign In
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/auth/signup" prefetch={false}>
              Get Started
            </Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-40 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="container px-4 md:px-6">
            <div className="grid gap-8 lg:grid-cols-[1fr_500px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-6">
                <div className="space-y-3">
                  <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                    Forge Your Future: AI-Powered Resumes, Perfectly Tailored.
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Stop guessing, start impressing. ResumeForge uses AI to craft compelling resumes that get noticed by employers.
                  </p>
                </div>
                <div className="flex flex-col gap-3 min-[400px]:flex-row">
                  <Button size="lg" asChild className="shadow-lg hover:shadow-xl transition-shadow">
                    <Link href="/auth/signup" prefetch={false}>
                      Start Building Free
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                     <Link href="#features" prefetch={false}>
                        Learn More
                     </Link>
                  </Button>
                </div>
              </div>
              <Image
                src="https://placehold.co/600x500.png" // Adjusted aspect ratio slightly
                width="600"
                height="500"
                alt="Modern resume builder interface showing a polished resume"
                data-ai-hint="modern workspace resume" // Keep hint
                className="mx-auto aspect-[6/5] overflow-hidden rounded-xl object-cover object-center sm:w-full lg:order-last shadow-xl"
              />
            </div>
          </div>
        </section>
        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm font-medium text-primary">
                Core Benefits
              </div>
              <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl">
                Unlock Your Career Potential
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Our intelligent tools streamline your job application process from start to finish.
              </p>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 lg:max-w-none">
              <Card className="hover:shadow-lg transition-shadow duration-300 border-border/80">
                <CardHeader className="pb-4">
                  <div className="p-3 bg-primary/10 rounded-full w-fit mb-3">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="font-headline text-xl">Intelligent AI Tailoring</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Instantly adapt your resume to any job description, highlighting your most relevant skills and experiences. ATS-friendly.
                  </p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-shadow duration-300 border-border/80">
                <CardHeader className="pb-4">
                  <div className="p-3 bg-primary/10 rounded-full w-fit mb-3">
                     <UserCircle className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="font-headline text-xl">Centralized Profile Hub</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Manage all your career details—experience, education, projects, and skills—in one organized and easily accessible place.
                  </p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-shadow duration-300 border-border/80">
                <CardHeader className="pb-4">
                  <div className="p-3 bg-primary/10 rounded-full w-fit mb-3">
                     <CheckCircle className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="font-headline text-xl">Effortless Application Prep</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Generate tailored resumes and cover letters quickly, so you can focus on applying, networking, and landing interviews.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        <section id="cta" className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-4">
              <h2 className="font-headline text-3xl font-bold tracking-tighter md:text-4xl/tight">
                Ready to Forge Your Next Career Move?
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Join ResumeForge today and experience the power of AI in your job search.
              </p>
            </div>
            <div className="mx-auto w-full max-w-sm space-y-2">
              <Button size="lg" className="w-full shadow-md hover:shadow-lg" asChild>
                <Link href="/auth/signup" prefetch={false}>
                  Sign Up for Free
                </Link>
              </Button>
            </div>
             <p className="text-xs text-muted-foreground pt-2">
                Get started in minutes. No credit card required.
              </p>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} ResumeForge. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4 text-muted-foreground" prefetch={false}>
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4 text-muted-foreground" prefetch={false}>
            Privacy Policy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
