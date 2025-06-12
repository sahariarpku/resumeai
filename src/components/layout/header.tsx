"use client";

import Link from "next/link";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserNav } from "@/components/layout/user-nav";
import { ResumeForgeLogo } from "@/components/resume-forge-logo";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:hidden" />
        <Link href="/dashboard" className="hidden md:block">
          <ResumeForgeLogo />
        </Link>
      </div>
      
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <div className="ml-auto flex-1 sm:flex-initial">
          {/* Optional: Add a global search or quick action here */}
        </div>
        <Button asChild size="sm">
          <Link href="/tailor-resume">
            <PlusCircle className="mr-2 h-4 w-4" />
            Tailor New Resume
          </Link>
        </Button>
        <UserNav />
      </div>
    </header>
  );
}
