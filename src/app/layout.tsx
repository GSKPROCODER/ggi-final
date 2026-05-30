import {ClerkProvider} from "@clerk/nextjs";
import '@/index.css';
import { Metadata } from 'next';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata: Metadata = {
  title: 'Nexus AI — Executive Text Intelligence & Data Analytics',
  description: 'Production-grade semantic analysis, anomaly alerts, and automated C-Suite reporting engine powered by Gemini.',
};

/**
 * Root Next.js layout providing global document styling, custom fonts, 
 * and dark theme class activations.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased transition-colors duration-300" suppressHydrationWarning>
        <ClerkProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
            <Toaster position="bottom-right" richColors />
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}