import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
  // Externalize packages that have native dependencies or optional deps
  // that shouldn't be bundled by Turbopack
  // This prevents Turbopack from trying to bundle @mapbox/node-pre-gyp
  // which has optional test dependencies (aws-sdk, mock-aws-s3, nock)
  serverExternalPackages: [
    '@tensorflow/tfjs-node',
    '@mapbox/node-pre-gyp',
  ],
};

export default nextConfig;
