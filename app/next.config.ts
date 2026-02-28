import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["next-auth", "jose"],
};
export default nextConfig