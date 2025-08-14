
import type { Metadata, Viewport } from 'next';
import { PT_Sans } from 'next/font/google';
import './globals.css';
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from '@/components/ThemeProvider';
import { AuthProvider } from '@/hooks/use-auth';
import RootLayoutComponent from '@/components/RootLayout';
import { PWAInstallProvider } from '@/hooks/use-pwa-install';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Maudigi: Uplevel Your Life',
    template: '%s | Maudigi',
  },
  description: 'Satu aplikasi untuk semua kebutuhan produktivitas Anda: konverter file, scanner, kalkulator, dan banyak lagi. Alat canggih yang dirancang untuk meningkatkan level hidup Anda.',
  keywords: ['maudigi', 'toolkit', 'produktivitas', 'converter', 'scanner', 'kalkulator', 'alat produktivitas', 'aplikasi all-in-one'],
  openGraph: {
    title: 'Maudigi: Uplevel Your Life',
    description: 'Satu aplikasi untuk semua kebutuhan produktivitas Anda.',
    url: 'https://yourapp-url.com',
    siteName: 'Maudigi',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Maudigi App',
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Maudigi: Uplevel Your Life',
    description: 'Satu aplikasi untuk semua kebutuhan produktivitas Anda.',
    images: ['/og-image.png'],
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
  manifest: '/manifest.json',
};

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
            "name": "Maudigi",
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
