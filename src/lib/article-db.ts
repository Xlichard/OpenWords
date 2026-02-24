import Database from "better-sqlite3";
import path from "path";

let articleDb: Database.Database | null = null;

/**
 * Return a read-only connection to articles.db.
 * Returns null if the database file doesn't exist yet
 * (i.e. the crawler hasn't been run).
 */
export function getArticleDb(): Database.Database | null {
  if (articleDb) return articleDb;
  try {
    const dbPath = path.join(process.cwd(), "articles.db");
    articleDb = new Database(dbPath, { readonly: true, fileMustExist: true });
    return articleDb;
  } catch {
    // articles.db not yet created — crawler hasn't run
    return null;
  }
}
