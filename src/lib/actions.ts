"use server";

import { getDb } from "./db";
import type { Word, Category } from "@/types";
import { CATEGORIES } from "@/types";

/**
 * Get all categories with their word counts.
 */
export async function getCategories(): Promise<Category[]> {
  const db = getDb();
  if (!db) return CATEGORIES.map((cat) => ({ ...cat, count: 0 }));
  return CATEGORIES.map((cat) => {
    const row = db
      .prepare("SELECT COUNT(*) as count FROM words WHERE tags LIKE ?")
      .get(`%${cat.tag}%`) as { count: number };
    return { ...cat, count: row.count };
  });
}

/**
 * Get random words for a category.
 */
export async function getWords(
  category: string,
  limit: number = 20
): Promise<Word[]> {
  const db = getDb();
  if (!db) return [];
  const rows = db
    .prepare(
      "SELECT * FROM words WHERE tags LIKE ? ORDER BY RANDOM() LIMIT ?"
    )
    .all(`%${category}%`, limit) as Word[];
  return rows;
}

/**
 * Get specific words by their IDs (for review sessions).
 */
export async function getWordsByIds(ids: number[]): Promise<Word[]> {
  if (ids.length === 0) return [];
  const db = getDb();
  if (!db) return [];
  const placeholders
  const rows = db
    .prepare(`SELECT * FROM words WHERE id IN (${placeholders})`)
    .all(...ids) as Word[];
  return rows;
}

/**
 * Search words by query string.
 */
export async function searchWords(
  query: string,
  limit: number = 20
): Promise<Word[]> {
  const db = getDb();
  if (!db) return [];
  const rows = db
    .prepare("SELECT * FROM words WHERE word LIKE ? ORDER BY word LIMIT ?")
    .all(`${query}%`, limit) as Word[];
  return rows;
}

/**
 * Get the total word count for a specific category.
 */
export async function getCategoryWordIds(category: string): Promise<number[]> {
  const db = getDb();
  if (!db) return [];
  const rows = db
    .prepare("SELECT id FROM words WHERE tags LIKE ? ORDER BY (id * 2654435761) % 4294967296")
    .all(`%${category}%`) as { id: number }[];
  return rows.map((r) => r.id);
}

/**
 * Get the number of lists for a category (each list = listSize words).
 */
export async function getListCount(
  category: string,
  listSize: number = 20
): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  const row = db
    .prepare("SELECT COUNT(*) as count FROM words WHERE tags LIKE ?")
    .get(`%${category}%`) as { count: number };
  return Math.ceil(row.count / listSize);
}

/**
 * Get words for a specific list (deterministic order by id, paginated).
 */
export async function getWordsForList(
  category: string,
  listIndex: number,
  listSize: number = 20
): Promise<Word[]> {
  const db = getDb();
  if (!db) return [];
  const offset
  const rows = db
    .prepare(
      "SELECT * FROM words WHERE tags LIKE ? ORDER BY (id * 2654435761) % 4294967296 LIMIT ? OFFSET ?"
    )
    .all(`%${category}%`, listSize, offset) as Word[];
  return rows;
}

/**
 * Get words for a specific group within a list.
 */
export async function getWordsForGroup(
  category: string,
  listIndex: number,
  groupIndex: number,
  listSize: number = 80,
  groupSize: number = 20
): Promise<Word[]> {
  const db = getDb();
  if (!db) return [];
  const offset
  const rows = db
    .prepare(
      "SELECT * FROM words WHERE tags LIKE ? ORDER BY (id * 2654435761) % 4294967296 LIMIT ? OFFSET ?"
    )
    .all(`%${category}%`, groupSize, offset) as Word[];
  return rows;
}

/**
 * Get the word IDs for a specific list (for progress tracking).
 */
export async function getWordIdsForList(
  category: string,
  listIndex: number,
  listSize: number = 20
): Promise<number[]> {
  const db = getDb();
  if (!db) return [];
  const offset
  const rows = db
    .prepare(
      "SELECT id FROM words WHERE tags LIKE ? ORDER BY (id * 2654435761) % 4294967296 LIMIT ? OFFSET ?"
    )
    .all(`%${category}%`, listSize, offset) as { id: number }[];
  return rows.map((r) => r.id);
}
