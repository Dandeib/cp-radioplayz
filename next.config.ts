import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb',
      allowedOrigins: ['http://dandeib.de:3002', 'https://dandeib.de:3002'],
    },
  },
};

export default nextConfig;
