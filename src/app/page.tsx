
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Github } from "lucide-react";
import Link from "next/link";

// Simple Google Icon SVG
const GoogleIcon = () => (
  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    <path d="M1 1h22v22H1z" fill="none"/>
  </svg>
);

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white font-body">
      <header className="absolute top-0 left-0 p-6 md:p-8 z-10">
        <Link href="/" className="text-2xl font-bold font-headline text-gray-100 hover:text-gray-300 transition-colors">
          Resume-AI
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center p-4">
        <div className="grid md:grid-cols-2 gap-12 md:gap-24 items-center max-w-5xl w-full">
          <div className="space-y-5 text-center md:text-left">
            <h1 className="text-4xl sm:text-5xl font-bold font-headline leading-tight">
              Welcome Back to <br className="hidden sm:inline" /> Resume-AI
            </h1>
            <p className="text-lg text-gray-300">
              Sign In To Unlock The Full Potential Of AI-driven Resumes and Job Matching.
            </p>
            <p className="text-lg text-gray-300">
              Elevate Your Career, One Tailored Resume at a Time.
            </p>
          </div>

          <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-sm mx-auto">
            <div className="space-y-6">
              <p className="text-sm text-center text-gray-400">Use your social account to sign in</p>
              
              {/* Placeholder: Link to signup or a dedicated social auth page if implemented */}
              <Button className="w-full bg-white text-gray-800 hover:bg-gray-100 transition-colors" asChild>
                <Link href="/auth/signup"> 
                  <GoogleIcon /> Sign in with Google
                </Link>
              </Button>
              
              {/* Placeholder: Link to signup or a dedicated social auth page if implemented */}
              <Button className="w-full bg-slate-700 text-white hover:bg-slate-600 transition-colors" asChild>
                <Link href="/auth/signup">
                  <Github className="mr-2 h-5 w-5" /> Sign in with GitHub
                </Link>
              </Button>
              
              <p className="text-xs text-center text-gray-500">
                By signing in, you agree to our{' '}
                <Link href="#" className="underline hover:text-gray-300 transition-colors">Privacy Policy</Link> and{' '}
                <Link href="#" className="underline hover:text-gray-300 transition-colors">Terms of Service</Link>.
              </p>

              <div className="flex items-center space-x-2">
                <Separator className="flex-1 bg-gray-700" />
                <span className="text-xs text-gray-500">OR</span>
                <Separator className="flex-1 bg-gray-700" />
              </div>
              
              <Button variant="outline" className="w-full border-gray-600 hover:bg-gray-700 hover:text-gray-100 transition-colors" asChild>
                 <Link href="/auth/signin">Sign In with Email</Link>
              </Button>

              <p className="text-sm text-center text-gray-400">
                New to Resume-AI?{' '}
                <Link href="/auth/signup" className="font-medium text-primary hover:underline hover:text-purple-400 transition-colors">
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
