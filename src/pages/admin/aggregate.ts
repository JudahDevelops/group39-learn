/**
 * What the admin dashboard shows, worked out from the rows `getAdminData()` returns and the
 * curriculum. Pure functions only (no React, no fetching), so every rule is unit-tested in
 * tests/unit/admin.aggregate.test.ts.
 *
 * Names of things: a "module" is a curriculum chapter (A0, B1, ...). An "item" is what attempts and
 * progress rows point at: a workshop step id, otherwise the block id.
 */
import type { Block, BlockSummary, CurriculumIndex, TrackId } from '../../content/schema';
import { lagosDateKey } from '../../lib/xp';
import type { AdminData, LessonFeedbackRating } from '../../store/types';
import { buildCourse, type Course } from '../course';

// ---------------------------------------------------------------------------
// Members and the course

export interface Member {
  id: string;
  name: string;
}

/** Shown for a member who has not chosen a display name yet. */
export const UNNAMED_MEMBER = 'Unnamed member';

/** Members by name, A to Z, with unnamed ones last. */
export function listMembers(profiles: AdminData['profiles']): Member[] {
  return profiles
    .map((p) => ({ id: p.id, name: p.displayName.trim() || UNNAMED_MEMBER }))
    .sort((a, b) => {
      const aUnnamed = a.name === UNNAMED_MEMBER;
      const bUnnamed = b.name === UNNAMED_MEMBER;
      if (aUnnamed !== bUnnamed) return aUnnamed ? 1 : -1;
      return (
        a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }) || a.id.localeCompare(b.id)
      );
    });
}

/** Workshop block id -> its step ids, read from the curriculum summary (as the map reads them). */
function workshopStepIds(curriculum: CurriculumIndex): Map<string, string[]> {
  const stepIds = new Map<string, string[]>();
  for (const track of curriculum.tracks)
    for (const chapter of track.chapters)
      for (const block of chapter.blocks)
        // A workshop without step ids cannot happen in built content; counting it as one item
        // keeps the dashboard up instead of throwing the way the map does.
        if (block.type === 'workshop') stepIds.set(block.id, block.stepIds ?? [block.id]);
  return stepIds;
}

/** The course with nothing completed: every block in course order (A, B, then Z). */
function emptyCourse(curriculum: CurriculumIndex): Course {
  return buildCourse(curriculum, workshopStepIds(curriculum), new Set());
}

function summariesById(curriculum: CurriculumIndex): Map<string, BlockSummary> {
  return new Map(emptyCourse(curriculum).blocks.map((b) => [b.summary.id, b.summary]));
}

function byUser<T extends { userId: string }>(rows: readonly T[]): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const row of rows) {
    const list = grouped.get(row.userId);
    if (list) list.push(row);
    else grouped.set(row.userId, [row]);
  }
  return grouped;
}

// ---------------------------------------------------------------------------
// Dates (Africa/Lagos)

const LAGOS = 'Africa/Lagos';
const dateFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: LAGOS,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
const timeFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: LAGOS,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function parse(iso: string): number {
  return Date.parse(iso);
}

/** "23 Oct 2026" in Lagos time; empty when the timestamp is not a date. */
export function formatLagosDate(iso: string): string {
  const ms = parse(iso);
  return Number.isNaN(ms) ? '' : dateFormat.format(ms);
}

/** "23 Oct 2026, 14:05" in Lagos time; empty when the timestamp is not a date. */
export function formatLagosDateTime(iso: string): string {
  const ms = parse(iso);
  return Number.isNaN(ms) ? '' : `${dateFormat.format(ms)}, ${timeFormat.format(ms)}`;
}

function dayNumber(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000);
}

/**
 * "Today", "Yesterday" or "N days ago", counting Lagos calendar days (not 24-hour spans).
 * "Never" when there is no activity.
 */
