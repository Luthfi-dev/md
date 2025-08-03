import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'All-in-One Toolkit',
    short_name: 'Toolkit',
    description: 'A versatile utility app with daily tools.',
    start_url: '/',
    display: 'standalone',
    background_color: '#E0FFFF',
    theme_color: '#3CB371',
    icons: [
      {
        src: 'https://placehold.co/192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: 'https://placehold.co/512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
       {
        src: 'https://placehold.co/512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ],
  }
}
