
import { MetadataRoute } from 'next'
import appMetadata from '@/data/app-metadata.json';
import { headers } from 'next/headers';
 
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

export default function manifest(): MetadataRoute.Manifest {
  const baseUrl = getBaseUrl();
  const logoUrl = appMetadata.logoUrl ? `${baseUrl}/api/images/${appMetadata.logoUrl}` : null;

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
        src: logoUrl || '/icons/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: logoUrl || '/icons/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
       {
        src: logoUrl || '/icons/maskable_icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ],
  }
}
