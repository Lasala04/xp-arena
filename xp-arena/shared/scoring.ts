// Game rules from the design brief (slide 05 · Game Mechanics).

export const QUESTIONS_PER_ROUND = 15;
export const QUESTION_TIME_MS = 20_000;
export const MAX_POINTS = 1000;
export const STREAK_THRESHOLD = 3;
export const STREAK_BONUS = 200;
export const STREAK_BONUS_CAP = 1000;
export const XP_PER_BONUS_POINT = 1000;
export const BONUS_POINT_CAP = 5;
export const COINS_PER_CORRECT = 10;
export const TOP3_COINS = 25;
export const LEADERBOARD_SIZE = 5;

/**
 * Up to 1,000 points for a correct answer; faster answers earn more.
 * An instant answer earns 1,000 and a last-second answer earns 500, so a
 * correct answer is always worth more than a fast wrong one (which earns 0).
 * The untimed review question pays a flat 1,000 so it never rewards guessing.
 */
export function basePoints(correct: boolean, elapsedMs: number, limitMs: number | null): number {
  if (!correct) return 0;
  if (limitMs === null) return MAX_POINTS;
  const t = Math.min(Math.max(elapsedMs / limitMs, 0), 1);
  return Math.round(MAX_POINTS * (1 - t / 2));
}

/** 3 correct in a row adds +200 XP, and it keeps stacking: +400 on the 4th, +600 on the 5th... */
export function streakBonus(streak: number): number {
  if (streak < STREAK_THRESHOLD) return 0;
  return Math.min((streak - STREAK_THRESHOLD + 1) * STREAK_BONUS, STREAK_BONUS_CAP);
}

/** Every 1,000 XP = +1 bonus point in class standing, capped at +5 per term. */
export function gradeBonus(termXp: number): number {
  return Math.min(Math.floor(termXp / XP_PER_BONUS_POINT), BONUS_POINT_CAP);
}

/** XP still needed for the next bonus point, or null once the term cap is reached. */
export function xpToNextBonus(termXp: number): number | null {
  if (gradeBonus(termXp) >= BONUS_POINT_CAP) return null;
  return XP_PER_BONUS_POINT - (termXp % XP_PER_BONUS_POINT);
}

export function coinsForAnswer(correct: boolean): number {
  return correct ? COINS_PER_CORRECT : 0;
}

export function top3Coins(rank: number): number {
  return rank >= 1 && rank <= 3 ? TOP3_COINS : 0;
}
