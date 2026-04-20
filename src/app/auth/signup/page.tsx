
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Loader2, Github } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Separator } from "@/components/ui/separator";

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

const signUpSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

type SignUpFormData = z.infer<typeof signUpSchema>;

export default function SignUpPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const { signInWithGoogle, signInWithGitHub, loading: socialLoading } = useAuth();

  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
    },
  });

  const onEmailSubmit = async (data: SignUpFormData) => {
    setIsLoadingEmail(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName: data.fullName });
      }
      toast({ title: "Account Created Successfully!" });
      router.push("/dashboard"); 
    } catch (error: any) {
      console.error("Sign up error:", error);
      let errorMessage = "Failed to create account. Please try again.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already registered. Please sign in or use a different email.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "The password is too weak. Please choose a stronger password.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "The email address is not valid. Please check and try again.";
      }
      toast({
        title: "Sign Up Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoadingEmail(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="font-headline text-2xl">Create Your ResumeForge Account</CardTitle>
        <CardDescription>Join us or use a social account to get started.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={signInWithGoogle}
            disabled={socialLoading || isLoadingEmail}
          >
            {socialLoading && !isLoadingEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
            Sign up with Google
          </Button>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={signInWithGitHub}
            disabled={socialLoading || isLoadingEmail}
          >
            {socialLoading && !isLoadingEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Github className="mr-2 h-4 w-4" />}
            Sign up with GitHub
          </Button>

          <div className="flex items-center space-x-2 my-4">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">OR REGISTER WITH EMAIL</span>
            <Separator className="flex-1" />
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onEmailSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormDescription>
                      Password must be at least 6 characters.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoadingEmail || socialLoading}>
                {isLoadingEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Sign Up with Email
              </Button>
            </form>
          </Form>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center text-sm">
        <p className="text-muted-foreground">
          Already have an account?{" "}
          <Link href="/auth/signin" className="font-medium text-primary hover:underline">
            Sign In
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
