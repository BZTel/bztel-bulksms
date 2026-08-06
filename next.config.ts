import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: '/app',
        destination: '/app.html',
      },
      {
        source: '/admin',
        destination: '/admin.html',
      },
    ];
  },
};

export default nextConfig;
