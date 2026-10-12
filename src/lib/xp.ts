import type { XpEvent } from '../store/types';

/** XP amounts table, from docs/PLAN.md § Motivation. */
export const XP = {
  lesson: 10,
  lessonPerfectBonus: 5,
  workshopStep: 5,
  lab: 40,
  quizPass: 30,
  project: 80,
  examPass: 100,
} as const;

/**
 * Why an XP event was written. These are the only values the database accepts for
 * xp_events.reason (supabase/migrations/0001_init.sql), and LocalStore enforces the same list.
 * An item can earn each reason once. Perfect lessons earn `lesson` and then `lesson_perfect`.
 */
export const XP_REASONS = [
  'lesson',
  'lesson_perfect',
  'step',
  'lab',
  'quiz',
  'project',
  'exam',
] as const;

export type XpReason = (typeof XP_REASONS)[number];

/** The fixed amount each reason pays. The database checks the same pairs (supabase/migrations/0001_init.sql). */
export const XP_BY_REASON: Record<XpReason, number> = {
  lesson: XP.lesson,
  lesson_perfect: XP.lessonPerfectBonus,
  step: XP.workshopStep,
  lab: XP.lab,
  quiz: XP.quizPass,
  project: XP.project,
  exam: XP.examPass,
};

/** The most XP one event can carry (an exam pass). The database refuses anything above it. */
export const MAX_XP_PER_EVENT = 100;

export function isXpReason(value: string): value is XpReason {
  return (XP_REASONS as readonly string[]).includes(value);
}

/** Africa/Lagos is UTC+1 year-round (no DST). */
const LAGOS_OFFSET_MINUTES = 60;

/** Returns the Lagos-local calendar day, as 'YYYY-MM-DD', for a given instant. */
export function lagosDateKey(instant: Date): string {
  const lagosMs = instant.getTime() + LAGOS_OFFSET_MINUTES * 60_000;
  const lagos = new Date(lagosMs);
  const y = lagos.getUTCFullYear();
  const m = String(lagos.getUTCMonth() + 1).padStart(2, '0');
  const d = String(lagos.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Day-of-week in Lagos local time: 0 = Monday … 6 = Sunday. */
function lagosWeekday(instant: Date): number {
  const lagosMs = instant.getTime() + LAGOS_OFFSET_MINUTES * 60_000;
  const lagos = new Date(lagosMs);
  const jsDay = lagos.getUTCDay(); // 0 = Sunday … 6 = Saturday
  return (jsDay + 6) % 7; // 0 = Monday … 6 = Sunday
}

/** Start of the Lagos-local Monday–Sunday week containing `instant`, as a date key. */
function lagosWeekStartKey(instant: Date): string {
  const lagosMs = instant.getTime() + LAGOS_OFFSET_MINUTES * 60_000;
  const lagos = new Date(lagosMs);
  const weekday = lagosWeekday(instant);
  const mondayMs = lagos.getTime() - weekday * 86_400_000;
  const monday = new Date(mondayMs);
  const y = monday.getUTCFullYear();
  const m = String(monday.getUTCMonth() + 1).padStart(2, '0');
  const d = String(monday.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function dateKeyToUtcMidnight(key: string): number {
  const [y, m, d] = key.split('-').map(Number);
  // The Lagos day `key` starts at 00:00 Lagos = 23:00 UTC the previous day (offset +1h).
  return Date.UTC(y, m - 1, d) - LAGOS_OFFSET_MINUTES * 60_000;
}

/**
 * Current streak as of `now`, in Lagos time: the number of consecutive days,
 * each with at least 1 XP, that end today or yesterday.
 *
 * - XP today: the run ends today.
 * - No XP today but XP yesterday: the run ends yesterday. The streak is still
 *   alive until today ends, so opening the app in the morning must not show 0.
 * - No XP today and none yesterday: the streak is broken, so 0.
 */
export function streakDays(events: XpEvent[], now: Date): number {
  if (events.length === 0) return 0;

  const daySet = new Set<string>();
  for (const e of events) {
    daySet.add(lagosDateKey(new Date(e.createdAt)));
  }

  const todayKey = lagosDateKey(now);
  const todayMs = dateKeyToUtcMidnight(todayKey);

  // Start counting back from today if it has XP, otherwise from yesterday.
  let anchorMs: number;
  if (daySet.has(todayKey)) {
    anchorMs = todayMs;
  } else {
    const yesterdayMs = todayMs - 86_400_000;
    const yesterdayKey = lagosDateKey(new Date(yesterdayMs + LAGOS_OFFSET_MINUTES * 60_000));
    if (!daySet.has(yesterdayKey)) return 0;
    anchorMs = yesterdayMs;
  }

  let count = 0;
  let cursorMs = anchorMs;
  for (;;) {
    const cursorKey = lagosDateKey(new Date(cursorMs + LAGOS_OFFSET_MINUTES * 60_000));
    if (!daySet.has(cursorKey)) break;
    count += 1;
    cursorMs -= 86_400_000;
  }
  return count;
}

/** XP goal a learner gets before they pick one at onboarding (30, 60, 100 or 150). */
export const DEFAULT_DAILY_GOAL_XP = 60;

/** Total XP earned today, Lagos time. */
export function todayXp(events: XpEvent[], now: Date): number {
  const todayKey = lagosDateKey(now);
  return events
    .filter((e) => lagosDateKey(new Date(e.createdAt)) === todayKey)
    .reduce((sum, e) => sum + e.amount, 0);
}

/** Total XP earned in the Monday–Sunday Lagos week containing `now`. */
export function weeklyXp(events: XpEvent[], now: Date): number {
  const weekStartKey = lagosWeekStartKey(now);
  const weekStartMs = dateKeyToUtcMidnight(weekStartKey);
  const weekEndMs = weekStartMs + 7 * 86_400_000;
  return events
    .filter((e) => {
      const t = new Date(e.createdAt).getTime();
      return t >= weekStartMs && t < weekEndMs;
    })
    .reduce((sum, e) => sum + e.amount, 0);
}
