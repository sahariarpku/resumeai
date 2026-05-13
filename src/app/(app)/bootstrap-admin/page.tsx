"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BootstrapAdminPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleBootstrap() {
    if (!currentUser) return;
    setStatus("loading");
    try {
      const adminRef = doc(db, "config", "admin");
      const existing = await getDoc(adminRef);
      if (existing.exists()) {
        const data = existing.data();
        const uids: string[] = data.adminUids ?? [];
        if (uids.includes(currentUser.uid)) {
          setStatus("success");
          setMessage("You are already an admin!");
          return;
        }
        await setDoc(adminRef, { adminUids: [...uids, currentUser.uid] });
      } else {
        await setDoc(adminRef, { adminUids: [currentUser.uid] });
      }
      setStatus("success");
      setMessage("Done! You are now an admin. Redirecting to admin panel...");
      setTimeout(() => router.push("/admin"), 2000);
    } catch (err: any) {
      setStatus("error");
      setMessage(err?.message ?? "Write failed — Firestore security rules may be blocking this.");
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-amber-400" />
            Admin Bootstrap
          </CardTitle>
          <CardDescription>
            One-time setup to grant yourself admin access.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentUser ? (
            <>
              <div className="text-sm text-muted-foreground space-y-1">
                <p><span className="font-medium text-foreground">Email:</span> {currentUser.email}</p>
                <p><span className="font-medium text-foreground">UID:</span> <span className="font-mono text-xs">{currentUser.uid}</span></p>
              </div>

              {status === "idle" && (
                <Button onClick={handleBootstrap} className="w-full">
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Make Me Admin
                </Button>
              )}
              {status === "loading" && (
                <Button disabled className="w-full">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Writing to Firestore...
                </Button>
              )}
              {status === "success" && (
                <div className="rounded-md bg-green-500/10 border border-green-500/20 p-3 text-sm text-green-400">
                  {message}
                </div>
              )}
              {status === "error" && (
                <div className="space-y-3">
                  <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                    <ShieldAlert className="inline h-4 w-4 mr-1" />
                    {message}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Go to Firebase console → Firestore → Rules and temporarily set:
                    <br />
                    <code className="bg-muted px-1 rounded">allow write: if request.auth != null;</code>
                    <br />
                    Then try again, then revert the rules.
                  </p>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Please sign in first.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
