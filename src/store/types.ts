/**
 * ProgressStore: the interface every feature (lesson/workshop/lab/quiz/project
 * players, map, home, leaderboard, admin dashboard) talks to. Two implementations:
 * LocalStore (localStorage, dev + e2e) and SupabaseStore (later WP). Shapes here
 * mirror the Supabase tables in docs/PLAN.md so both stay in lockstep.
 */

import type { XpReason } from '../lib/xp';

export type Role = 'member' | 'admin';

/** Mirrors the `profiles` table. */
export interface Profile {
  id: string;
  displayName: string;
  githubUsername: string | null;
  role: Role;
  dailyGoalXp: number;
}

export type ProfileUpdate = Partial<
  Pick<Profile, 'displayName' | 'githubUsername' | 'role' | 'dailyGoalXp'>
>;

/** Mirrors the `progress` table. pk(userId, itemId). */
export interface ProgressEntry {
  userId: string;
  itemId: string;
  blockId: string;
  completedAt: string; // ISO timestamp
}

/** Mirrors the `xp_events` table. unique(userId, itemId, reason). */
export interface XpEvent {
  userId: string;
  itemId: string;
  reason: XpReason;
  amount: number;
  createdAt: string; // ISO timestamp
}

/** Mirrors the `attempts` table. Feeds the admin "stuck list". */
export interface Attempt {
  userId: string;
  itemId: string;
  passed: boolean;
  failedTestIndex: number | null;
  createdAt: string; // ISO timestamp
}

/** One file in a workshop/lab's multi-file editor, keyed by filename elsewhere. */
export type CodeFiles = Record<string, string>;

/** Mirrors the `code_saves` table. */
export interface CodeSave {
  userId: string;
  itemId: string;
  files: CodeFiles;
  updatedAt: string; // ISO timestamp
}

/** Mirrors the `quiz_attempts` table. */
export interface QuizAttempt {
  userId: string;
  quizId: string;
  score: number;
  total: number;
  passed: boolean;
  wrongIds: string[];
  createdAt: string; // ISO timestamp
}

export type LessonFeedbackRating = 'too_easy' | 'just_right' | 'too_hard' | 'confusing';

/** Mirrors the `lesson_feedback` table. */
export interface LessonFeedback {
  userId: string;
  blockId: string;
  rating: LessonFeedbackRating;
  comment: string | null;
  createdAt: string; // ISO timestamp
}

/** Mirrors the `project_submissions` table. */
export interface ProjectSubmission {
  userId: string;
  projectId: string;
  repoUrl: string;
  runUrl: string | null;
  jobs: unknown;
  passed: boolean;
  checkedAt: string; // ISO timestamp
}

/**
 * Everything the admin dashboard reads: every member's rows, cut down to the columns the page uses.
 * Each list holds rows from all members (LocalStore: the one local user).
 */
export interface AdminData {
  profiles: Pick<Profile, 'id' | 'displayName'>[];
  progress: Pick<ProgressEntry, 'userId' | 'itemId' | 'completedAt'>[];
  xpEvents: Pick<XpEvent, 'userId' | 'createdAt'>[];
  attempts: Attempt[];
  quizAttempts: Pick<
    QuizAttempt,
    'userId' | 'quizId' | 'score' | 'total' | 'passed' | 'createdAt'
  >[];
  lessonFeedback: LessonFeedback[];
  projectSubmissions: Pick<
    ProjectSubmission,
    'userId' | 'projectId' | 'repoUrl' | 'passed' | 'checkedAt'
  >[];
}

export interface LeaderboardRow {
  userId: string;
  displayName: string;
  weekXp: number;
  allTimeXp: number;
}

/**
 * Store abstraction. Every method that mutates state is synchronous-looking
 * from the caller's point of view but returns a Promise so SupabaseStore can
 * do network I/O without changing call sites.
 */
export interface ProgressStore {
  // --- auth ---
  /**
   * Restores any existing session (e.g. from a Supabase session token, or
   * LocalStore's saved profile) before the app renders. Call once at startup;
   * `getCurrentUser()` only reflects reality after this resolves.
   */
  init(): Promise<void>;
  /** Cached synchronously after init()/signIn()/signOut() — no I/O here. */
  getCurrentUser(): Profile | null;
  signIn(email: string, password: string): Promise<Profile>;
  signOut(): Promise<void>;
  /** Sets the signed-in user's password. Used by the invite flow (Supabase). */
  setPassword(newPassword: string): Promise<void>;
  /**
   * Subscribes to auth state changes (sign-in, sign-out, session restore).
   * Returns an unsubscribe function.
   */
  onAuthChange(listener: (user: Profile | null) => void): () => void;

  // --- profile ---
  getProfile(userId: string): Promise<Profile | null>;
  updateProfile(userId: string, update: ProfileUpdate): Promise<Profile>;

  // --- progress ---
  markComplete(itemId: string, blockId: string): Promise<void>;
  listCompleted(userId: string): Promise<ProgressEntry[]>;

  // --- xp ---
  /**
   * Returns false if (itemId, reason) was already awarded for this user. `reason` must be one of
   * XP_REASONS and `amount` a whole number from 1 to 100, or the store throws.
   */
  awardXp(itemId: string, reason: XpReason, amount: number): Promise<boolean>;
  listXpEvents(userId: string): Promise<XpEvent[]>;

  // --- attempts ---
  recordAttempt(itemId: string, passed: boolean, failedTestIndex?: number): Promise<void>;

  // --- code saves ---
  saveCode(itemId: string, files: CodeFiles): Promise<void>;
  loadCode(itemId: string): Promise<CodeFiles | null>;

  // --- quiz ---
  recordQuizAttempt(
    quizId: string,
    score: number,
    total: number,
    passed: boolean,
    wrongIds: string[],
  ): Promise<void>;

  // --- lesson feedback ---
  recordLessonFeedback(
    blockId: string,
    rating: LessonFeedbackRating,
    comment?: string,
  ): Promise<void>;

  // --- project submissions ---
  getProjectSubmission(projectId: string): Promise<ProjectSubmission | null>;
  saveProjectSubmission(
    projectId: string,
    repoUrl: string,
    extra?: Partial<Pick<ProjectSubmission, 'runUrl' | 'jobs' | 'passed'>>,
  ): Promise<ProjectSubmission>;

  // --- leaderboard ---
  getLeaderboard(): Promise<LeaderboardRow[]>;

  // --- admin ---
  /**
   * Every member's profile, progress, XP events, attempts, quiz attempts, lesson feedback and
   * project submissions, for the admin dashboard. In Supabase the row-level security policies
   * give admins read access to all rows and nobody else; LocalStore returns the one local user's.
   */
  getAdminData(): Promise<AdminData>;
}
