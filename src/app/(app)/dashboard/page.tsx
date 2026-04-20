"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, FileText, Sparkles, ArrowRight, ClipboardList, Lightbulb, Bot } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useAISettingsContext } from "@/contexts/ai-settings-context";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs, Timestamp } from "firebase/firestore";
import type { StoredResume, JobDescriptionItem } from "@/lib/types";

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const { activeProvider } = useAISettingsContext();
  const [recentResumes, setRecentResumes] = useState<StoredResume[]>([]);
  const [recentJDs, setRecentJDs] = useState<JobDescriptionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }
    async function fetchDashboardData() {
      try {
        const [resumeSnap, jdSnap] = await Promise.all([
          getDocs(query(collection(db, "users", currentUser!.uid, "resumes"), orderBy("createdAt", "desc"), limit(3))),
          getDocs(query(collection(db, "users", currentUser!.uid, "jobDescriptions"), orderBy("createdAt", "desc"), limit(3))),
        ]);
        setRecentResumes(
          resumeSnap.docs.map((d) => {
            const data = d.data();
            return { ...data, id: d.id, createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString() } as StoredResume;
          })
        );
        setRecentJDs(
          jdSnap.docs.map((d) => {
            const data = d.data();
            return { ...data, id: d.id, createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString() } as JobDescriptionItem;
          })
        );
      } catch {
        // silently ignore dashboard fetch errors
      } finally {
        setIsLoading(false);
      }
    }
    fetchDashboardData();
  }, [currentUser]);

  const displayName = currentUser?.displayName?.split(" ")[0] || "there";

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight md:text-4xl">
            Welcome back, {displayName}!
          </h1>
          <p className="text-muted-foreground mt-1">Let&apos;s forge your next career move.</p>
        </div>
        {!activeProvider && (
          <Link href="/settings?tab=ai">
            <Badge variant="outline" className="text-amber-400 border-amber-500/30 bg-amber-500/10 gap-1.5 px-3 py-1.5 text-sm cursor-pointer hover:bg-amber-500/20 transition-colors">
              <Bot className="h-3.5 w-3.5" />
              Configure AI Provider
            </Badge>
          </Link>
        )}
        {activeProvider && (
          <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 bg-emerald-500/10 gap-1.5 px-3 py-1.5 text-sm">
            <Bot className="h-3.5 w-3.5" />
            {activeProvider.name} · {activeProvider.model}
          </Badge>
        )}
      </div>

      {/* Action cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card className="bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Tailor a New Resume</CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Craft a resume perfectly matched to a specific job using AI.
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
              <Link href="/profile">Edit Profile <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Jobs to Apply</CardTitle>
            <CardDescription>Manage jobs you&apos;re targeting.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/job-descriptions">
                <ClipboardList className="mr-2 h-4 w-4" />
                View Jobs <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent data */}
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-headline">Recent Resumes</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/resumes">View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <Skeleton key={i} className="h-14 w-full rounded-md" />)}
              </div>
            ) : recentResumes.length === 0 ? (
              <div className="text-center py-6">
                <FileText className="mx-auto h-10 w-10 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No resumes yet.</p>
                <Button size="sm" variant="outline" className="mt-3" asChild>
                  <Link href="/tailor-resume"><PlusCircle className="mr-1.5 h-3.5 w-3.5" />Create one</Link>
                </Button>
              </div>
            ) : (
              <ul className="space-y-3">
                {recentResumes.map((resume) => (
                  <li key={resume.id} className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50">
                    <div className="min-w-0">
                      <p className="font-medium truncate text-sm">{resume.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(resume.createdAt as string).toLocaleDateString()}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-headline">Saved Jobs</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/job-descriptions">View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <Skeleton key={i} className="h-14 w-full rounded-md" />)}
              </div>
            ) : recentJDs.length === 0 ? (
              <div className="text-center py-6">
                <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No jobs saved yet.</p>
                <Button size="sm" variant="outline" className="mt-3" asChild>
                  <Link href="/job-descriptions"><PlusCircle className="mr-1.5 h-3.5 w-3.5" />Add a job</Link>
                </Button>
              </div>
            ) : (
              <ul className="space-y-3">
                {recentJDs.map((jd) => (
                  <li key={jd.id} className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50">
                    <div className="min-w-0">
                      <p className="font-medium truncate text-sm">{jd.title}</p>
                      <p className="text-xs text-muted-foreground">{jd.company || "Unknown company"}</p>
                    </div>
                    {jd.matchPercentage !== undefined && (
                      <Badge variant="secondary" className="shrink-0 ml-2 text-xs">
                        {jd.matchPercentage}%
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pro tip */}
      <Card className="mt-8 border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-4 p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15">
            <Lightbulb className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm mb-1">Pro Tip</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Regularly update your profile with new achievements and skills. This makes AI tailoring more effective and saves time when applying for roles.
              {!activeProvider && (
                <span className="ml-1">
                  <Link href="/settings?tab=ai" className="text-primary hover:underline font-medium">
                    Set up an AI provider
                  </Link>{" "}
                  to unlock all features.
                </span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
