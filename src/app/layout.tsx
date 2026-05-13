
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AuthProvider } from '@/contexts/auth-context';
import { AISettingsProvider } from '@/contexts/ai-settings-context';
import { ThemeProvider } from '@/contexts/theme-context';

export const metadata: Metadata = {
  title: 'ResumeForge - AI Powered Resume Builder',
  description: 'Craft the perfect resume tailored to any job description with AI.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Lora:ital,wght@0,400;0,500;1,400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
        {/* Apply saved theme before first paint to avoid flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('app-theme');if(t==='white'||t==='dark'||t==='mid'){document.documentElement.classList.add('theme-'+t);}else{document.documentElement.classList.add('theme-mid');}})();`,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <AuthProvider>
            <AISettingsProvider>
              <SidebarProvider>
                {children}
              </SidebarProvider>
            </AISettingsProvider>
          </AuthProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
