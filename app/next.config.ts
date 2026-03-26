import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["next-auth", "jose"],
  experimental: {
    serverActions: {
      bodySizeLimit: "512kb",
    },
  },
};
export default nextConfig;
