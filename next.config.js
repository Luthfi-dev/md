/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
    // Allow serving images from the local API endpoint
    // This is required for the dynamic image serving from the /uploads folder
    loader: 'default',
    path: '/_next/image',
    domains: ['localhost'], // Add your production domain here as well
  },
};

module.exports = nextConfig;
