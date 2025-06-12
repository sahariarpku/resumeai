
import { ResumeForgeLogo } from "@/components/resume-forge-logo";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
       <div className="absolute top-6 left-6">
        <Link href="/" className="flex items-center justify-center" prefetch={false}>
            <ResumeForgeLogo />
        </Link>
      </div>
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
