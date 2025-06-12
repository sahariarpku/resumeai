
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '@/lib/firebase'; // Adjust path as necessary
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      // Optionally redirect to sign-in page after logout
      // router.push('/auth/signin'); 
    } catch (error) {
      console.error("Error signing out: ", error);
      // Handle error (e.g., show toast)
    }
  };
  
  // If still loading, show a full-page loader or skeleton
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If not loading and no user, and current path is protected, redirect to signin
  // Allow access to auth pages and landing page even if not logged in
  const isAuthPage = pathname.startsWith('/auth/');
  const isLandingPage = pathname === '/';

  if (!currentUser && !isAuthPage && !isLandingPage && !pathname.startsWith('/_next/')) {
     // Check !pathname.startsWith('/_next/') to avoid issues with Next.js internal requests during build/dev
    if (typeof window !== 'undefined') { // Ensure router.push is called client-side
        router.push('/auth/signin');
    }
    return ( // Render loader during redirection
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-2">Redirecting to sign-in...</p>
        </div>
    );
  }


  return (
    <AuthContext.Provider value={{ currentUser, loading, logout }}>
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
