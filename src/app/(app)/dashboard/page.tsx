"use client";

import React, { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, FileText, Sparkles, ArrowRight, ClipboardList, Lightbulb, User } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useAISettingsContext } from "@/contexts/ai-settings-context";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs, Timestamp } from "firebase/firestore";
import type { StoredResume, JobDescriptionItem } from "@/lib/types";

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const { hasActiveCombo, activeComboName } = useAISettingsContext();
  const [recentResumes, setRecentResumes] = useState<StoredResume[]>([]);
  const [recentJDs, setRecentJDs] = useState<JobDescriptionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) { setIsLoading(false); return; }
    async function fetchDashboardData() {
      try {
        const [resumeSnap, jdSnap] = await Promise.all([
          getDocs(query(collection(db, "users", currentUser!.uid, "resumes"), orderBy("createdAt", "desc"), limit(3))),
          getDocs(query(collection(db, "users", currentUser!.uid, "jobDescriptions"), orderBy("createdAt", "desc"), limit(3))),
        ]);
        setRecentResumes(resumeSnap.docs.map(d => {
          const data = d.data();
          return { ...data, id: d.id, createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString() } as StoredResume;
        }));
        setRecentJDs(jdSnap.docs.map(d => {
          const data = d.data();
          return { ...data, id: d.id, createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString() } as JobDescriptionItem;
        }));
      } catch { /* ignore */ } finally { setIsLoading(false); }
    }
    fetchDashboardData();
  }, [currentUser]);

  const displayName = currentUser?.displayName?.split(" ")[0] || "there";

  return (
    <div className="max-w-5xl mx-auto w-full space-y-6">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 pt-2">
        <div>
          <h1
            className="font-bold leading-tight"
            style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", letterSpacing: "-0.025em", color: "var(--t-text)" }}
          >
            Welcome back, {displayName}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--t-text-2)", fontFamily: "Lora, Georgia, serif" }}>
            Your AI-powered career toolkit is ready.
          </p>
        </div>
        {hasActiveCombo && (
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium self-start sm:self-auto"
            style={{ background: "rgba(31,138,101,0.1)", color: "var(--c-success)", border: "1px solid rgba(31,138,101,0.2)" }}
          >
            <span style={{ background: "var(--c-success)", width: 6, height: 6, borderRadius: "50%", display: "inline-block" }} />
            {activeComboName}
          </span>
        )}
      </div>

      {/* Quick action cards */}
      <div className="grid gap-4 md:grid-cols-3">

        {/* Primary CTA */}
        <Link
          href="/tailor-resume"
          className="group rounded-xl p-5 space-y-3 transition-all duration-200"
          style={{ background: "var(--t-cta-card)", border: "1px solid var(--t-border-1)", boxShadow: "rgba(0,0,0,0.2) 0px 4px 16px" }}
        >
          <div className="inline-flex items-center justify-center h-9 w-9 rounded-lg" style={{ background: "rgba(245,78,0,0.15)" }}>
            <Sparkles className="h-4 w-4" style={{ color: "var(--c-orange)" }} />
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: "var(--t-text)", letterSpacing: "-0.01em" }}>
              Tailor a Resume
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--t-cta-text)" }}>
              Match your profile to a job with AI
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs font-medium" style={{ color: "var(--c-orange)" }}>
            Start <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </div>
        </Link>

        {/* Profile */}
        <Link
          href="/profile"
          className="group rounded-xl p-5 space-y-3 transition-all duration-200"
          style={{ background: "var(--t-card-bg)", border: "1px solid var(--t-border-1)", boxShadow: "rgba(0,0,0,0.04) 0px 2px 8px" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "rgba(0,0,0,0.1) 0px 8px 24px"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "rgba(0,0,0,0.04) 0px 2px 8px"; }}
        >
          <div className="inline-flex items-center justify-center h-9 w-9 rounded-lg" style={{ background: "var(--t-surface-3)" }}>
            <User className="h-4 w-4" style={{ color: "var(--t-text)" }} />
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: "var(--t-text)", letterSpacing: "-0.01em" }}>My Profile</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--t-text-2)" }}>Update experience, skills, education</p>
          </div>
          <div className="flex items-center gap-1 text-xs font-medium transition-colors duration-150" style={{ color: "var(--t-text-2)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--c-crimson)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--t-text-2)"; }}
          >
            Edit <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </Link>

        {/* Jobs */}
        <Link
          href="/job-descriptions"
          className="group rounded-xl p-5 space-y-3 transition-all duration-200"
          style={{ background: "var(--t-card-bg)", border: "1px solid var(--t-border-1)", boxShadow: "rgba(0,0,0,0.04) 0px 2px 8px" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "rgba(0,0,0,0.1) 0px 8px 24px"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "rgba(0,0,0,0.04) 0px 2px 8px"; }}
        >
          <div className="inline-flex items-center justify-center h-9 w-9 rounded-lg" style={{ background: "var(--t-surface-3)" }}>
            <ClipboardList className="h-4 w-4" style={{ color: "var(--t-text)" }} />
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: "var(--t-text)", letterSpacing: "-0.01em" }}>Jobs to Apply</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--t-text-2)" }}>Track and manage your target roles</p>
          </div>
          <div className="flex items-center gap-1 text-xs font-medium" style={{ color: "var(--t-text-2)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--c-crimson)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--t-text-2)"; }}
          >
            View <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </Link>
      </div>

      {/* Recent data */}
      <div className="grid gap-4 md:grid-cols-2">

        {[
          {
            title: "Recent Resumes", href: "/resumes", icon: FileText,
            empty: { icon: FileText, text: "No resumes yet", cta: "Create resume", ctaHref: "/tailor-resume" },
            items: recentResumes.map(r => ({
              key: r.id, primary: r.name,
              secondary: new Date(r.createdAt as string).toLocaleDateString(),
              badge: null,
            })),
          },
          {
            title: "Saved Jobs", href: "/job-descriptions", icon: ClipboardList,
            empty: { icon: ClipboardList, text: "No jobs saved", cta: "Add a job", ctaHref: "/job-descriptions" },
            items: recentJDs.map(j => ({
              key: j.id, primary: j.title,
              secondary: j.company || "—",
              badge: j.matchPercentage != null ? `${j.matchPercentage}%` : null,
            })),
          },
        ].map(panel => (
          <div
            key={panel.title}
            className="rounded-xl p-5 space-y-4"
            style={{ background: "var(--t-card-bg)", border: "1px solid var(--t-border-1)" }}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm" style={{ color: "var(--t-text)", letterSpacing: "-0.01em" }}>{panel.title}</h2>
              <Link
                href={panel.href}
                className="text-xs transition-colors duration-150"
                style={{ color: "var(--t-text-2)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--c-crimson)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--t-text-2)")}
              >
                View all →
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {[1, 2].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
              </div>
            ) : panel.items.length === 0 ? (
              <div className="text-center py-8">
                <panel.empty.icon className="mx-auto h-8 w-8 mb-2" style={{ color: "var(--t-text-3)" }} />
                <p className="text-xs mb-3" style={{ color: "var(--t-text-3)" }}>{panel.empty.text}</p>
                <Link
                  href={panel.empty.ctaHref}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150"
                  style={{ background: "var(--t-surface-3)", color: "var(--t-text)", border: "1px solid var(--t-border-1)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--c-crimson)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--t-text)"; }}
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  {panel.empty.cta}
                </Link>
              </div>
            ) : (
              <ul className="space-y-2">
                {panel.items.map(item => (
                  <li
                    key={item.key}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors duration-150"
                    style={{ border: "1px solid var(--t-border-1)" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--t-surface-1)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate text-sm" style={{ color: "var(--t-text)" }}>{item.primary}</p>
                      <p className="text-xs" style={{ color: "var(--t-text-3)" }}>{item.secondary}</p>
                    </div>
                    {item.badge ? (
                      <span className="shrink-0 ml-2 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "var(--t-surface-3)", color: "var(--t-text-2)" }}>
                        {item.badge}
                      </span>
                    ) : (
                      <panel.icon className="h-3.5 w-3.5 flex-shrink-0 ml-2" style={{ color: "var(--t-text-3)" }} />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {/* Pro tip */}
      <div
        className="rounded-xl p-5 flex items-start gap-4"
        style={{ background: "rgba(245,78,0,0.04)", border: "1px solid rgba(245,78,0,0.12)" }}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: "rgba(245,78,0,0.1)" }}>
          <Lightbulb className="h-4 w-4" style={{ color: "var(--c-orange)" }} />
        </div>
        <div>
          <p className="font-semibold text-sm mb-0.5" style={{ color: "var(--t-text)" }}>Pro tip</p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--t-text-2)", fontFamily: "Lora, Georgia, serif" }}>
            Regularly update your profile with new achievements and skills. This makes AI tailoring more effective and saves time when applying for roles.
          </p>
        </div>
      </div>
    </div>
  );
}
