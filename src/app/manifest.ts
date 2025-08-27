
import { MetadataRoute } from 'next'
import appMetadata from '@/data/app-metadata.json';
 
export default function manifest(): MetadataRoute.Manifest {
  const iconUrl = appMetadata.logoUrl ? `/api/images/${appMetadata.logoUrl}` : '/icon-512x512.png';

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
        src: iconUrl,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: iconUrl,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
       {
        src: iconUrl,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ],
  }
}
