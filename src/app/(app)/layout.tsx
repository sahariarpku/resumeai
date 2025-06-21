
"use client";

import { Header } from "@/components/layout/header";
import { MainNav } from "@/components/layout/main-nav";
import { Sidebar, SidebarContent, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/auth-context";
import React from "react";
import { Loader2 } from "lucide-react";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser) {
    // AuthProvider is handling the redirect. We just show a loader here until the redirect happens.
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-2">Redirecting...</p>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarContent>
          <MainNav />
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-background overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </div>
  );
}
