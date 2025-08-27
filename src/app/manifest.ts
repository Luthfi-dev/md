
import { MetadataRoute } from 'next'
import appMetadata from '@/data/app-metadata.json';
 
export default function manifest(): MetadataRoute.Manifest {
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
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
       {
        src: '/maskable_icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ],
  }
}
