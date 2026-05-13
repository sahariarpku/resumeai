
"use client";

import { Github, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import React from "react";

const GoogleIcon = () => (
  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    <path d="M1 1h22v22H1z" fill="none"/>
  </svg>
);

export default function LandingPage() {
  const { signInWithGoogle, signInWithGitHub, loading: authLoading } = useAuth();

  return (
    <div
      className="flex flex-col min-h-screen transition-colors duration-200"
      style={{ background: "var(--t-page-bg)", color: "var(--t-text)" }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-20 flex items-center justify-between px-6 md:px-10 h-14"
        style={{ background: "var(--t-header-bg)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--t-border-1)" }}
      >
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-lg"
          style={{ color: "var(--t-text)", letterSpacing: "-0.02em" }}
        >
          <Sparkles className="h-4 w-4" style={{ color: "var(--c-orange)" }} />
          Resume-AI
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href="/auth/signin"
            className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150"
            style={{ color: "var(--t-text-2)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--c-crimson)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--t-text-2)")}
          >
            Sign in
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <main className="flex flex-1 items-center justify-center px-4 py-16 md:py-24">
        <div className="w-full max-w-5xl grid md:grid-cols-2 gap-12 md:gap-20 items-center">

          {/* Left — headline */}
          <div className="space-y-6">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
              style={{ background: "var(--t-surface-3)", color: "var(--t-text-2)", border: "1px solid var(--t-border-1)" }}
            >
              <span style={{ background: "var(--c-success)", width: 6, height: 6, borderRadius: "50%", display: "inline-block" }} />
              AI-powered career tools
            </div>

            <h1
              className="font-bold leading-tight"
              style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", letterSpacing: "-0.03em", color: "var(--t-text)", lineHeight: 1.1 }}
            >
              Craft resumes that<br />
              <span style={{ color: "var(--c-orange)" }}>land interviews</span>
            </h1>

            <p
              className="leading-relaxed max-w-md"
              style={{ fontSize: "1.05rem", color: "var(--t-text-2)", fontFamily: "Lora, Georgia, serif", lineHeight: 1.6 }}
            >
              Tailor every resume to the job description with AI. One profile, endless tailored versions — each optimized to get through ATS and impress hiring managers.
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              {["AI Tailoring", "PDF Export", "Cover Letters", "Job Matching"].map(tag => (
                <span key={tag} className="pill-tag">{tag}</span>
              ))}
            </div>
          </div>

          {/* Right — sign-in card */}
          <div
            className="w-full max-w-sm mx-auto rounded-xl p-8 space-y-5"
            style={{
              background: "var(--t-card-bg)",
              border: "1px solid var(--t-border-1)",
              boxShadow: "rgba(0,0,0,0.1) 0px 8px 32px, rgba(0,0,0,0.05) 0px 2px 8px",
            }}
          >
            <div className="space-y-1">
              <h2 className="font-semibold text-lg" style={{ letterSpacing: "-0.02em", color: "var(--t-text)" }}>
                Get started
              </h2>
              <p className="text-sm" style={{ color: "var(--t-text-2)" }}>
                Sign in with your social account
              </p>
            </div>

            <div className="space-y-3">
              {[
                { icon: <GoogleIcon />, label: "Continue with Google", action: signInWithGoogle },
                { icon: <Github className="h-4 w-4 mr-2" />, label: "Continue with GitHub", action: signInWithGitHub },
              ].map(({ icon, label, action }) => (
                <button
                  key={label}
                  onClick={action}
                  disabled={authLoading}
                  className="w-full flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-150 disabled:opacity-50"
                  style={{ background: "var(--t-surface-3)", color: "var(--t-text)", border: "1px solid var(--t-border-1)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--c-crimson)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--t-text)"; }}
                >
                  {authLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : icon}
                  {label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: "var(--t-border-1)" }} />
              <span className="text-xs" style={{ color: "var(--t-text-3)" }}>or</span>
              <div className="flex-1 h-px" style={{ background: "var(--t-border-1)" }} />
            </div>

            <Link
              href="/auth/signin"
              className="w-full flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-150"
              style={{ background: "transparent", color: "var(--t-text-2)", border: "1px solid var(--t-border-2)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--c-crimson)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--t-text-2)"; }}
            >
              Sign in with Email
            </Link>

            <p className="text-center text-xs" style={{ color: "var(--t-text-3)" }}>
              No account?{" "}
              <Link
                href="/auth/signup"
                className="font-medium transition-colors duration-150"
                style={{ color: "var(--t-text-2)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--c-orange)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--t-text-2)")}
              >
                Create one →
              </Link>
            </p>

            <p className="text-center text-xs" style={{ color: "var(--t-text-3)" }}>
              By signing in you agree to our{" "}
              <Link href="#" className="underline">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="py-6 px-6 md:px-10 flex items-center justify-between"
        style={{ borderTop: "1px solid var(--t-border-1)", color: "var(--t-text-3)", fontSize: "12px" }}
      >
        <span>© 2025 Resume-AI</span>
        <span>Built with AI</span>
      </footer>
    </div>
  );
}
