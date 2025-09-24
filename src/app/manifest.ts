
import { MetadataRoute } from 'next'
import appMetadata from '@/data/app-metadata.json';

// manifest.ts does not run in the same context as server components,
// so we cannot use `headers()` to determine the host.
// We must rely on environment variables.
const getBaseUrl = () => {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // Fallback for local development, ensure APP_URL is set in .env
  return process.env.APP_URL || 'http://localhost:3000'; 
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
