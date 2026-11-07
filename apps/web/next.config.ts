import type { NextConfig } from 'next';

const apiUrl = process.env.API_INTERNAL_URL ?? 'http://localhost:3001';

const nextConfig: NextConfig = {
  output: 'standalone',

  devIndicators: false,

  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },

  async rewrites() {
    return [
      {
        source: '/api/spots',
        destination: `${apiUrl}/spots`,
      },
      {
        source: '/api/geocoding/reverse',
        destination: `${apiUrl}/geocoding/reverse`,
      },
    ];
  },
};

export default nextConfig;
