import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.youtube.com",
        port: "",
        pathname: "/vi/**",
      },
    ],
  },
  experimental: {
    // Enable caching for better performance
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  // Enable caching headers and global AI-protection header
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
      {
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noai, noimageai" }],
      },
    ];
  },
  // Ensure API routes are properly handled during build
  typescript: {
    // Don't fail build on type errors for API routes
    ignoreBuildErrors: false,
  },
  // Handle environment variables properly
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // Ensure proper handling of server-side code
  serverRuntimeConfig: {
    // Will only be available on the server side
    mySecret: process.env.MONGODB_URI,
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
    staticFolder: "/static",
  },
};

export default nextConfig;
