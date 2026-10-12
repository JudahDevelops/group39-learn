import {
  createClient,
  isAuthRetryableFetchError,
  type AuthError,
  type Session,
  type SupabaseClient,
} from '@supabase/supabase-js';
import type { XpReason } from '../lib/xp';
import type {
  CodeFiles,
  LeaderboardRow,
  LessonFeedbackRating,
  Profile,
  ProfileUpdate,
  ProgressEntry,
  ProgressStore,
  ProjectSubmission,
  Role,
  XpEvent,
} from './types';

/**
 * ProgressStore on Supabase (Postgres + auth). Tables, row-level security and the leaderboard
 * view are in supabase/migrations/0001_init.sql; the store only maps rows to the shapes in
 * ./types and turns errors into plain sentences.
 */

// --- row shapes (snake_case, as the database returns them) ---

interface ProfileRow {
  id: string;
  display_name: string;
  github_username: string | null;
  role: Role;
  daily_goal_xp: number;
}

interface ProgressRow {
  user_id: string;
  item_id: string;
  block_id: string;
  completed_at: string;
}

interface XpEventRow {
  user_id: string;
  item_id: string;
  reason: XpReason;
  amount: number;
  created_at: string;
}

interface ProjectSubmissionRow {
  user_id: string;
  project_id: string;
  repo_url: string;
  run_url: string | null;
  jobs: unknown;
  passed: boolean;
  checked_at: string;
}

interface LeaderboardDbRow {
  user_id: string;
  display_name: string;
  week_xp: number;
  all_time_xp: number;
}

function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    displayName: row.display_name,
    githubUsername: row.github_username,
    role: row.role,
    dailyGoalXp: row.daily_goal_xp,
  };
}

function toProgress(row: ProgressRow): ProgressEntry {
  return {
    userId: row.user_id,
    itemId: row.item_id,
    blockId: row.block_id,
    completedAt: row.completed_at,
  };
}

function toXpEvent(row: XpEventRow): XpEvent {
  return {
    userId: row.user_id,
    itemId: row.item_id,
    reason: row.reason,
    amount: row.amount,
    createdAt: row.created_at,
  };
}

function toSubmission(row: ProjectSubmissionRow): ProjectSubmission {
  return {
    userId: row.user_id,
    projectId: row.project_id,
    repoUrl: row.repo_url,
    runUrl: row.run_url,
    jobs: row.jobs,
    passed: row.passed,
    checkedAt: row.checked_at,
  };
}

// --- helpers ---

/** The database error code for a unique constraint violation. */
const UNIQUE_VIOLATION = '23505';

/** PostgREST returns at most 1000 rows per request, so lists are read a page at a time. */
const PAGE_SIZE = 1000;

interface QueryResult<T> {
  data: T | null;
  error: { message: string } | null;
}

function unwrap<T>(result: QueryResult<T>): T | null {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

async function fetchAll<T>(
  page: (from: number, to: number) => PromiseLike<QueryResult<T[]>>,
): Promise<T[]> {
  const all: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const rows = unwrap(await page(from, from + PAGE_SIZE - 1)) ?? [];
    all.push(...rows);
    if (rows.length < PAGE_SIZE) return all;
  }
}

function signInMessage(error: AuthError): string {
  if (error.code === 'invalid_credentials') {
    return "That email and password don't match. Check both and try again.";
  }
  if (isAuthRetryableFetchError(error) || error.status === 0) {
    return "We couldn't reach the server. Check your internet connection and try again.";
  }
  if (error.status === 429 || error.code === 'over_request_rate_limit') {
    return 'Too many tries. Wait a minute, then try again.';
  }
  if (error.code === 'email_not_confirmed') {
    return "This account isn't ready yet. Open the invite email from Judah first, then set your password.";
  }
  return "Sign in didn't work. Try again, and tell Judah if it keeps happening.";
}

function setPasswordMessage(error: AuthError): string {
  if (error.code === 'weak_password') {
    return 'That password is too easy to guess. Use at least 8 characters, and mix letters and numbers.';
  }
  if (error.code === 'same_password') {
    return 'Choose a password that is different from your current one.';
  }
  if (error.code === 'session_not_found' || error.name === 'AuthSessionMissingError') {
    return 'Your link has expired. Ask Judah to send you a new invite, or sign in with your password.';
  }
  if (isAuthRetryableFetchError(error) || error.status === 0) {
    return "We couldn't reach the server. Check your internet connection and try again.";
  }
  return "Your password wasn't saved. Try again, and tell Judah if it keeps happening.";
}

export class SupabaseStore implements ProgressStore {
  private readonly client: SupabaseClient;
  private currentUser: Profile | null = null;
  private readonly listeners = new Set<(user: Profile | null) => void>();
  /** Profile loads in flight, so an auth event and a sign-in do not fetch the same row twice. */
  private readonly loading = new Map<string, Promise<Profile | null>>();

