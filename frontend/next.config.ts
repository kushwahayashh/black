import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/videos/:path*",
        destination: "/api/videos/:path*",
      },
      {
        source: "/thumbnails/:path*",
        destination: "/api/thumbnails/:path*",
      },
      {
        source: "/processed/:path*",
        destination: "/api/processed/:path*",
      },
    ];
  },
  // Configure external packages for server components
  serverExternalPackages: [],
};

export default nextConfig;
