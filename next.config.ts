import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // build: 2026-06-22
  // pdf-parse reads test files during init — keep it out of the webpack bundle
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
