import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, FileText, Briefcase, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function DashboardPage() {
  const recentResumes = [
    { id: "1", name: "Software Engineer - Google", date: "2024-07-15" },
    { id: "2", name: "Product Manager - Facebook", date: "2024-07-10" },
  ];

  const recentJDs = [
    { id: "1", title: "Senior Frontend Developer", company: "Acme Corp" },
    { id: "2", title: "UX Designer", company: "Innovate Ltd" },
  ];

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="font-headline text-3xl font-bold tracking-tight md:text-4xl">Welcome back!</h1>
        <p className="text-muted-foreground">Let&apos;s forge your next career move.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card className="bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Tailor a New Resume</CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Craft a resume perfectly matched to a specific job description using AI.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="lg" className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90" asChild>
              <Link href="/tailor-resume">
                <Sparkles className="mr-2 h-5 w-5" />
                Start Tailoring
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Manage Your Profile</CardTitle>
            <CardDescription>Keep your professional details up-to-date.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/profile">
                Edit Profile <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Job Descriptions</CardTitle>
            <CardDescription>Manage your saved job descriptions.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/job-descriptions">
                View JDs <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-headline">Recent Resumes</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/resumes">View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentResumes.length > 0 ? (
              <ul className="space-y-3">
                {recentResumes.map((resume) => (
                  <li key={resume.id} className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50">
                    <div>
                      <p className="font-medium">{resume.name}</p>
                      <p className="text-sm text-muted-foreground">Generated: {resume.date}</p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/resumes/${resume.id}`}>View</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No recent resumes.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-headline">Saved Job Descriptions</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/job-descriptions">View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentJDs.length > 0 ? (
              <ul className="space-y-3">
                {recentJDs.map((jd) => (
                  <li key={jd.id} className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50">
                    <div>
                      <p className="font-medium">{jd.title}</p>
                      <p className="text-sm text-muted-foreground">{jd.company}</p>
                    </div>
                     <Button variant="outline" size="sm" asChild>
                      <Link href={`/job-descriptions/${jd.id}`}>View</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No saved job descriptions.</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card className="mt-8">
        <CardHeader>
            <CardTitle className="font-headline text-xl">Pro Tip!</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
            <Image src="https://placehold.co/100x100.png" alt="Pro tip illustration" data-ai-hint="lightbulb idea" width={80} height={80} className="rounded-lg"/>
            <div>
                <p className="text-muted-foreground">
                Regularly update your core profile with new achievements and skills. This makes AI tailoring even more effective and saves you time when applying for new roles!
                </p>
            </div>
        </CardContent>
      </Card>

    </div>
  );
}
