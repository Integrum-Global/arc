import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.arc-invest.com",
      },
    ],
  },
  experimental: {
    optimizePackageImports: [
      "@tanstack/react-query",
      "recharts",
      "date-fns",
      "lucide-react",
    ],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

export default config;
