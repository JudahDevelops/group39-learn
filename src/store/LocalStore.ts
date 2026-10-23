import {
  DEFAULT_DAILY_GOAL_XP,
  XP_BY_REASON,
  isXpReason,
  weeklyXp,
  type XpReason,
} from '../lib/xp';
import type {
  AdminData,
  Attempt,
  CodeFiles,
  LeaderboardRow,
  LessonFeedback,
  LessonFeedbackRating,
  ProgressEntry,
  ProjectSubmission,
  ProgressStore,
  Profile,
  ProfileUpdate,
  QuizAttempt,
  XpEvent,
} from './types';

/**
 * localStorage-backed ProgressStore. Dev + e2e only — single local user,
 * sign-in accepts ANY email and ANY non-empty password with no real
 * verification (see signIn below). Every storage access is wrapped in
 * try/catch so the app keeps working (in-memory only, state lost on reload)
 * when localStorage is unavailable (private mode, storage quota, disabled
 * cookies, etc).
 */

const KEYS = {
  profile: 'g39.profile',
  /** true while someone is signed in. The profile outlives a sign-out, like a database row. */
  session: 'g39.session',
  progress: 'g39.progress',
  xpEvents: 'g39.xpEvents',
  attempts: 'g39.attempts',
  codeSaves: 'g39.codeSaves',
  quizAttempts: 'g39.quizAttempts',
  lessonFeedback: 'g39.lessonFeedback',
  projectSubmissions: 'g39.projectSubmissions',
} as const;

const LOCAL_USER_ID = 'local-dev-user';

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable or full — silently no-op; state lives only in memory
    // for the rest of this session via the in-memory fallback cache below.
  }
}

/**
 * In-memory fallback mirror, used when localStorage throws (quota exceeded,
 * disabled, private browsing in some browsers). Keeps the store usable for
 * the lifetime of the page even with zero persistence.
 */
class MemoryMirror {
  private cache = new Map<string, unknown>();

  get<T>(key: string, fallback: T): T {
    if (this.cache.has(key)) return this.cache.get(key) as T;
    const fromStorage = safeGet(key, fallback);
    this.cache.set(key, fromStorage);
    return fromStorage;
  }

  set(key: string, value: unknown): void {
    this.cache.set(key, value);
    safeSet(key, value);
  }
}

export class LocalStore implements ProgressStore {
  private mirror = new MemoryMirror();
  /** Cached in-memory copy, populated by init()/signIn()/signOut() so
   * getCurrentUser() can stay synchronous — mirrors how SupabaseStore will
   * cache the session after an async init(). */
  private currentUser: Profile | null = null;
  private listeners = new Set<(user: Profile | null) => void>();

  /**
   * Restores the saved local profile, if any, into the synchronous cache.
   * Dev-mode note: LocalStore has no real session/token — this just reads
   * whatever profile was last saved to localStorage.
   */
  async init(): Promise<void> {
    const signedIn = this.mirror.get<boolean>(KEYS.session, false);
    this.currentUser = signedIn ? this.mirror.get<Profile | null>(KEYS.profile, null) : null;
    this.emitAuthChange();
  }

  getCurrentUser(): Profile | null {
    return this.currentUser;
  }

  /**
   * Dev-mode sign-in: accepts ANY email and ANY non-empty password with no
   * verification. Never use this store (or this behaviour) in production —
   * it exists so UI and e2e work never wait on Judah's Supabase project.
   */
  async signIn(_email: string, password: string): Promise<Profile> {
    if (!password) {
      throw new Error('Enter a password to continue (dev mode: any value works).');
    }
    this.mirror.set(KEYS.session, true);
    const existing = this.mirror.get<Profile | null>(KEYS.profile, null);
    if (existing) {
      this.currentUser = existing;
      this.emitAuthChange();
      return existing;
    }

    // Like a new Supabase user: the display name starts empty and onboarding asks for it.
    const profile: Profile = {
      id: LOCAL_USER_ID,
      displayName: '',
      githubUsername: null,
      role: 'member',
      dailyGoalXp: DEFAULT_DAILY_GOAL_XP,
    };
    this.mirror.set(KEYS.profile, profile);
    this.currentUser = profile;
    this.emitAuthChange();
    return profile;
  }

  async signOut(): Promise<void> {
    this.mirror.set(KEYS.session, false);
    this.currentUser = null;
    this.emitAuthChange();
  }

  /**
   * Dev mode: no password is actually stored or checked anywhere in
   * LocalStore, so this is a no-op beyond requiring a signed-in user. The
   * invite flow's real behaviour lives in SupabaseStore.
   */
  async setPassword(newPassword: string): Promise<void> {
    this.requireUser();
    if (!newPassword) {
      throw new Error('Password cannot be empty.');
    }
  }

