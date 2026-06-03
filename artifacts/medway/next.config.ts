import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow requests coming through the Replit dev proxy
  allowedDevOrigins: [
    "*.replit.dev",
    "*.worf.replit.dev",
    "*.repl.co",
    "localhost",
    "127.0.0.1",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
