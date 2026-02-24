import type Database from "better-sqlite3";
import path from "path";

let db: Database.Database | null = null;
let initialized = false;

/**
 * Returns a read-only connection to vocab.db, or null if the file doesn't
 * exist (e.g. on Vercel where the large vocab DB is not committed)
 * or if better-sqlite3 native bindings are unavailable.
 */
export function getDb(): Database.Database | null {
  if (initialized) return db;
  initialized = true;
  try {
    // Dynamic require: avoids crashing at module-load time on Vercel
    // where the native better-sqlite3 bindings may be unavailable.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const BetterSqlite3 = require("better-sqlite3");
    const dbPath = path.join(process.cwd(), "vocab.db");
    db = new BetterSqlite3(dbPath, { readonly: true, fileMustExist: true });
  } catch {
    // vocab.db not present or better-sqlite3 unavailable — features return empty results
    db = null;
  }
  return db;
}
