import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  outputFileTracingIncludes: {
    "/*": ["./vocab.db"],
  },
};

export default nextConfig;
