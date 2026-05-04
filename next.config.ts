import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ["10.0.0.100"],
};

export default nextConfig;
