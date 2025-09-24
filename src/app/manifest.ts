
import { MetadataRoute } from 'next'
import appMetadata from '@/data/app-metadata.json';
import { headers } from 'next/headers';
 
// Helper to get the base URL
function getBaseUrl(): string {
  // 1. Priority: Vercel deployment URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // 2. Fallback to custom APP_URL from .env
  if (process.env.APP_URL) {
    return process.env.APP_URL;
  }
  // 3. Fallback for local development from headers
  const headersList = headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = host.startsWith('localhost') ? 'http' : 'https';
  return `${protocol}://${host}`;
}

export default function manifest(): MetadataRoute.Manifest {
  const baseUrl = getBaseUrl();
  const logoUrl192 = appMetadata.logoUrl ? `${baseUrl}/api/images/${appMetadata.logoUrl}` : `${baseUrl}/icons/android-chrome-192x192.png`;
  const logoUrl512 = appMetadata.logoUrl ? `${baseUrl}/api/images/${appMetadata.logoUrl}` : `${baseUrl}/icons/android-chrome-512x512.png`;
  const maskableIconUrl = appMetadata.logoUrl ? `${baseUrl}/api/images/${appMetadata.logoUrl}` : `${baseUrl}/icons/maskable_icon.png`;

  return {
    name: appMetadata.name,
    short_name: appMetadata.name,
    description: appMetadata.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#FFFFFF',
    theme_color: '#1D88FE',
    icons: [
      {
        src: logoUrl192,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: logoUrl512,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
       {
        src: maskableIconUrl,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ],
  }
}
