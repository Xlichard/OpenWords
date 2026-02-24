import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  outputFileTracingIncludes: {
    // Include articles.db so Vercel bundles it with the serverless function.
    // vocab.db is local-only (too large to commit) and handled gracefully when absent.
    "/*": ["./articles.db"],
  },
};

export default nextConfig;
