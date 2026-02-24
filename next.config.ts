import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  outputFileTracingIncludes: {
    // Include article JSON data so Vercel bundles it with serverless functions.
    // vocab.db is local-only (too large to commit) and handled gracefully when absent.
    "/*": ["./article-data/**/*"],
  },
};

export default nextConfig;
