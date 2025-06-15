
"use client";

import Link from "next/link";
import React, { useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserNav } from "@/components/layout/user-nav";
import { ResumeForgeLogo } from "@/components/resume-forge-logo";
import { Button } from "@/components/ui/button";
import { Settings2, ListRestart } from "lucide-react"; // Added ListRestart
import { CvCustomizationModal } from "@/components/cv-customization-modal";
import { useAuth } from "@/contexts/auth-context"; // To potentially pass profile if needed
// Note: CvCustomizationModal needs access to currentProfile and a way to update it.
// For simplicity, we'll assume ProfilePage manages the profile state and CvCustomizationModal
// will fetch and save independently, or ProfilePage will handle it through props.
// For now, this modal is opened here, but the Profile Page itself also needs to pass data or a handler.
// A more robust solution might involve a global profile context.

export function Header() {
  const [isCvModalOpen, setIsCvModalOpen] = useState(false);
  // const { currentUser } = useAuth(); // Could be used to fetch profile if modal was self-contained for data

  // The CvCustomizationModal now requires `currentProfile` and `onOrderUpdate`.
  // Since Header doesn't own this data, this button will simply open the modal.
  // The actual data handling must occur on the Profile page or through a shared context.
  // For this iteration, the CV Customization button on the Profile page is the primary one.
  // This header button is more of a placeholder or would need significant refactoring
  // to manage profile state globally. We can make it open the modal, but its functionality
  // will depend on how `currentProfile` and `onOrderUpdate` are eventually handled if
  // this specific button is to be fully functional for reordering.
  // For now, I will remove the CvCustomizationModal instance from here as it's better managed
  // on the profile page directly where the profile data state exists.
  // The user will use the button on the Profile page for CV customization.

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
          {/* 
            Button to open CvCustomizationModal was here.
            It's better managed on the Profile page due to data dependencies.
            If global CV customization is needed from header, Profile context is advisable.
          */}
          <UserNav />
        </div>
      </header>
      {/* 
      <CvCustomizationModal 
        isOpen={isCvModalOpen}
        onOpenChange={setIsCvModalOpen}
        // currentProfile and onOrderUpdate would need to be sourced globally or passed down.
      />
      */}
    </>
  );
}
