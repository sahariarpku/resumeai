
"use client";

import Link from "next/link";
import React, { useState } from "react"; // Import useState
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserNav } from "@/components/layout/user-nav";
import { ResumeForgeLogo } from "@/components/resume-forge-logo";
import { Button } from "@/components/ui/button";
import { PlusCircle, Settings2 } from "lucide-react"; // Changed PlusCircle to Settings2
import { CvCustomizationModal } from "@/components/cv-customization-modal"; // Import the new modal

export function Header() {
  const [isCvModalOpen, setIsCvModalOpen] = useState(false);

  return (
    <>
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
          <Button onClick={() => setIsCvModalOpen(true)} size="sm"> {/* Changed action */}
            <Settings2 className="mr-2 h-4 w-4" /> {/* Changed icon */}
            Customize CV Output
          </Button>
          <UserNav />
        </div>
      </header>
      <CvCustomizationModal 
        isOpen={isCvModalOpen}
        onOpenChange={setIsCvModalOpen}
      />
    </>
  );
}
