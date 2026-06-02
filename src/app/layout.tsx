import {ClerkProvider} from "@clerk/nextjs";
import '@/index.css';
import { Metadata, Viewport } from 'next';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/ThemeProvider';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: dark)',  color: '#020617' },
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
  ],
};

export const metadata: Metadata = {
  title: {
    default: 'Nexus AI — Executive Text Intelligence',
    template: '%s | Nexus AI',
  },
  description: 'Enterprise-grade sentiment analysis, anomaly detection, and automated C-Suite reporting powered by multi-model AI.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.nexusproject.sbs'),
  icons: {
    icon: '/favicon.svg',
    apple: '/apple-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Nexus AI',
  },
  openGraph: {
    title: 'Nexus AI — Executive Text Intelligence',
    description: 'Analyze sentiment, detect anomalies, and generate executive reports from your CSV datasets in real-time.',
    url: '/',
    siteName: 'Nexus AI',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Nexus AI Dashboard' }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nexus AI — Executive Text Intelligence',
    description: 'Analyze sentiment, detect anomalies, and generate executive reports from your CSV datasets.',
    images: ['/og-image.png'],
  },
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
        <ClerkProvider
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
          signInFallbackRedirectUrl="/dashboard"
          signUpFallbackRedirectUrl="/dashboard"
          afterSignOutUrl="/"
          appearance={{
            variables: {
              colorPrimary: '#38bdf8',
              borderRadius: '0.75rem',
            },
          }}
        >
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
            <Toaster position="bottom-right" richColors />
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}