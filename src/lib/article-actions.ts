"use server";

import fs from "fs";
import path from "path";
import { getDb } from "./db";
import type {
  Article,
  ArticleWithContent,
} from "@/types/article";
import type { Word } from "@/types";

// ── Data directory ────────────────────────────────────────────────────────────

const DATA_DIR = path.join(process.cwd(), "article-data");

// ── In-memory index cache (lives for the lifetime of the serverless function) ─

interface ArticleMeta extends Article {
  paragraph_count: number;
}

let _indexCache: ArticleMeta[] | null = null;

function loadIndex(): ArticleMeta[] {
  if (_indexCache) return _indexCache;
  try {
    const raw = fs.readFileSync(path.join(DATA_DIR, "index.json"), "utf-8");
    const data = JSON.parse(raw) as { articles: ArticleMeta[] };
    _indexCache = data.articles;
    return _indexCache;
  } catch {
    return [];
  }
}

// ── Article list ──────────────────────────────────────────────────────────────

interface ListOptions {
  page?: number;
  limit?: number;
  source?: string;
  difficulty?: string;
  /** Exact crawl date filter: YYYY-MM-DD */
  date?: string;
  /** Month filter: YYYY-MM */
  month?: string;
}

interface ArticleRow extends Article {
  paragraph_count: number;
}

export async function getArticles(
  options: ListOptions = {}
): Promise<ArticleRow[]> {
  const all = loadIndex();
  const { page = 1, limit = 12, source, difficulty, date, month } = options;

  let filtered = all as ArticleRow[];
  if (source) filtered = filtered.filter((a) => a.source === source);
  if (difficulty) filtered = filtered.filter((a) => a.difficulty === difficulty);
  if (date) filtered = filtered.filter((a) => a.crawled_at.slice(0, 10) === date);
  else if (month) filtered = filtered.filter((a) => a.crawled_at.slice(0, 7) === month);

  // Index is already sorted by crawled_at DESC from the export script
  const offset = (page - 1) * limit;
  return filtered.slice(offset, offset + limit);
}

export async function getArticleCount(
  options: Pick<ListOptions, "source" | "difficulty" | "date" | "month"> = {}
): Promise<number> {
  const all = loadIndex();
  const { source, difficulty, date, month } = options;

  let filtered = all as ArticleRow[];
  if (source) filtered = filtered.filter((a) => a.source === source);
  if (difficulty) filtered = filtered.filter((a) => a.difficulty === difficulty);
  if (date) filtered = filtered.filter((a) => a.crawled_at.slice(0, 10) === date);
  else if (month) filtered = filtered.filter((a) => a.crawled_at.slice(0, 7) === month);

  return filtered.length;
}

// ── Date-based browsing ───────────────────────────────────────────────────────

export interface DayEntry {
  date: string;   // YYYY-MM-DD
  day: string;    // DD
  count: number;
}

export interface MonthEntry {
  month: string;  // YYYY-MM
  label: string;  // e.g. "2026年2月"
  total: number;
  days: DayEntry[];
}

/**
 * Returns all months (with day breakdown) that have at least one article,
 * ordered newest first.
 */
export async function getAvailableDates(): Promise<MonthEntry[]> {
  const all = loadIndex();

  // Group by date
  const byDate = new Map<string, number>();
  for (const a of all) {
    const date = a.crawled_at.slice(0, 10);
    byDate.set(date, (byDate.get(date) ?? 0) + 1);
  }

  // Group by month
  const byMonth = new Map<string, DayEntry[]>();
  for (const [date, count] of byDate) {
    const month = date.slice(0, 7);
    if (!byMonth.has(month)) byMonth.set(month, []);
    byMonth.get(month)!.push({ date, day: date.slice(8, 10), count });
  }

  return Array.from(byMonth.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([month, days]) => {
      days.sort((a, b) => b.date.localeCompare(a.date));
      const [y, m] = month.split("-");
      return {
        month,
        label: `${y}年${parseInt(m)}月`,
        total: days.reduce((s, d) => s + d.count, 0),
        days,
      };
    });
}

// ── Article detail ────────────────────────────────────────────────────────────

export async function getArticleById(
  id: number
): Promise<ArticleWithContent | null> {
  try {
    const raw = fs.readFileSync(
      path.join(DATA_DIR, "detail", `${id}.json`),
      "utf-8"
    );
    return JSON.parse(raw) as ArticleWithContent;
  } catch {
    return null;
  }
}

// ── Word lookup (uses vocab.db — gracefully returns null when unavailable) ────

/**
 * Look up a single word in the vocabulary database.
 * Tries exact match, then lowercased match.
 */
export async function lookupWord(word: string): Promise<Word | null> {
  if (!word || word.trim().length === 0) return null;

  const db = getDb();
  if (!db) return null;
  const cleaned = word.trim().replace(/[^a-zA-Z'-]/g, "");
  if (!cleaned) return null;

  // Try exact match, then lowercase
  for (const candidate of [cleaned, cleaned.toLowerCase()]) {
    const row = db
      .prepare("SELECT * FROM words WHERE word = ? LIMIT 1")
      .get(candidate) as Word | undefined;
    if (row) return row;
  }

  return null;
}
