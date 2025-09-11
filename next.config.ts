import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Disable pages router to prevent scanning for pages directory
    appDir: true,
  },
};

export default nextConfig;
