import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  outputFileTracingIncludes: {
    // Bundle .db files with every serverless function route
    "/api/*": ["./articles.db", "./vocab.db"],
    "/reading/*": ["./articles.db"],
    "/*": ["./articles.db", "./vocab.db"],
  },
};

export default nextConfig;
