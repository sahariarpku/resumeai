
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Settings, CreditCard, LifeBuoy } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export function UserNav() {
  const { currentUser, logout, loading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: "Signed out" });
      router.push("/");
    } catch {
      toast({ title: "Error", description: "Failed to sign out.", variant: "destructive" });
    }
  };

  if (loading) {
    return <div className="h-8 w-8 rounded-full animate-pulse" style={{ background: "var(--t-surface-3)" }} />;
  }

  if (!currentUser) {
    return (
      <Link
        href="/auth/signin"
        className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150"
        style={{ background: "var(--t-surface-3)", color: "var(--t-text)", border: "1px solid var(--t-border-1)" }}
      >
        Sign in
      </Link>
    );
  }

  const userDisplayName = currentUser.displayName || "User";
  const userEmail = currentUser.email || "";
  const avatarFallback = userDisplayName.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative h-8 w-8 rounded-full transition-opacity duration-150 hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500">
          <Avatar className="h-8 w-8">
            {currentUser.photoURL && <AvatarImage src={currentUser.photoURL} alt={userDisplayName} />}
            <AvatarFallback
              className="text-xs font-semibold"
              style={{ background: "var(--t-surface-3)", color: "var(--t-text)" }}
            >
              {avatarFallback}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-56 rounded-xl p-1"
        align="end"
        forceMount
        style={{
          background: "var(--t-card-bg)",
          border: "1px solid var(--t-border-1)",
          boxShadow: "rgba(0,0,0,0.15) 0px 10px 36px, rgba(0,0,0,0.08) 0px 3px 10px",
          color: "var(--t-text)",
        }}
      >
        <DropdownMenuLabel className="px-2 py-1.5">
          <p className="text-sm font-semibold leading-none" style={{ color: "var(--t-text)" }}>
            {userDisplayName}
          </p>
          <p className="mt-0.5 text-xs leading-none" style={{ color: "var(--t-text-2)" }}>
            {userEmail}
          </p>
        </DropdownMenuLabel>

        <DropdownMenuSeparator style={{ background: "var(--t-border-1)" }} />

        <DropdownMenuGroup>
          {[
            { href: "/profile", icon: User, label: "Profile" },
            { href: "/billing", icon: CreditCard, label: "Billing" },
            { href: "/settings", icon: Settings, label: "Settings" },
          ].map(({ href, icon: Icon, label }) => (
            <Link href={href} key={href}>
              <DropdownMenuItem
                className="rounded-lg cursor-pointer text-sm gap-2 px-2 py-1.5 transition-colors duration-150"
                style={{ color: "var(--t-text-2)" }}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </DropdownMenuItem>
            </Link>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator style={{ background: "var(--t-border-1)" }} />

        <Link href="/support">
          <DropdownMenuItem className="rounded-lg cursor-pointer text-sm gap-2 px-2 py-1.5 transition-colors duration-150" style={{ color: "var(--t-text-2)" }}>
            <LifeBuoy className="h-3.5 w-3.5" />
            Support
          </DropdownMenuItem>
        </Link>

        <DropdownMenuSeparator style={{ background: "var(--t-border-1)" }} />

        <DropdownMenuItem
          onClick={handleLogout}
          className="rounded-lg cursor-pointer text-sm gap-2 px-2 py-1.5 transition-colors duration-150"
          style={{ color: "var(--c-crimson)" }}
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
