import { openDB, type IDBPDatabase } from "idb";
import type { CardState, DailyStats, UserSettings, CustomModule, CustomWord } from "@/types";

const DB_NAME = "openwords";
const DB_VERSION = 2;

interface OpenWordsDB {
  cardStates: {
    key: number; // wordId
    value: CardState;
    indexes: { byNextReview: string };
  };
  dailyStats: {
    key: string; // date YYYY-MM-DD
    value: DailyStats;
  };
  settings: {
    key: string;
    value: UserSettings;
  };
  customModules: {
    key: string; // module id
    value: CustomModule;
  };
  customWords: {
    key: [string, number]; // [moduleId, index]
    value: CustomWord;
    indexes: { byModule: string };
  };
}

let dbPromise: Promise<IDBPDatabase<OpenWordsDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<OpenWordsDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          // Card states store
          const cardStore = db.createObjectStore("cardStates", {
            keyPath: "wordId",
          });
          cardStore.createIndex("byNextReview", "nextReview");

          // Daily stats store
          db.createObjectStore("dailyStats", { keyPath: "date" });

          // Settings store
          db.createObjectStore("settings");
        }
        if (oldVersion < 2) {
          // Custom modules store
          db.createObjectStore("customModules", { keyPath: "id" });

          // Custom words store
          const wordStore = db.createObjectStore("customWords", {
            keyPath: ["moduleId", "index"],
          });
          wordStore.createIndex("byModule", "moduleId");
        }
      },
    });
  }
  return dbPromise;
}

// ============================================================
// Card State Operations
// ============================================================

export async function getCardState(
  wordId: number
): Promise<CardState | undefined> {
  const db = await getDB();
  return db.get("cardStates", wordId);
}

export async function saveCardState(state: CardState): Promise<void> {
  const db = await getDB();
  await db.put("cardStates", state);
}

export async function getAllCardStates(): Promise<CardState[]> {
  const db = await getDB();
  return db.getAll("cardStates");
}

export async function getDueCards(category?: string): Promise<CardState[]> {
  const db = await getDB();
  const all = await db.getAll("cardStates");
  const now = new Date().toISOString();
  return all.filter((card) => card.nextReview <= now);
}

export async function getCardStatesForWords(
  wordIds: number[]
): Promise<Map<number, CardState>> {
  const db = await getDB();
  const map = new Map<number, CardState>();
  for (const id of wordIds) {
    const state = await db.get("cardStates", id);
    if (state) map.set(id, state);
  }
  return map;
}

export async function getLearnedCountForCategory(
  wordIds: number[]
): Promise<number> {
  const db = await getDB();
  let count = 0;
  for (const id of wordIds) {
    const state = await db.get("cardStates", id);
    if (state && state.repetitions > 0) count++;
  }
  return count;
}

export async function getDueCardsForWordIds(
  wordIds: number[]
): Promise<number> {
  const db = await getDB();
  const now = new Date().toISOString();
  let count = 0;
  for (const id of wordIds) {
    const state = await db.get("cardStates", id);
    if (state && state.repetitions > 0 && state.nextReview <= now) count++;
  }
  return count;
}

export async function getDueWordIdsForCategory(
  wordIds: number[]
): Promise<number[]> {
  const db = await getDB();
  const now = new Date().toISOString();
  const dueIds: number[] = [];
  for (const id of wordIds) {
    const state = await db.get("cardStates", id);
    if (state && state.repetitions > 0 && state.nextReview <= now) {
      dueIds.push(id);
    }
  }
  return dueIds;
}

// ============================================================
// Daily Stats Operations
// ============================================================

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export async function getTodayStats(): Promise<DailyStats> {
  const db = await getDB();
  const date = todayStr();
  const stats = await db.get("dailyStats", date);
  return stats ?? { date, learned: 0, reviewed: 0 };
}

export async function incrementTodayStats(
  type: "learned" | "reviewed"
): Promise<void> {
  const db = await getDB();
  const date = todayStr();
  const stats = (await db.get("dailyStats", date)) ?? {
    date,
    learned: 0,
    reviewed: 0,
  };
  stats[type] += 1;
  await db.put("dailyStats", stats);
}

export async function getRecentStats(days: number = 30): Promise<DailyStats[]> {
  const db = await getDB();
  const all = await db.getAll("dailyStats");
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split("T")[0];
  return all
    .filter((s) => s.date >= cutoffStr)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getStreakDays(): Promise<number> {
  const db = await getDB();
  const all = await db.getAll("dailyStats");
  if (all.length === 0) return 0;

  const dates = new Set(
    all.filter((s) => s.learned + s.reviewed > 0).map((s) => s.date)
  );

  let streak = 0;
  const d = new Date();
  // Check today first
  const todayDate = d.toISOString().split("T")[0];
  if (!dates.has(todayDate)) {
    // If today hasn't been studied, check if yesterday was
    d.setDate(d.getDate() - 1);
  }

  while (true) {
    const dateStr = d.toISOString().split("T")[0];
    if (dates.has(dateStr)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

// ============================================================
// Settings Operations
// ============================================================

const DEFAULT_SETTINGS: UserSettings = {
  accent: "en-US",
  dailyGoal: 20,
  autoPlayAudio: false,
  listSize: 80,
  groupSize: 20,
};

export async function getSettings(): Promise<UserSettings> {
  const db = await getDB();
  const settings = await db.get("settings", "user");
  return { ...DEFAULT_SETTINGS, ...settings };
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  const db = await getDB();
  await db.put("settings", settings, "user");
}

// ============================================================
// Custom Module Operations
// ============================================================

export async function getAllCustomModules(): Promise<CustomModule[]> {
  const db = await getDB();
  return db.getAll("customModules");
}

export async function getCustomModule(
  id: string
): Promise<CustomModule | undefined> {
  const db = await getDB();
  return db.get("customModules", id);
}

export async function saveCustomModule(
  module: CustomModule,
  words: CustomWord[]
): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(["customModules", "customWords"], "readwrite");
  await tx.objectStore("customModules").put(module);
  const wordStore = tx.objectStore("customWords");
  for (const w of words) {
    await wordStore.put(w);
  }
  await tx.done;
}

export async function deleteCustomModule(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(["customModules", "customWords"], "readwrite");
  await tx.objectStore("customModules").delete(id);
  // Delete all words for this module
  const wordStore = tx.objectStore("customWords");
  const idx = wordStore.index("byModule");
  let cursor = await idx.openCursor(id);
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
}

function knuthHash(n: number): number {
  return ((n * 2654435761) % 4294967296) >>> 0;
}

export async function getCustomWordsForList(
  moduleId: string,
  listIndex: number,
  listSize: number
): Promise<CustomWord[]> {
  const db = await getDB();
  const idx = db.transaction("customWords").store.index("byModule");
  const allWords = await idx.getAll(moduleId);
  allWords.sort((a, b) => knuthHash(a.index) - knuthHash(b.index));
  const start = listIndex * listSize;
  return allWords.slice(start, start + listSize);
}

export async function getCustomWordsForGroup(
  moduleId: string,
  listIndex: number,
  groupIndex: number,
  listSize: number,
  groupSize: number
): Promise<CustomWord[]> {
  const db = await getDB();
  const idx = db.transaction("customWords").store.index("byModule");
  const allWords = await idx.getAll(moduleId);
  allWords.sort((a, b) => knuthHash(a.index) - knuthHash(b.index));
  const start = listIndex * listSize + groupIndex * groupSize;
  return allWords.slice(start, start + groupSize);
}
