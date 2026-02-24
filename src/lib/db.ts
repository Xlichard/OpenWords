import Database from "better-sqlite3";
import path from "path";

let db: Database.Database | null = null;
let initialized = false;

/**
 * Returns a read-only connection to vocab.db, or null if the file doesn't
 * exist (e.g. on Vercel where the large vocab DB is not committed).
 */
export function getDb(): Database.Database | null {
  if (initialized) return db;
  initialized = true;
  try {
    const dbPath = path.join(process.cwd(), "vocab.db");
    db = new Database(dbPath, { readonly: true, fileMustExist: true });
  } catch {
    // vocab.db not present — vocabulary features will return empty results
    db = null;
  }
  return db;
}