  onAuthChange(listener: (user: Profile | null) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emitAuthChange(): void {
    for (const listener of this.listeners) {
      listener(this.currentUser);
    }
  }

  async getProfile(userId: string): Promise<Profile | null> {
    const profile = this.mirror.get<Profile | null>(KEYS.profile, null);
    if (!profile || profile.id !== userId) return null;
    return profile;
  }

  async updateProfile(userId: string, update: ProfileUpdate): Promise<Profile> {
    const profile = this.mirror.get<Profile | null>(KEYS.profile, null);
    if (!profile || profile.id !== userId) {
      throw new Error('No signed-in profile to update');
    }
    const next: Profile = { ...profile, ...update };
    this.mirror.set(KEYS.profile, next);
    if (this.currentUser && this.currentUser.id === userId) {
      this.currentUser = next;
      this.emitAuthChange();
    }
    return next;
  }

  async markComplete(itemId: string, blockId: string): Promise<void> {
    const user = this.requireUser();
    const list = this.mirror.get<ProgressEntry[]>(KEYS.progress, []);
    const already = list.some((p) => p.userId === user.id && p.itemId === itemId);
    if (already) return;
    const entry: ProgressEntry = {
      userId: user.id,
      itemId,
      blockId,
      completedAt: new Date().toISOString(),
    };
    this.mirror.set(KEYS.progress, [...list, entry]);
  }

  async listCompleted(userId: string): Promise<ProgressEntry[]> {
    const list = this.mirror.get<ProgressEntry[]>(KEYS.progress, []);
    return list.filter((p) => p.userId === userId);
  }

  async awardXp(itemId: string, reason: XpReason, amount: number): Promise<boolean> {
    const user = this.requireUser();
    // The same two rules the database enforces, so a mistake shows up in dev mode too.
    if (!isXpReason(reason)) throw new Error(`Unknown XP reason "${reason}".`);
    if (amount !== XP_BY_REASON[reason]) {
      throw new Error(`A "${reason}" award is ${XP_BY_REASON[reason]} XP, not ${amount}.`);
    }
    const list = this.mirror.get<XpEvent[]>(KEYS.xpEvents, []);
    const already = list.some(
      (e) => e.userId === user.id && e.itemId === itemId && e.reason === reason,
    );
    if (already) return false;
    const event: XpEvent = {
      userId: user.id,
      itemId,
      reason,
      amount,
      createdAt: new Date().toISOString(),
    };
    this.mirror.set(KEYS.xpEvents, [...list, event]);
    return true;
  }

  async listXpEvents(userId: string): Promise<XpEvent[]> {
    const list = this.mirror.get<XpEvent[]>(KEYS.xpEvents, []);
    return list.filter((e) => e.userId === userId);
  }

  async recordAttempt(itemId: string, passed: boolean, failedTestIndex?: number): Promise<void> {
    const user = this.requireUser();
    const list = this.mirror.get<Attempt[]>(KEYS.attempts, []);
    const attempt: Attempt = {
      userId: user.id,
      itemId,
      passed,
      failedTestIndex: failedTestIndex ?? null,
      createdAt: new Date().toISOString(),
    };
    this.mirror.set(KEYS.attempts, [...list, attempt]);
  }

  async saveCode(itemId: string, files: CodeFiles): Promise<void> {
    const user = this.requireUser();
    const all = this.mirror.get<Record<string, CodeFiles>>(KEYS.codeSaves, {});
    const key = `${user.id}:${itemId}`;
    this.mirror.set(KEYS.codeSaves, { ...all, [key]: files });
  }

  async loadCode(itemId: string): Promise<CodeFiles | null> {
    const user = this.requireUser();
    const all = this.mirror.get<Record<string, CodeFiles>>(KEYS.codeSaves, {});
    const key = `${user.id}:${itemId}`;
    return all[key] ?? null;
  }

  async recordQuizAttempt(
    quizId: string,
    score: number,
    total: number,
    passed: boolean,
    wrongIds: string[],
  ): Promise<void> {
    const user = this.requireUser();
    const list = this.mirror.get<QuizAttempt[]>(KEYS.quizAttempts, []);
    const attempt: QuizAttempt = {
      userId: user.id,
      quizId,
      score,
      total,
      passed,
      wrongIds,
      createdAt: new Date().toISOString(),
    };
    this.mirror.set(KEYS.quizAttempts, [...list, attempt]);
  }

  async recordLessonFeedback(
    blockId: string,
    rating: LessonFeedbackRating,
    comment?: string,
  ): Promise<void> {
    const user = this.requireUser();
    const list = this.mirror.get<LessonFeedback[]>(KEYS.lessonFeedback, []);
    const feedback: LessonFeedback = {
      userId: user.id,
      blockId,
      rating,
      comment: comment ?? null,
      createdAt: new Date().toISOString(),
    };
    this.mirror.set(KEYS.lessonFeedback, [...list, feedback]);
  }

  async getProjectSubmission(projectId: string): Promise<ProjectSubmission | null> {
    const user = this.requireUser();
    const all = this.mirror.get<ProjectSubmission[]>(KEYS.projectSubmissions, []);
    return all.find((p) => p.userId === user.id && p.projectId === projectId) ?? null;
  }

  async saveProjectSubmission(
    projectId: string,
    repoUrl: string,
    extra?: Partial<Pick<ProjectSubmission, 'runUrl' | 'jobs' | 'passed'>>,
  ): Promise<ProjectSubmission> {
    const user = this.requireUser();
    const all = this.mirror.get<ProjectSubmission[]>(KEYS.projectSubmissions, []);
    const submission: ProjectSubmission = {
      userId: user.id,
      projectId,
      repoUrl,
      runUrl: extra?.runUrl ?? null,
      jobs: extra?.jobs ?? null,
      passed: extra?.passed ?? false,
      checkedAt: new Date().toISOString(),
    };
    const next = [
      ...all.filter((p) => !(p.userId === user.id && p.projectId === projectId)),
      submission,
    ];
    this.mirror.set(KEYS.projectSubmissions, next);
    return submission;
  }

  async getLeaderboard(): Promise<LeaderboardRow[]> {
    // Single local user: a leaderboard of one. Kept here (rather than thrown)
    // so UI built against this store can render the leaderboard page in dev.
    const profile = this.mirror.get<Profile | null>(KEYS.profile, null);
    if (!profile) return [];
    const events = this.mirror
      .get<XpEvent[]>(KEYS.xpEvents, [])
      .filter((e) => e.userId === profile.id);
    const allTimeXp = events.reduce((sum, e) => sum + e.amount, 0);
    return [
      {
        userId: profile.id,
        displayName: profile.displayName,
        weekXp: weeklyXp(events, new Date()),
        allTimeXp,
      },
    ];
  }

  async getAdminData(): Promise<AdminData> {
    // One local user, so "every member" is that person. Each list is cut down to the columns the
    // dashboard uses, the same as SupabaseStore selects them.
    const profile = this.mirror.get<Profile | null>(KEYS.profile, null);
    if (!profile) {
      return {
        profiles: [],
        progress: [],
        xpEvents: [],
        attempts: [],
        quizAttempts: [],
        lessonFeedback: [],
        projectSubmissions: [],
      };
    }
    const mine = <T extends { userId: string }>(key: string): T[] =>
      this.mirror.get<T[]>(key, []).filter((row) => row.userId === profile.id);
    return {
      profiles: [{ id: profile.id, displayName: profile.displayName }],
      progress: mine<ProgressEntry>(KEYS.progress).map((r) => ({
        userId: r.userId,
        itemId: r.itemId,
        completedAt: r.completedAt,
      })),
      xpEvents: mine<XpEvent>(KEYS.xpEvents).map((r) => ({
        userId: r.userId,
        createdAt: r.createdAt,
      })),
      attempts: mine<Attempt>(KEYS.attempts).map((r) => ({
        userId: r.userId,
        itemId: r.itemId,
        passed: r.passed,
        failedTestIndex: r.failedTestIndex,
        createdAt: r.createdAt,
      })),
      quizAttempts: mine<QuizAttempt>(KEYS.quizAttempts).map((r) => ({
        userId: r.userId,
        quizId: r.quizId,
        score: r.score,
        total: r.total,
        passed: r.passed,
        createdAt: r.createdAt,
      })),
      lessonFeedback: mine<LessonFeedback>(KEYS.lessonFeedback).map((r) => ({
        userId: r.userId,
        blockId: r.blockId,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
      })),
      projectSubmissions: mine<ProjectSubmission>(KEYS.projectSubmissions).map((r) => ({
        userId: r.userId,
        projectId: r.projectId,
        repoUrl: r.repoUrl,
        passed: r.passed,
        checkedAt: r.checkedAt,
      })),
    };
  }

  private requireUser(): Profile {
    const user = this.getCurrentUser();
    if (!user) throw new Error('No signed-in user');
    return user;
  }
}
