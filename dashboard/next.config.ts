import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Removed "output: export" to enable API routes for real-time data
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
