import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Zap, FileText, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ResumeForgeLogo } from "@/components/resume-forge-logo";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b">
        <Link href="/" className="flex items-center justify-center" prefetch={false}>
          <ResumeForgeLogo />
          <span className="sr-only">ResumeForge</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link
            href="#features"
            className="text-sm font-medium hover:underline underline-offset-4 text-foreground"
            prefetch={false}
          >
            Features
          </Link>
          <Link
            href="#pricing"
            className="text-sm font-medium hover:underline underline-offset-4 text-foreground"
            prefetch={false}
          >
            Pricing
          </Link>
          <Button asChild variant="outline">
            <Link href="/dashboard" prefetch={false}>
              Sign In
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard" prefetch={false}>
              Get Started
            </Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-br from-primary/10 via-background to-accent/10">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                    Forge Your Future with AI-Powered Resumes
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    ResumeForge leverages cutting-edge AI to tailor your resume for any job, boosting your chances of landing your dream role.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button size="lg" asChild>
                    <Link href="/dashboard" prefetch={false}>
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
                src="https://placehold.co/600x400.png"
                width="600"
                height="400"
                alt="ResumeForge Hero Image"
                data-ai-hint="resume builder interface"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last lg:aspect-square shadow-xl"
              />
            </div>
          </div>
        </section>
        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary font-medium">
                  Key Features
                </div>
                <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl">
                  Everything You Need to Succeed
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  From AI-driven tailoring to secure storage, ResumeForge provides a comprehensive suite of tools for job seekers.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 lg:max-w-none pt-12">
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="pb-4">
                  <div className="p-2 bg-primary/10 rounded-md w-fit mb-2">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="font-headline">AI-Powered Tailoring</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Analyze job descriptions and instantly adapt your resume to highlight key skills and experience. ATS-optimized.
                  </p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="pb-4">
                  <div className="p-2 bg-primary/10 rounded-md w-fit mb-2">
                     <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="font-headline">Professional Details Hub</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Store all your career information – experiences, projects, skills, education – in one secure place.
                  </p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="pb-4">
                  <div className="p-2 bg-primary/10 rounded-md w-fit mb-2">
                     <Users className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="font-headline">Secure Cloud Storage</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Access your resumes and job descriptions anytime, anywhere. All data is stored securely.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        <section id="pricing" className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="font-headline text-3xl font-bold tracking-tighter md:text-4xl/tight">
                Simple, Transparent Pricing
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Get started for free, and upgrade when you need more power.
              </p>
            </div>
            <div className="mx-auto w-full max-w-sm space-y-2">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="font-headline">Free Tier</CardTitle>
                  <CardDescription>Perfect for getting started and occasional use.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <ul className="list-disc list-inside text-sm text-muted-foreground text-left">
                    <li>Basic AI Resume Tailoring</li>
                    <li>Store up to 3 Resumes</li>
                    <li>Store up to 3 Job Descriptions</li>
                  </ul>
                  <p className="text-4xl font-bold font-headline">$0<span className="text-sm font-normal text-muted-foreground">/month</span></p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" asChild>
                    <Link href="/dashboard" prefetch={false}>
                      Sign Up for Free
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
             <p className="text-xs text-muted-foreground">
                More plans coming soon!
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
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
