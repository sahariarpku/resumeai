
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  User, 
  Briefcase, 
  FileText, 
  Sparkles,
  Settings,
  GraduationCap,
  Wrench,
  Award as CertificationIcon, // Renamed to avoid conflict
  Lightbulb,
  FolderKanban,
  Trophy, // For Honors & Awards
  BookOpen, // For Publications
  Contact, // For References
  LayoutList, // For Custom Sections
  ClipboardList, // Icon for "Jobs to Apply"
  Rss // Icon for "Jobs RSS"
} from "lucide-react";
import { ResumeForgeLogo } from "../resume-forge-logo";
import React, { useEffect, useState } from "react"; 

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profile", label: "My Profile", icon: User,
    subItems: [
        { href: "/profile#work-experience", label: "Work Experience", icon: Briefcase },
        { href: "/profile#projects", label: "Projects", icon: FolderKanban },
        { href: "/profile#education", label: "Education", icon: GraduationCap },
        { href: "/profile#honors-awards", label: "Honors & Awards", icon: Trophy },
        { href: "/profile#publications", label: "Publications", icon: BookOpen },
        { href: "/profile#skills", label: "Skills", icon: Wrench },
        { href: "/profile#certifications", label: "Certifications", icon: CertificationIcon },
        { href: "/profile#references", label: "References", icon: Contact },
        { href: "/profile#custom-sections", label: "Custom Sections", icon: LayoutList },
    ]
  },
  { href: "/tailor-resume", label: "Tailor New Resume", icon: Sparkles },
  { href: "/resumes", label: "My Resumes", icon: FileText },
  { href: "/job-descriptions", label: "Jobs to Apply", icon: ClipboardList },
  { href: "/jobs-rss", label: "Jobs RSS", icon: Rss },
];

export function MainNav() {
  const pathname = usePathname();
  const { open } = useSidebar();
  const [currentClientHref, setCurrentClientHref] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const updateClientHref = () => {
        setCurrentClientHref(window.location.pathname + window.location.hash);
      };

      updateClientHref(); 

      window.addEventListener('hashchange', updateClientHref);
      window.addEventListener('popstate', updateClientHref); 

      return () => {
        window.removeEventListener('hashchange', updateClientHref);
        window.removeEventListener('popstate', updateClientHref);
      };
    }
  }, [pathname]); 


  return (
    <nav className="flex flex-col h-full">
      <div className="p-4 border-b border-sidebar-border h-16 flex items-center">
        {open && <Link href="/dashboard"><ResumeForgeLogo className="text-sidebar-foreground" /></Link>}
        {!open && <Link href="/dashboard"><Sparkles className="h-8 w-8 text-sidebar-primary" /></Link>}
      </div>
      <SidebarMenu className="flex-1 p-2">
        {navItems.map((item) => {
          const isMainActive = item.href === "/dashboard" 
            ? pathname === item.href 
            : pathname.startsWith(item.href.split('#')[0]);

          return (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref legacyBehavior={item.subItems ? undefined : false}>
                <span>
                  <SidebarMenuButton
                    variant="default"
                    size="default"
                    isActive={isMainActive}
                    className={cn(
                      "w-full justify-start",
                      !open && "justify-center"
                    )}
                    tooltip={open ? undefined : item.label}
                  >
                    <item.icon className="h-5 w-5" />
                    {open && <span className="ml-2">{item.label}</span>}
                  </SidebarMenuButton>
                </span>
              </Link>
               {open && item.subItems && pathname.startsWith(item.href.split('#')[0]) && (
                  <ul className="pl-6 mt-1 space-y-1 border-l border-sidebar-border ml-3">
                    {item.subItems.map(subItem => (
                      <li key={subItem.href}>
                         <Link href={subItem.href} passHref legacyBehavior={false}>
                          <span>
                            <SidebarMenuButton
                                variant="ghost"
                                size="sm"
                                isActive={currentClientHref === subItem.href}
                                className="w-full justify-start text-sm"
                            >
                                <subItem.icon className="h-4 w-4 mr-2 text-sidebar-foreground/70" />
                                {subItem.label}
                            </SidebarMenuButton>
                          </span>
                         </Link>
                      </li>
                    ))}
                  </ul>
              )}
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
      {open && (
        <div className="p-4 mt-auto border-t border-sidebar-border">
             <Link href="/settings" passHref legacyBehavior={false}>
                <span>
                  <SidebarMenuButton
                      variant="ghost"
                      size="default"
                      isActive={pathname.startsWith("/settings")}
                      className="w-full justify-start"
                  >
                      <Settings className="h-5 w-5" />
                      <span className="ml-2">Settings</span>
                  </SidebarMenuButton>
                </span>
             </Link>
        </div>
      )}
    </nav>
  );
}
