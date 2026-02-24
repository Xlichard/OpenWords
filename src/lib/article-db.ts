import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

let articleDb: Database.Database | null = null;
let articleDbChecked = false;

/**
 * Return a read-only connection to articles.db.
 * Returns null if the database file doesn't exist yet
 * (i.e. the crawler hasn't been run).
 */
export function getArticleDb(): Database.Database | null {
  if (articleDbChecked) return articleDb;
  articleDbChecked = true;

  // Try multiple candidate paths (cwd may differ on Vercel)
  const candidates = [
    path.join(process.cwd(), "articles.db"),
    path.join(__dirname, "..", "articles.db"),
    path.join(__dirname, "..", "..", "articles.db"),
  ];

  for (const dbPath of candidates) {
    try {
      if (!fs.existsSync(dbPath)) continue;
      articleDb = new Database(dbPath, { readonly: true });
      console.log(`[article-db] Opened: ${dbPath}`);
      return articleDb;
    } catch (e) {
      console.error(`[article-db] Failed to open ${dbPath}:`, e);
    }
  }

  console.warn("[article-db] articles.db not found in any candidate path");
  return null;
}
