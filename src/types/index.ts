// ============================================================
// OpenWords Type Definitions
// ============================================================

/** A word entry from the database */
export interface Word {
  id: number;
  word: string;
  phonetic: string;
  translation: string;
  definition: string;
  pos: string;
  collins: number;
  oxford: number;
  bnc: number;
  frq: number;
  exchange: string;
  tags: string;
}

/** Category metadata for the home page */
export interface Category {
  tag: string;
  label: string;
  description: string;
  count: number;
  icon: string;
  color: string;
}

/** SM-2 card state stored in IndexedDB */
export interface CardState {
  wordId: number;
  easeFactor: number;
  interval: number; // in days
  repetitions: number;
  nextReview: string; // ISO date string
  lastReview: string; // ISO date string
}

/** Daily learning statistics */
export interface DailyStats {
  date: string; // YYYY-MM-DD
  learned: number;
  reviewed: number;
}

/** User settings */
export interface UserSettings {
  accent: "en-US" | "en-GB";
  dailyGoal: number;
  autoPlayAudio: boolean;
  listSize: number; // words per list, default 80
  groupSize: number; // words per learning group, default 20
}

/** Custom module uploaded by user */
export interface CustomModule {
  id: string;
  name: string;
  icon: string;
  color: string;
  listSize: number;
  groupSize: number;
  wordCount: number;
  createdAt: string;
}

/** Custom word in a user-uploaded module */
export interface CustomWord {
  moduleId: string;
  index: number;
  word: string;
  phonetic: string;
  translation: string;
}

/** SM-2 quality ratings */
export type Quality = 0 | 3 | 5;

/** Category configuration (static) */
export const CATEGORIES: Omit<Category, "count">[] = [
  {
    tag: "gaokao",
    label: "高考",
    description: "高考英语大纲词汇",
    icon: "📚",
    color: "from-green-500 to-emerald-600",
  },
  {
    tag: "cet4",
    label: "四级",
    description: "大学英语四级词汇",
    icon: "🎓",
    color: "from-blue-500 to-cyan-600",
  },
  {
    tag: "cet6",
    label: "六级",
    description: "大学英语六级词汇",
    icon: "🏅",
    color: "from-indigo-500 to-purple-600",
  },
  {
    tag: "kaoyan",
    label: "考研",
    description: "研究生入学考试词汇",
    icon: "🎯",
    color: "from-purple-500 to-pink-600",
  },
  {
    tag: "toefl",
    label: "托福",
    description: "托福考试核心词汇",
    icon: "🌍",
    color: "from-orange-500 to-red-600",
  },
  {
    tag: "ielts",
    label: "雅思",
    description: "雅思考试核心词汇",
    icon: "✈️",
    color: "from-teal-500 to-cyan-600",
  },
  {
    tag: "gre",
    label: "GRE",
    description: "GRE 考试高级词汇",
    icon: "🔬",
    color: "from-rose-500 to-pink-600",
  },
  {
    tag: "medical",
    label: "医学词汇",
    description: "医学专业英语词汇",
    icon: "🏥",
    color: "from-red-500 to-rose-600",
  },
];
