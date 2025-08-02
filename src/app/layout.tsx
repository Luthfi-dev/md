
import type { Metadata, Viewport } from 'next';
import { PT_Sans } from 'next/font/google';
import './globals.css';
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from '@/components/ThemeProvider';
import { AuthProvider } from '@/hooks/use-auth';
import { AppLayout } from '@/components/AppLayout';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'All-in-One Toolkit: Aplikasi Cerdas untuk Kebutuhan Harian Anda',
    template: '%s | All-in-One Toolkit',
  },
  description: 'Satu aplikasi untuk semua kebutuhan Anda: konverter file, scanner, kalkulator, dan banyak lagi. Alat canggih yang dirancang untuk produktivitas maksimal.',
  keywords: ['toolkit', 'converter', 'scanner', 'calculator', 'alat produktivitas', 'aplikasi all-in-one'],
  openGraph: {
    title: 'All-in-One Toolkit: Aplikasi Cerdas untuk Kebutuhan Harian Anda',
    description: 'Satu aplikasi untuk semua kebutuhan Anda: konverter file, scanner, kalkulator, dan banyak lagi.',
    url: 'https://yourapp-url.com',
    siteName: 'All-in-One Toolkit',
    images: [
      {
        url: 'https://placehold.co/1200x630.png',
        width: 1200,
        height: 630,
        alt: 'All-in-One Toolkit Hero Image',
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'All-in-One Toolkit: Aplikasi Cerdas untuk Kebutuhan Harian Anda',
    description: 'Satu aplikasi untuk semua kebutuhan Anda: konverter file, scanner, kalkulator, dan banyak lagi.',
    images: ['https://placehold.co/1200x630.png'],
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
    <html lang="en" suppressHydrationWarning className={`${ptSans.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "All-in-One Toolkit",
            "operatingSystem": "WEB",
            "applicationCategory": "Productivity",
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "ratingCount": "1200"
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
            <AppLayout>
              {children}
            </AppLayout>
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
