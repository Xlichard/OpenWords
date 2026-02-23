import type { CardState, Quality } from "@/types";

/**
 * Simplified SM-2 spaced repetition algorithm.
 *
 * Quality ratings:
 *   0 = Forgot (complete blackout)
 *   3 = Hard   (recalled with difficulty)
 *   5 = Easy   (perfect recall)
 */

const MIN_EASE_FACTOR = 1.3;

/**
 * Create a new card state for a word being learned for the first time.
 */
export function createCardState(wordId: number): CardState {
  return {
    wordId,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: new Date().toISOString(),
    lastReview: new Date().toISOString(),
  };
}

/**
 * Update card state based on the user's quality rating.
 * Returns a new CardState (immutable).
 */
export function reviewCard(state: CardState, quality: Quality): CardState {
  const now = new Date();
  let { easeFactor, interval, repetitions } = state;

  if (quality === 0) {
    // Forgot: reset repetitions, short interval
    repetitions = 0;
    interval = 1 / 1440; // ~1 minute in days
  } else if (quality === 3) {
    // Hard: partial credit
    if (repetitions === 0) {
      interval = 0.5; // 12 hours
    } else {
      interval = Math.max(interval * 1.2, 0.5);
    }
    repetitions += 1;
  } else {
    // Easy (quality === 5): standard SM-2 progression
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 3;
    } else {
      interval = interval * easeFactor;
    }
    repetitions += 1;
  }

  // Update ease factor using SM-2 formula
  easeFactor =
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  easeFactor = Math.max(easeFactor, MIN_EASE_FACTOR);

  // Calculate next review time
  const nextReview = new Date(
    now.getTime() + interval * 24 * 60 * 60 * 1000
  );

  return {
    wordId: state.wordId,
    easeFactor: Math.round(easeFactor * 100) / 100,
    interval: Math.round(interval * 100) / 100,
    repetitions,
    nextReview: nextReview.toISOString(),
    lastReview: now.toISOString(),
  };
}

/**
 * Check if a card is due for review.
 */
export function isDue(state: CardState): boolean {
  return new Date(state.nextReview) <= new Date();
}

/**
 * Get a human-readable description of the next review interval.
 */
export function formatInterval(days: number): string {
  if (days < 1 / 60) return "1 分钟后";
  if (days < 1 / 24) return `${Math.round(days * 24 * 60)} 分钟后`;
  if (days < 1) return `${Math.round(days * 24)} 小时后`;
  if (days < 30) return `${Math.round(days)} 天后`;
  return `${Math.round(days / 30)} 个月后`;
}
