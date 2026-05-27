import {ClerkProvider} from "@clerk/nextjs";
import '@/index.css';
import { Metadata } from 'next';
import { Toaster } from 'sonner';

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
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ClerkProvider>
          {children}
          <Toaster theme="dark" position="bottom-right" richColors />
        </ClerkProvider>
      </body>
    </html>
  );
}