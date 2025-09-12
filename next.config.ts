import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Disable pages router to prevent scanning for pages directory
    appDir: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.rawg.io',
        port: '',
        pathname: '/media/**',
      },
    ],
  },
};

export default nextConfig;
