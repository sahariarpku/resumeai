
"use client";

import Link from "next/link";
import React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserNav } from "@/components/layout/user-nav";
import { ResumeForgeLogo } from "@/components/resume-forge-logo";
import { ThemeToggle } from "@/components/theme-toggle";

export function Header() {
  return (
    <header
      className="sticky top-0 z-30 flex h-14 items-center gap-4 px-4 md:px-6"
      style={{
        background: "var(--t-header-bg)",
        backdropFilter: "blur(14px)",
        borderBottom: "1px solid var(--t-border-1)",
      }}
    >
      <div className="flex items-center gap-3">
        <SidebarTrigger
          className="h-8 w-8 rounded-md transition-colors duration-150"
          style={{ color: "var(--t-text-2)" }}
        />
        <Link href="/dashboard" className="hidden md:flex items-center">
          <ResumeForgeLogo />
        </Link>
      </div>

      <div className="flex w-full items-center justify-end gap-3">
        <ThemeToggle />
        <UserNav />
      </div>
    </header>
  );
}
