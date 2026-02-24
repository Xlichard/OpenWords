// ============================================================
// Article Reading Module — Type Definitions
// ============================================================

export interface Article {
  id: number;
  source: "guardian" | "bbc" | "voa" | "conversation";
  url: string;
  title: string;
  title_cn: string;
  author: string;
  published_at: string; // ISO 8601 or empty
  category: string;
  difficulty: "gaokao" | "cet4" | "cet6" | "kaoyan" | "ielts";
  image_url: string;
  crawled_at: string;
  paragraph_count?: number;
}

export interface Sentence {
  id: number;
  paragraph_id: number;
  seq: number;
  en_text: string;
  cn_text: string;
  is_complex: boolean; // 1/0 in SQLite, coerced to boolean
  analysis: string;    // JSON string with DeepSeek structural breakdown, or ""
}

export interface Paragraph {
  id: number;
  article_id: number;
  seq: number;
  en_text: string;
  cn_text: string;
  sentences: Sentence[];
}

export interface ArticleWithContent extends Article {
  paragraphs: Paragraph[];
}

/** Parsed sentence analysis produced by DeepSeek. */
export interface SentenceAnalysis {
  subject?: string;
  predicate?: string;
  object?: string;
  clauses?: { type: string; text: string }[];
  structure_note?: string;
  translation?: string;
}

// ── Display metadata ──────────────────────────────────────────────────────────

export const SOURCE_META: Record<
  string,
  { label: string; badge: string; color: string }
> = {
  guardian: {
    label: "The Guardian",
    badge:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
    color: "from-blue-600 to-blue-700",
  },
  bbc: {
    label: "BBC News",
    badge: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
    color: "from-red-600 to-red-700",
  },
  voa: {
    label: "VOA Learning English",
    badge: "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300",
    color: "from-sky-500 to-sky-600",
  },
  conversation: {
    label: "The Conversation",
    badge:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300",
    color: "from-orange-500 to-orange-600",
  },
};

export const DIFFICULTY_META: Record<
  string,
  { label: string; badge: string }
> = {
  gaokao: {
    label: "高考",
    badge:
      "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
  },
  cet4: {
    label: "四级",
    badge:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300",
  },
  cet6: {
    label: "六级",
    badge:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300",
  },
  kaoyan: {
    label: "考研",
    badge:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
  },
  ielts: {
    label: "雅思",
    badge:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
  },
};

export const CATEGORY_LABELS: Record<string, string> = {
  science: "科学",
  technology: "科技",
  society: "社会",
  economy: "经济",
  culture: "文化",
  health: "健康",
};
