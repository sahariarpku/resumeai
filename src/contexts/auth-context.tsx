
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut, GoogleAuthProvider, GithubAuthProvider, signInWithPopup, AuthError } from 'firebase/auth';
import { auth } from '@/lib/firebase'; // Adjust path as necessary
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast"; // Import useToast

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    }, (error) => {
      // This error callback for onAuthStateChanged is important too
      console.error("onAuthStateChanged error:", error);
      setLoading(false); // Ensure loading is set to false even on error
      if (error.code === 'auth/network-request-failed') {
        toast({
          title: "Network Error",
          description: "Failed to connect to Firebase Authentication. Please check your internet connection and Firebase configuration (Authorized Domains).",
          variant: "destructive",
          duration: 10000, // Longer duration for important errors
        });
      }
    });
    return () => unsubscribe();
  }, [toast]);

  const handleSocialSignInSuccess = (user: User) => {
    setCurrentUser(user);
    toast({ title: "Signed In Successfully!" });
    router.push("/dashboard");
  };

  const handleSocialSignInError = (error: any, providerName: string) => {
    console.error(`${providerName} sign in error:`, error);
    let errorMessage = `Failed to sign in with ${providerName}. Please try again.`;
    if (error instanceof Error) {
        const authError = error as AuthError;
        if (authError.code === 'auth/network-request-failed') {
            errorMessage = `Network request failed during ${providerName} sign-in. Please check your internet connection, ensure domains are authorized in Firebase, and that Firebase project config is correct.`;
        } else if (authError.code === 'auth/account-exists-with-different-credential') {
            errorMessage = `An account already exists with this email using a different sign-in method. Try signing in with that method.`;
        } else if (authError.code === 'auth/popup-closed-by-user') {
            errorMessage = `Sign-in popup was closed. Please try again.`;
        } else if (authError.code === 'auth/cancelled-popup-request') {
            errorMessage = `Sign-in was cancelled. Please try again.`;
        } else if (authError.code === 'auth/unauthorized-domain') {
            errorMessage = `This domain is not authorized for ${providerName} sign-in. Please contact support or check Firebase console configuration (Authentication > Sign-in method > Authorized domains).`;
        } else if (authError.code === 'auth/operation-not-allowed') {
            errorMessage = `${providerName} sign-in is not enabled. Please contact support or check Firebase console configuration.`;
        }
    }
    toast({
      title: `${providerName} Sign In Failed`,
      description: errorMessage,
      variant: "destructive",
      duration: 10000,
    });
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      handleSocialSignInSuccess(result.user);
    } catch (error) {
      handleSocialSignInError(error, "Google");
    } finally {
      setLoading(false);
    }
  };

  const signInWithGitHub = async () => {
    setLoading(true);
    try {
      const provider = new GithubAuthProvider();
      const result = await signInWithPopup(auth, provider);
      handleSocialSignInSuccess(result.user);
    } catch (error) {
      handleSocialSignInError(error, "GitHub");
    } finally {
      setLoading(false);
    }
  };


  const logout = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      // No toast on logout, or a very subtle one if desired by UserNav
      router.push('/'); 
    } catch (error) {
      console.error("Error signing out: ", error);
      let description = "Failed to log out. Please try again.";
       if (error instanceof Error && (error as AuthError).code === 'auth/network-request-failed') {
        description = "Network error during logout. Please check your connection.";
      }
      toast({ title: "Logout Error", description, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  
  if (loading && !currentUser && (pathname.startsWith('/app') || pathname.startsWith('/dashboard'))) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const isAuthPage = pathname.startsWith('/auth/');
  const isLandingPage = pathname === '/';

  if (!loading && !currentUser && !isAuthPage && !isLandingPage && !pathname.startsWith('/_next/')) {
    if (typeof window !== 'undefined') { 
        router.push('/auth/signin');
    }
    return ( 
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-2">Redirecting to sign-in...</p>
        </div>
    );
  }


  return (
    <AuthContext.Provider value={{ currentUser, loading, logout, signInWithGoogle, signInWithGitHub }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

