"use server";

import { getArticleDb } from "./article-db";
import { getDb } from "./db";
import type {
  Article,
  ArticleWithContent,
  Paragraph,
  Sentence,
} from "@/types/article";
import type { Word } from "@/types";

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
  const db = getArticleDb();
  if (!db) return [];

  const { page = 1, limit = 12, source, difficulty, date, month } = options;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (source) {
    conditions.push("a.source = ?");
    params.push(source);
  }
  if (difficulty) {
    conditions.push("a.difficulty = ?");
    params.push(difficulty);
  }
  if (date) {
    conditions.push("substr(a.crawled_at, 1, 10) = ?");
    params.push(date);
  } else if (month) {
    conditions.push("substr(a.crawled_at, 1, 7) = ?");
    params.push(month);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const rows = db
    .prepare(
      `
      SELECT a.*, COUNT(p.id) AS paragraph_count
      FROM articles a
      LEFT JOIN paragraphs p ON p.article_id = a.id
      ${where}
      GROUP BY a.id
      ORDER BY a.crawled_at DESC
      LIMIT ? OFFSET ?
      `
    )
    .all(...params, limit, offset) as ArticleRow[];

  return rows;
}

export async function getArticleCount(
  options: Pick<ListOptions, "source" | "difficulty" | "date" | "month"> = {}
): Promise<number> {
  const db = getArticleDb();
  if (!db) return 0;

  const { source, difficulty, date, month } = options;
  const conditions: string[] = [];
  const params: string[] = [];

  if (source) {
    conditions.push("source = ?");
    params.push(source);
  }
  if (difficulty) {
    conditions.push("difficulty = ?");
    params.push(difficulty);
  }
  if (date) {
    conditions.push("substr(crawled_at, 1, 10) = ?");
    params.push(date);
  } else if (month) {
    conditions.push("substr(crawled_at, 1, 7) = ?");
    params.push(month);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const row = db
    .prepare(`SELECT COUNT(*) AS count FROM articles ${where}`)
    .get(...params) as { count: number };

  return row.count;
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
  const db = getArticleDb();
  if (!db) return [];

  const rows = db
    .prepare(
      `SELECT
         substr(crawled_at, 1, 7)  AS month,
         substr(crawled_at, 1, 10) AS date,
         COUNT(*)                  AS count
       FROM articles
       GROUP BY date
       ORDER BY date DESC`
    )
    .all() as { month: string; date: string; count: number }[];

  const monthMap = new Map<string, DayEntry[]>();
  for (const row of rows) {
    if (!monthMap.has(row.month)) monthMap.set(row.month, []);
    monthMap.get(row.month)!.push({
      date: row.date,
      day: row.date.slice(8, 10),  // DD
      count: row.count,
    });
  }

  return Array.from(monthMap.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([month, days]) => {
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

interface ParagraphRow {
  id: number;
  article_id: number;
  seq: number;
  en_text: string;
  cn_text: string;
}

interface SentenceRow {
  id: number;
  paragraph_id: number;
  seq: number;
  en_text: string;
  cn_text: string;
  is_complex: number; // SQLite stores as 0/1
  analysis: string;
}

export async function getArticleById(
  id: number
): Promise<ArticleWithContent | null> {
  const db = getArticleDb();
  if (!db) return null;

  const article = db
    .prepare("SELECT * FROM articles WHERE id = ?")
    .get(id) as Article | undefined;

  if (!article) return null;

  const paraRows = db
    .prepare(
      "SELECT * FROM paragraphs WHERE article_id = ? ORDER BY seq"
    )
    .all(id) as ParagraphRow[];

  const sentRows = db
    .prepare(
      `SELECT s.* FROM sentences s
       JOIN paragraphs p ON p.id = s.paragraph_id
       WHERE p.article_id = ?
       ORDER BY p.seq, s.seq`
    )
    .all(id) as SentenceRow[];

  // Group sentences by paragraph_id
  const sentsByPara = new Map<number, Sentence[]>();
  for (const row of sentRows) {
    const sent: Sentence = {
      ...row,
      is_complex: row.is_complex === 1,
    };
    if (!sentsByPara.has(row.paragraph_id)) {
      sentsByPara.set(row.paragraph_id, []);
    }
    sentsByPara.get(row.paragraph_id)!.push(sent);
  }

  const paragraphs: Paragraph[] = paraRows.map((p) => ({
    ...p,
    sentences: sentsByPara.get(p.id) ?? [],
  }));

  return { ...article, paragraphs };
}

// ── Word lookup (uses vocab.db) ───────────────────────────────────────────────

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
