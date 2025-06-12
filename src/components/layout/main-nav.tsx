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
  BookUser,
  GraduationCap,
  Wrench,
  Award,
  Lightbulb,
  FolderKanban
} from "lucide-react";
import { ResumeForgeLogo } from "../resume-forge-logo";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profile", label: "My Profile", icon: User,
    subItems: [
        { href: "/profile#work-experience", label: "Work Experience", icon: Briefcase },
        { href: "/profile#projects", label: "Projects", icon: FolderKanban },
        { href: "/profile#education", label: "Education", icon: GraduationCap },
        { href: "/profile#skills", label: "Skills", icon: Wrench },
        { href: "/profile#certifications", label: "Certifications", icon: Award },
    ]
  },
  { href: "/job-descriptions", label: "Job Descriptions", icon: Briefcase },
  { href: "/resumes", label: "My Resumes", icon: FileText },
  { href: "/tailor-resume", label: "Tailor New Resume", icon: Sparkles },
];

export function MainNav() {
  const pathname = usePathname();
  const { open } = useSidebar();

  return (
    <nav className="flex flex-col h-full">
      <div className="p-4 border-b border-sidebar-border h-16 flex items-center">
        {open && <Link href="/dashboard"><ResumeForgeLogo className="text-sidebar-foreground" /></Link>}
        {!open && <Link href="/dashboard"><Sparkles className="h-8 w-8 text-sidebar-primary" /></Link>}
      </div>
      <SidebarMenu className="flex-1 p-2">
        {navItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href} passHref legacyBehavior>
              <SidebarMenuButton
                variant="default"
                size="default"
                isActive={pathname.startsWith(item.href) && (item.href === "/dashboard" ? pathname === item.href : true) } // More specific active check for dashboard
                className={cn(
                  "w-full justify-start",
                  !open && "justify-center"
                )}
                tooltip={open ? undefined : item.label}
              >
                <item.icon className="h-5 w-5" />
                {open && <span className="ml-2">{item.label}</span>}
              </SidebarMenuButton>
            </Link>
             {/* Render sub-items if they exist and sidebar is open */}
             {open && item.subItems && pathname.startsWith(item.href) && (
                <ul className="pl-6 mt-1 space-y-1 border-l border-sidebar-border ml-3">
                  {item.subItems.map(subItem => (
                    <li key={subItem.href}>
                       <Link href={subItem.href} passHref legacyBehavior>
                        <SidebarMenuButton
                            variant="ghost"
                            size="sm"
                            isActive={pathname === subItem.href || (pathname + location.hash) === subItem.href}
                            className="w-full justify-start text-sm"
                        >
                            <subItem.icon className="h-4 w-4 mr-2 text-sidebar-foreground/70" />
                            {subItem.label}
                        </SidebarMenuButton>
                       </Link>
                    </li>
                  ))}
                </ul>
            )}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
      {open && (
        <div className="p-4 mt-auto border-t border-sidebar-border">
             <Link href="/settings" passHref legacyBehavior>
                <SidebarMenuButton
                    variant="ghost"
                    size="default"
                    isActive={pathname.startsWith("/settings")}
                    className="w-full justify-start"
                >
                    <Settings className="h-5 w-5" />
                    <span className="ml-2">Settings</span>
                </SidebarMenuButton>
             </Link>
        </div>
      )}
    </nav>
  );
}