export function lastActiveLabel(at: string | null, now: Date): string {
  if (at === null || Number.isNaN(parse(at))) return 'Never';
  const days = dayNumber(lagosDateKey(now)) - dayNumber(lagosDateKey(new Date(at)));
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

// ---------------------------------------------------------------------------
// Progress grid

export interface GridModule {
  id: string;
  title: string;
  trackId: TrackId;
}

export interface GridCell {
  moduleId: string;
  /** Blocks finished and blocks counted. Optional blocks are left out, as on the map. */
  done: number;
  total: number;
  /** Whole percent, rounded down so only a finished module reads 100. */
  percent: number;
}

export interface GridRow {
  userId: string;
  name: string;
  cells: GridCell[];
  /** ISO time of the latest progress, XP, attempt or quiz attempt; null when there is none. */
  lastActive: string | null;
  lastActiveLabel: string;
}

export interface ProgressGrid {
  modules: GridModule[];
  rows: GridRow[];
}

/** The latest of progress, XP, attempts and quiz attempts for each user, as epoch milliseconds. */
function lastActiveByUser(data: AdminData): Map<string, number> {
  const latest = new Map<string, number>();
  const see = (userId: string, iso: string) => {
    const ms = parse(iso);
    if (Number.isNaN(ms)) return;
    const known = latest.get(userId);
    if (known === undefined || ms > known) latest.set(userId, ms);
  };
  for (const r of data.progress) see(r.userId, r.completedAt);
  for (const r of data.xpEvents) see(r.userId, r.createdAt);
  for (const r of data.attempts) see(r.userId, r.createdAt);
  for (const r of data.quizAttempts) see(r.userId, r.createdAt);
  return latest;
}

/**
 * Members as rows, modules (chapters of tracks A and B, never the Z fixtures) as columns. A cell is
 * the share of the module's blocks the member has finished, by the map's rule: a workshop is
 * finished when every step is, any other block when its own id is.
 */
export function buildProgressGrid(
  curriculum: CurriculumIndex,
  data: AdminData,
  now: Date,
): ProgressGrid {
  const stepIds = workshopStepIds(curriculum);
  const isCourseTrack = (id: TrackId) => id === 'A' || id === 'B';
  const modules: GridModule[] = emptyCourse(curriculum)
    .tracks.filter((t) => isCourseTrack(t.id))
    .flatMap((t) => t.chapters.map((c) => ({ id: c.id, title: c.title, trackId: t.id })));

  const completed = new Map<string, Set<string>>();
  for (const [userId, rows] of byUser(data.progress)) {
    completed.set(userId, new Set(rows.map((r) => r.itemId)));
  }
  const active = lastActiveByUser(data);

  const rows = listMembers(data.profiles).map((member): GridRow => {
    const course = buildCourse(curriculum, stepIds, completed.get(member.id) ?? new Set());
    const cells = course.tracks
      .filter((t) => isCourseTrack(t.id))
      .flatMap((t) => t.chapters)
      .map((c): GridCell => ({
        moduleId: c.id,
        done: c.done,
        total: c.total,
        percent: c.total === 0 ? 0 : Math.floor((100 * c.done) / c.total),
      }));
    const ms = active.get(member.id);
    const lastActive = ms === undefined ? null : new Date(ms).toISOString();
    return {
      userId: member.id,
      name: member.name,
      cells,
      lastActive,
      lastActiveLabel: lastActiveLabel(lastActive, now),
    };
  });
  return { modules, rows };
}

// ---------------------------------------------------------------------------
// Quiz scores

export interface QuizScore {
  userId: string;
  name: string;
  quizId: string;
  title: string;
  roomCode: string;
  bestScore: number;
  bestTotal: number;
  attempts: number;
  /** At least one attempt reached the pass mark. */
  passed: boolean;
}

/** One row per member and quiz (or exam) they have tried, in course order and then by name. */
export function buildQuizScores(curriculum: CurriculumIndex, data: AdminData): QuizScore[] {
  const members = listMembers(data.profiles);
  const quizzes = emptyCourse(curriculum).blocks.filter(
    (b) => b.summary.type === 'quiz' || b.summary.type === 'exam',
  );
  const attemptsBy = new Map<string, AdminData['quizAttempts']>();
  for (const attempt of data.quizAttempts) {
    const key = `${attempt.userId}\u0000${attempt.quizId}`;
    const list = attemptsBy.get(key);
    if (list) list.push(attempt);
    else attemptsBy.set(key, [attempt]);
  }

  const rows: QuizScore[] = [];
  for (const quiz of quizzes) {
    for (const member of members) {
      const attempts = attemptsBy.get(`${member.id}\u0000${quiz.summary.id}`);
      if (!attempts) continue;
      let best = attempts[0];
      for (const attempt of attempts) {
        // Compare as fractions, because the number of questions drawn can change between attempts.
        const better = attempt.score * best.total - best.score * attempt.total;
        if (better > 0 || (better === 0 && attempt.score > best.score)) best = attempt;
      }
      rows.push({
        userId: member.id,
        name: member.name,
        quizId: quiz.summary.id,
        title: quiz.summary.title,
        roomCode: quiz.summary.roomCode,
        bestScore: best.score,
        bestTotal: best.total,
        attempts: attempts.length,
        passed: attempts.some((a) => a.passed),
      });
    }
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Stuck list

/** Failed checks, with no pass after them, that make a step "stuck". */
export const STUCK_AFTER = 5;

export interface StuckEntry {
  userId: string;
  name: string;
  /** The workshop step id, or the lab's block id. */
  itemId: string;
  /** Slug of the block that holds the step, to load its content. */
  slug: string;
  blockTitle: string;
  /** 1-based step number for a workshop; null for a lab. */
  step: number | null;
  /** Failed checks since the last pass (all of them when there has been no pass). */
  failed: number;
  /** 0-based index of the test that failed most often; null when no failure recorded one. */
  testIndex: number | null;
  /** ISO time of the latest failed check. */
  lastFailedAt: string;
}

/** The most frequent index, with ties going to the lowest; null when the list has none. */
function mostCommonIndex(indexes: readonly (number | null)[]): number | null {
  const counts = new Map<number, number>();
  for (const i of indexes) if (i !== null) counts.set(i, (counts.get(i) ?? 0) + 1);
  let best: number | null = null;
  for (const [index, count] of counts) {
    if (best === null) best = index;
    else {
      const bestCount = counts.get(best) ?? 0;
      if (count > bestCount || (count === bestCount && index < best)) best = index;
    }
  }
  return best;
}

/**
 * Each (member, step) with at least STUCK_AFTER failed checks and no pass after them, most failed
 * first. Checks are taken in time order; where two share a time, the order they were stored in.
 */
export function findStuck(curriculum: CurriculumIndex, data: AdminData): StuckEntry[] {
  const names = new Map(listMembers(data.profiles).map((m) => [m.id, m.name]));
  const items = new Map<string, { summary: BlockSummary; step: number | null }>();
  for (const block of emptyCourse(curriculum).blocks) {
    block.itemIds.forEach((itemId, i) =>
      items.set(itemId, {
        summary: block.summary,
        step: block.summary.type === 'workshop' ? i + 1 : null,
      }),
    );
  }

  const ordered = data.attempts
    .map((attempt, position) => ({ attempt, position, time: parse(attempt.createdAt) }))
    .sort((a, b) => a.time - b.time || a.position - b.position);
  const groups = new Map<string, typeof ordered>();
  for (const entry of ordered) {
    const key = `${entry.attempt.userId}\u0000${entry.attempt.itemId}`;
    const list = groups.get(key);
    if (list) list.push(entry);
    else groups.set(key, [entry]);
  }

  const stuck: StuckEntry[] = [];
  for (const group of groups.values()) {
    const { userId, itemId } = group[0].attempt;
    const item = items.get(itemId);
    if (!item) continue;
    let lastPass = -1;
    group.forEach((entry, i) => {
      if (entry.attempt.passed) lastPass = i;
    });
    const failures = group.slice(lastPass + 1);
    if (failures.length < STUCK_AFTER) continue;
    stuck.push({
      userId,
      name: names.get(userId) ?? UNNAMED_MEMBER,
      itemId,
      slug: item.summary.slug,
      blockTitle: item.summary.title,
      step: item.step,
      failed: failures.length,
      testIndex: mostCommonIndex(failures.map((f) => f.attempt.failedTestIndex)),
      lastFailedAt: failures[failures.length - 1].attempt.createdAt,
    });
  }
  return stuck.sort(
    (a, b) =>
      b.failed - a.failed ||
      a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }) ||
      a.itemId.localeCompare(b.itemId),
  );
}

/**
 * The failure message (HTML, built from our own markdown) of test `testIndex` for a step or lab, or
 * null when the block has no such step or test.
 */
export function failingTestMessage(
  block: Block,
  itemId: string,
  testIndex: number | null,
): string | null {
  if (testIndex === null) return null;
  if (block.type === 'workshop') {
    return block.steps.find((s) => s.id === itemId)?.tests[testIndex]?.text ?? null;
  }
  if (block.type === 'lab') return block.lab.tests[testIndex]?.text ?? null;
  return null;
}

// ---------------------------------------------------------------------------
// Lesson feedback

export const RATINGS: readonly { value: LessonFeedbackRating; label: string }[] = [
  { value: 'too_easy', label: 'Too easy' },
  { value: 'just_right', label: 'Just right' },
  { value: 'too_hard', label: 'Too hard' },
  { value: 'confusing', label: 'Confusing' },
];

export function ratingLabel(rating: LessonFeedbackRating): string {
  return RATINGS.find((r) => r.value === rating)?.label ?? rating;
}

export interface BlockRatings {
  blockId: string;
  title: string;
  roomCode: string;
  counts: Record<LessonFeedbackRating, number>;
  total: number;
}

/** Rating counts for each block that has feedback, in course order. */
export function buildRatings(curriculum: CurriculumIndex, data: AdminData): BlockRatings[] {
  const counts = new Map<string, Record<LessonFeedbackRating, number>>();
  for (const f of data.lessonFeedback) {
    const row = counts.get(f.blockId) ?? { too_easy: 0, just_right: 0, too_hard: 0, confusing: 0 };
    row[f.rating] += 1;
    counts.set(f.blockId, row);
  }
  const rows: BlockRatings[] = [];
  for (const block of emptyCourse(curriculum).blocks) {
    const row = counts.get(block.summary.id);
    if (!row) continue;
    rows.push({
      blockId: block.summary.id,
      title: block.summary.title,
      roomCode: block.summary.roomCode,
      counts: row,
      total: row.too_easy + row.just_right + row.too_hard + row.confusing,
    });
  }
  return rows;
}

export interface FeedbackComment {
  userId: string;
  name: string;
  blockId: string;
  title: string;
  rating: LessonFeedbackRating;
  comment: string;
  createdAt: string;
}

/** Written comments, newest first. A feedback row without a comment is left out. */
export function buildComments(curriculum: CurriculumIndex, data: AdminData): FeedbackComment[] {
  const names = new Map(listMembers(data.profiles).map((m) => [m.id, m.name]));
  const summaries = summariesById(curriculum);
  return data.lessonFeedback
    .map((f, position) => ({ f, position }))
    .filter(({ f }) => (f.comment ?? '').trim() !== '' && summaries.has(f.blockId))
    .sort((a, b) => parse(b.f.createdAt) - parse(a.f.createdAt) || b.position - a.position)
    .map(({ f }) => ({
      userId: f.userId,
      name: names.get(f.userId) ?? UNNAMED_MEMBER,
      blockId: f.blockId,
      title: summaries.get(f.blockId)?.title ?? '',
      rating: f.rating,
      comment: (f.comment ?? '').trim(),
      createdAt: f.createdAt,
    }));
}

// ---------------------------------------------------------------------------
// Projects

export type ProjectStatus = 'passed' | 'failing' | 'not_submitted';

export interface ProjectRow {
  userId: string;
  name: string;
  projectId: string;
  title: string;
  roomCode: string;
  status: ProjectStatus;
  repoUrl: string | null;
  /** ISO time of the last check; null when nothing was submitted. */
  checkedAt: string | null;
}

/**
 * One row per member and project block, in course order and then by name. A submission is "passed"
 * or "failing" by its `passed` flag; a member with no submission is "not submitted".
 */
export function buildProjects(curriculum: CurriculumIndex, data: AdminData): ProjectRow[] {
  const members = listMembers(data.profiles);
  const submissions = new Map(
    data.projectSubmissions.map((s) => [`${s.userId}\u0000${s.projectId}`, s]),
  );
  const rows: ProjectRow[] = [];
  for (const block of emptyCourse(curriculum).blocks) {
    if (block.summary.type !== 'project') continue;
    for (const member of members) {
      const submission = submissions.get(`${member.id}\u0000${block.summary.id}`);
      rows.push({
        userId: member.id,
        name: member.name,
        projectId: block.summary.id,
        title: block.summary.title,
        roomCode: block.summary.roomCode,
        status: !submission ? 'not_submitted' : submission.passed ? 'passed' : 'failing',
        repoUrl: submission?.repoUrl ?? null,
        checkedAt: submission?.checkedAt ?? null,
      });
    }
  }
  return rows;
}

/**
 * The address to link to, or null when it is not a web address. A member typed it, so a
 * `javascript:` address must never become a link on the admin's page.
 */
export function safeWebUrl(raw: string): string | null {
  try {
    const url = new URL(raw.trim());
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

/** "owner/repo" for a GitHub address, otherwise the address without its scheme. */
export function repoLabel(raw: string): string {
  const url = safeWebUrl(raw);
  if (!url) return raw;
  const { hostname, pathname } = new URL(url);
  const path = pathname.replace(/\/+$/, '').replace(/\.git$/, '');
  if (hostname === 'github.com' || hostname === 'www.github.com') return path.slice(1) || hostname;
  return `${hostname}${path}`;
}
