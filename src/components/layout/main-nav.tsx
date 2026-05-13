
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
  GraduationCap,
  Wrench,
  Award as CertificationIcon,
  FolderKanban,
  Trophy,
  BookOpen,
  Contact,
  LayoutList,
  ClipboardList,
  Search,
  ShieldAlert,
} from "lucide-react";
import { ResumeForgeLogo } from "../resume-forge-logo";
import { useAuth } from "@/contexts/auth-context";
import React, { useEffect, useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    href: "/profile", label: "My Profile", icon: User,
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
  { href: "/tailor-resume", label: "Tailor Resume", icon: Sparkles },
  { href: "/resumes", label: "My Resumes", icon: FileText },
  { href: "/job-descriptions", label: "Jobs to Apply", icon: ClipboardList },
  { href: "/job-search", label: "Job Search", icon: Search },
];

export function MainNav() {
  const pathname = usePathname();
  const { open } = useSidebar();
  const { isAdmin } = useAuth();
  const [currentClientHref, setCurrentClientHref] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const update = () => setCurrentClientHref(window.location.pathname + window.location.hash);
      update();
      window.addEventListener("hashchange", update);
      window.addEventListener("popstate", update);
      return () => { window.removeEventListener("hashchange", update); window.removeEventListener("popstate", update); };
    }
  }, [pathname]);

  return (
    <nav className="flex flex-col h-full" style={{ background: "var(--t-page-bg)" }}>
      {/* Logo */}
      <div
        className="px-4 h-14 flex items-center"
        style={{ borderBottom: "1px solid var(--t-border-1)" }}
      >
        {open ? (
          <Link href="/dashboard"><ResumeForgeLogo /></Link>
        ) : (
          <Link href="/dashboard" className="mx-auto">
            <Sparkles className="h-5 w-5" style={{ color: "var(--c-orange)" }} />
          </Link>
        )}
      </div>

      {/* Nav items */}
      <SidebarMenu className="flex-1 p-2 gap-0.5">
        {navItems.map((item) => {
          const isMainActive = item.href === "/dashboard"
            ? pathname === item.href
            : pathname.startsWith(item.href.split("#")[0]);

          return (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref legacyBehavior={false}>
                <SidebarMenuButton
                  variant="default"
                  size="default"
                  isActive={isMainActive}
                  className={cn("w-full justify-start rounded-md text-sm font-medium transition-all duration-150", !open && "justify-center")}
                  style={{
                    background: isMainActive ? "var(--t-surface-3)" : "transparent",
                    color: isMainActive ? "var(--t-text)" : "var(--t-text-2)",
                  }}
                  tooltip={open ? undefined : item.label}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {open && <span className="ml-2.5">{item.label}</span>}
                </SidebarMenuButton>
              </Link>

              {open && item.subItems && pathname.startsWith(item.href.split("#")[0]) && (
                <ul
                  className="pl-4 mt-0.5 space-y-0.5 ml-3"
                  style={{ borderLeft: "1px solid var(--t-border-1)" }}
                >
                  {item.subItems.map(subItem => {
                    const isSubActive = currentClientHref === subItem.href;
                    return (
                      <li key={subItem.href}>
                        <Link href={subItem.href} passHref legacyBehavior={false}>
                          <SidebarMenuButton
                            variant="ghost"
                            size="sm"
                            isActive={isSubActive}
                            className="w-full justify-start text-xs rounded-md transition-all duration-150"
                            style={{
                              background: isSubActive ? "var(--t-surface-3)" : "transparent",
                              color: isSubActive ? "var(--t-text)" : "var(--t-text-2)",
                            }}
                          >
                            <subItem.icon className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                            {subItem.label}
                          </SidebarMenuButton>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>

      {/* Admin */}
      {isAdmin && (
        <div className="p-2" style={{ borderTop: "1px solid var(--t-border-1)" }}>
          <Link href="/admin" passHref legacyBehavior={false}>
            <SidebarMenuButton
              variant="ghost"
              size="default"
              isActive={pathname.startsWith("/admin")}
              className={cn("w-full justify-start rounded-md text-sm transition-all duration-150", !open && "justify-center")}
              style={{ color: "var(--c-gold)" }}
              tooltip={open ? undefined : "Admin Panel"}
            >
              <ShieldAlert className="h-4 w-4" />
              {open && <span className="ml-2.5">Admin Panel</span>}
            </SidebarMenuButton>
          </Link>
        </div>
      )}
    </nav>
  );
}
