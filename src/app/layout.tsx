
import type { Metadata, Viewport } from 'next';
import { PT_Sans } from 'next/font/google';
import './globals.css';
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from '@/components/ThemeProvider';
import { AuthProvider } from '@/hooks/use-auth';
import RootLayoutComponent from '@/components/RootLayout';
import { PWAInstallProvider } from '@/hooks/use-pwa-install';
import appMetadata from '@/data/app-metadata.json';
import versionData from '@/data/version.json';
import { headers } from 'next/headers';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
  display: 'swap',
});

// Helper to get the base URL
function getBaseUrl(): string {
  if (process.env.APP_URL) {
    return process.env.APP_URL;
  }
  // Fallback for Vercel or other environments
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  const headersList = headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = host.startsWith('localhost') ? 'http' : 'https';
  return `${protocol}://${host}`;
}


// Dynamically generate metadata from the JSON file
export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = getBaseUrl();
  const logoUrl = appMetadata.logoUrl ? `${baseUrl}/api/images/${appMetadata.logoUrl}` : null;

  return {
    title: {
      default: appMetadata.name,
      template: `%s | ${appMetadata.name}`,
    },
    description: appMetadata.description,
    keywords: ['maudigi', 'toolkit', 'produktivitas', 'converter', 'scanner', 'kalkulator', 'alat produktivitas', 'aplikasi all-in-one'],
    openGraph: {
      title: appMetadata.name,
      description: appMetadata.description,
      url: baseUrl,
      siteName: appMetadata.name,
      images: [
        {
          url: logoUrl || `${baseUrl}/icons/og-image.png`,
          width: 1200,
          height: 630,
          alt: `${appMetadata.name} App`,
        },
      ],
      locale: 'id_ID',
      type: 'website',
    },
    twitter: {
       card: 'summary_large_image',
       title: appMetadata.name,
       description: appMetadata.description,
       images: [logoUrl || `${baseUrl}/icons/og-image.png`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    manifest: '/manifest.webmanifest',
    icons: {
        icon: logoUrl || '/icons/favicon.ico',
        shortcut: logoUrl || '/icons/apple-touch-icon.png',
        apple: logoUrl || '/icons/apple-touch-icon.png',
    },
    other: {
      'app-version': versionData.versionId,
    }
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1D88FE' },
    { media: '(prefers-color-scheme: dark)', color: '#0F172A' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning className={`${ptSans.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": appMetadata.name,
            "operatingSystem": "WEB",
            "applicationCategory": "Productivity",
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.9",
              "ratingCount": "2500"
            },
            "offers": {
              "@type": "Offer",
              "price": "0"
            }
          })}}
        />
        <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', () => {
                    navigator.serviceWorker.register('/sw.js').then(registration => {
                      console.log('SW registered: ', registration);
                    }).catch(registrationError => {
                      console.log('SW registration failed: ', registrationError);
                    });
                  });
                }
              `,
            }}
          />
      </head>
      <body className={cn("font-body antialiased min-h-screen flex flex-col bg-background")}>
        <AuthProvider>
          <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
          >
            <PWAInstallProvider>
                <RootLayoutComponent>{children}</RootLayoutComponent>
                <Toaster />
            </PWAInstallProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
