
"use client";

import { Header } from "@/components/layout/header";
import { MainNav } from "@/components/layout/main-nav";
import { Sidebar, SidebarContent, SidebarInset, SidebarRail } from "@/components/ui/sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
