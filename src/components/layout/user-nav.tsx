
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Settings, CreditCard, LifeBuoy } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context"; // Import useAuth
import { useToast } from "@/hooks/use-toast"; // Import useToast
import { useRouter } from "next/navigation"; // Import useRouter

export function UserNav() {
  const { currentUser, logout, loading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push('/'); // Redirect to landing page after logout
    } catch (error) {
      toast({ title: "Logout Error", description: "Failed to log out. Please try again.", variant: "destructive" });
    }
  };

  if (loading) {
    // Optionally, show a skeleton or a simple loading state for the button
    return (
      <Button variant="ghost" className="relative h-9 w-9 rounded-full" disabled>
        <Avatar className="h-9 w-9">
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      </Button>
    );
  }

  if (!currentUser) {
    // If not logged in, maybe show a "Sign In" button or nothing
    // For simplicity, this nav is often only shown when logged in,
    // but here we'll make it disappear if no user (or show Sign In button)
    return (
      <Button asChild variant="outline" size="sm">
        <Link href="/auth/signin">Sign In</Link>
      </Button>
    );
  }

  const userDisplayName = currentUser.displayName || "User";
  const userEmail = currentUser.email || "No email provided";
  const avatarFallback = userDisplayName.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            {currentUser.photoURL && <AvatarImage src={currentUser.photoURL} alt={userDisplayName} />}
            <AvatarFallback>{avatarFallback}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userDisplayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {userEmail}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link href="/profile">
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
              <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
            </DropdownMenuItem>
          </Link>
          <Link href="/billing">
            <DropdownMenuItem>
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Billing</span>
              <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
            </DropdownMenuItem>
          </Link>
          <Link href="/settings">
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
              <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <Link href="/support">
          <DropdownMenuItem>
            <LifeBuoy className="mr-2 h-4 w-4" />
            <span>Support</span>
          </DropdownMenuItem>
        </Link>
        <DropdownMenuItem disabled>
          API (Coming Soon)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