  /**
   * `client` is only for tests. By default the client keeps the session in localStorage,
   * refreshes it before it expires, and reads an invite or recovery session out of the URL.
   */
  constructor(url: string, anonKey: string, client?: SupabaseClient) {
    this.client =
      client ??
      createClient(url, anonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      });
    // One subscription for the whole app. supabase-js holds a lock while it runs this callback,
    // so awaiting another Supabase call inside it can deadlock: the work is deferred a tick. It
    // re-reads the session then, instead of trusting the one the event carried, because an
    // earlier event can arrive after a later one has already been applied.
    this.client.auth.onAuthStateChange(() => {
      setTimeout(() => {
        this.resync().catch((e: unknown) => {
          console.error('Could not load your profile after a sign-in change.', e);
        });
      }, 0);
    });
  }

  // --- auth ---

  async init(): Promise<void> {
    await this.resync();
  }

  getCurrentUser(): Profile | null {
    return this.currentUser;
  }

  async signIn(email: string, password: string): Promise<Profile> {
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) throw new Error(signInMessage(error));
    const profile = await this.loadProfile(data.user.id);
    if (!profile) {
      await this.client.auth.signOut({ scope: 'local' });
      throw new Error(
        "You're signed in, but your profile is missing. Tell Judah, and he will fix it.",
      );
    }
    this.setUser(profile);
    return profile;
  }

  async signOut(): Promise<void> {
    const { error } = await this.client.auth.signOut();
    // Even if the server could not be told, drop the session on this device.
    if (error) await this.client.auth.signOut({ scope: 'local' });
    this.setUser(null);
  }

  async setPassword(newPassword: string): Promise<void> {
    const { error } = await this.client.auth.updateUser({ password: newPassword });
    if (error) throw new Error(setPasswordMessage(error));
  }

  onAuthChange(listener: (user: Profile | null) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Brings the cached profile in line with the session supabase-js holds right now.
   * getSession() waits for supabase-js to finish reading any session out of the URL first.
   */
  private async resync(): Promise<void> {
    const { data } = await this.client.auth.getSession();
    await this.syncSession(data.session);
  }

  private async syncSession(session: Session | null): Promise<void> {
    if (!session) {
      this.setUser(null);
      return;
    }
    // Token refreshes and password changes keep the same user, whose profile is already cached.
    if (this.currentUser?.id === session.user.id) return;
    const profile = await this.loadProfile(session.user.id);
    if (!profile) {
      // A session for an account whose profile is gone (deleted user, wrong project).
      await this.client.auth.signOut({ scope: 'local' });
      this.setUser(null);
      return;
    }
    this.setUser(profile);
  }

  private loadProfile(userId: string): Promise<Profile | null> {
    const inFlight = this.loading.get(userId);
    if (inFlight) return inFlight;
    const request = this.getProfile(userId).finally(() => {
      this.loading.delete(userId);
    });
    this.loading.set(userId, request);
    return request;
  }

  private setUser(next: Profile | null): void {
    const changed = JSON.stringify(next) !== JSON.stringify(this.currentUser);
    this.currentUser = next;
    if (!changed) return;
    for (const listener of this.listeners) listener(next);
  }

  private requireUser(): Profile {
    if (!this.currentUser) throw new Error('No signed-in user');
    return this.currentUser;
  }

  // --- profile ---

  async getProfile(userId: string): Promise<Profile | null> {
    const row = unwrap(
      await this.client.from('profiles').select('*').eq('id', userId).maybeSingle(),
    ) as ProfileRow | null;
    return row ? toProfile(row) : null;
  }

  async updateProfile(userId: string, update: ProfileUpdate): Promise<Profile> {
    const changes: Record<string, unknown> = {};
    if (update.displayName !== undefined) changes.display_name = update.displayName.trim();
    if (update.githubUsername !== undefined) changes.github_username = update.githubUsername;
    if (update.dailyGoalXp !== undefined) changes.daily_goal_xp = update.dailyGoalXp;
    // The database refuses role changes from members; sending one is a mistake worth surfacing.
    if (update.role !== undefined) changes.role = update.role;

    let profile: Profile | null;
    if (Object.keys(changes).length === 0) {
      profile = await this.getProfile(userId);
    } else {
      const row = unwrap(
        await this.client
          .from('profiles')
          .update(changes)
          .eq('id', userId)
          .select('*')
          .maybeSingle(),
      ) as ProfileRow | null;
      profile = row ? toProfile(row) : null;
    }
    if (!profile) throw new Error('That profile was not found, or it is not yours to change.');
    if (this.currentUser?.id === userId) this.setUser(profile);
    return profile;
  }

  // --- progress ---

  async markComplete(itemId: string, blockId: string): Promise<void> {
    const user = this.requireUser();
    // Completing twice is fine: the second insert is skipped, the first completion time stays.
    unwrap(
      await this.client
        .from('progress')
        .upsert(
          { user_id: user.id, item_id: itemId, block_id: blockId },
          { onConflict: 'user_id,item_id', ignoreDuplicates: true },
        ),
    );
  }

  async listCompleted(userId: string): Promise<ProgressEntry[]> {
    const rows = await fetchAll<ProgressRow>((from, to) =>
      this.client
        .from('progress')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at')
        .order('item_id')
        .range(from, to),
    );
    return rows.map(toProgress);
  }

  // --- xp ---

  async awardXp(itemId: string, reason: XpReason, amount: number): Promise<boolean> {
    const user = this.requireUser();
    const { error } = await this.client
      .from('xp_events')
      .insert({ user_id: user.id, item_id: itemId, reason, amount });
    if (!error) return true;
    // The unique (user, item, reason) constraint says this was already awarded.
    if (error.code === UNIQUE_VIOLATION) return false;
    throw new Error(error.message);
  }

  async listXpEvents(userId: string): Promise<XpEvent[]> {
    const rows = await fetchAll<XpEventRow>((from, to) =>
      this.client
        .from('xp_events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at')
        .order('id')
        .range(from, to),
    );
    return rows.map(toXpEvent);
  }

  // --- attempts ---

  async recordAttempt(itemId: string, passed: boolean, failedTestIndex?: number): Promise<void> {
    const user = this.requireUser();
    unwrap(
      await this.client.from('attempts').insert({
        user_id: user.id,
        item_id: itemId,
        passed,
        failed_test_index: failedTestIndex ?? null,
      }),
    );
  }

  // --- code saves ---

  async saveCode(itemId: string, files: CodeFiles): Promise<void> {
    const user = this.requireUser();
    unwrap(
      await this.client.from('code_saves').upsert(
        // updated_at is not sent: the database sets it, and a member cannot.
        { user_id: user.id, item_id: itemId, files },
        { onConflict: 'user_id,item_id' },
      ),
    );
  }

  async loadCode(itemId: string): Promise<CodeFiles | null> {
    const user = this.requireUser();
    const row = unwrap(
      await this.client
        .from('code_saves')
        .select('files')
        .eq('user_id', user.id)
        .eq('item_id', itemId)
        .maybeSingle(),
    ) as { files: CodeFiles } | null;
    return row?.files ?? null;
  }

  // --- quiz ---

  async recordQuizAttempt(
    quizId: string,
    score: number,
    total: number,
    passed: boolean,
    wrongIds: string[],
  ): Promise<void> {
    const user = this.requireUser();
    unwrap(
      await this.client.from('quiz_attempts').insert({
        user_id: user.id,
        quiz_id: quizId,
        score,
        total,
        passed,
        wrong_ids: wrongIds,
      }),
    );
  }

  // --- lesson feedback ---

  async recordLessonFeedback(
    blockId: string,
    rating: LessonFeedbackRating,
    comment?: string,
  ): Promise<void> {
    const user = this.requireUser();
    const text = comment?.trim();
    unwrap(
      await this.client.from('lesson_feedback').insert({
        user_id: user.id,
        block_id: blockId,
        rating,
        comment: text ? text : null,
      }),
    );
  }

  // --- project submissions ---

  async getProjectSubmission(projectId: string): Promise<ProjectSubmission | null> {
    const user = this.requireUser();
    const row = unwrap(
      await this.client
        .from('project_submissions')
        .select('*')
        .eq('user_id', user.id)
        .eq('project_id', projectId)
        .maybeSingle(),
    ) as ProjectSubmissionRow | null;
    return row ? toSubmission(row) : null;
  }

  async saveProjectSubmission(
    projectId: string,
    repoUrl: string,
    extra?: Partial<Pick<ProjectSubmission, 'runUrl' | 'jobs' | 'passed'>>,
  ): Promise<ProjectSubmission> {
    const user = this.requireUser();
    const row = unwrap(
      await this.client
        .from('project_submissions')
        .upsert(
          {
            user_id: user.id,
            project_id: projectId,
            repo_url: repoUrl,
            run_url: extra?.runUrl ?? null,
            jobs: extra?.jobs ?? null,
            passed: extra?.passed ?? false,
            // checked_at is not sent: the database sets it, and a member cannot.
          },
          { onConflict: 'user_id,project_id' },
        )
        .select('*')
        .single(),
    ) as ProjectSubmissionRow | null;
    if (!row) throw new Error('The project check was not saved.');
    return toSubmission(row);
  }

  // --- leaderboard ---

  async getLeaderboard(): Promise<LeaderboardRow[]> {
    const rows = unwrap(
      await this.client
        .from('leaderboard')
        .select('user_id, display_name, week_xp, all_time_xp')
        .order('week_xp', { ascending: false })
        .order('all_time_xp', { ascending: false })
        .order('display_name'),
    ) as LeaderboardDbRow[] | null;
    return (rows ?? []).map((r) => ({
      userId: r.user_id,
      displayName: r.display_name,
      weekXp: r.week_xp,
      allTimeXp: r.all_time_xp,
    }));
  }
}
