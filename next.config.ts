import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Enable caching for better performance
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  // Enable caching headers
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=60, stale-while-revalidate=300",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
