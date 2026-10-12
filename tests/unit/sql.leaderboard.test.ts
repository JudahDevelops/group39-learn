import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { XP_BY_REASON, XP_REASONS, weeklyXp, type XpReason } from '../../src/lib/xp';
import type { XpEvent } from '../../src/store/types';
import { ADA, BAYO, JUDAH, asAnon, asUser, errorCode, freshDb, seedUsers } from './sql.helpers';

let db: PGlite;
const DAY = 86_400_000;
const NEWBIE = '00000000-0000-4000-8000-0000000000cc';

/** 00:00 on the Monday of the current Africa/Lagos week (Lagos is UTC+1, no daylight saving). */
function lagosMonday(now: Date): Date {
  const lagos = new Date(now.getTime() + 3_600_000);
  const sinceMonday = (lagos.getUTCDay() + 6) % 7;
  const midnight = Date.UTC(lagos.getUTCFullYear(), lagos.getUTCMonth(), lagos.getUTCDate());
  return new Date(midnight - sinceMonday * DAY - 3_600_000);
}

let n = 0;
/** The XP reason that pays exactly `amount` (the database ties each reason to one amount). */
function reasonFor(amount: number): XpReason {
  const reason = XP_REASONS.find((r) => XP_BY_REASON[r] === amount);
  if (!reason) throw new Error(`No XP reason pays ${amount}`);
  return reason;
}

async function award(userId: string, at: Date, amount: number): Promise<XpEvent> {
  n += 1;
  await db.query(
    'insert into public.xp_events (user_id, item_id, reason, amount, created_at) values ($1, $2, $3, $4, $5)',
    [userId, `item-${n}`, reasonFor(amount), amount, at.toISOString()],
  );
  return { userId, itemId: `item-${n}`, reason: reasonFor(amount), amount, createdAt: at.toISOString() };
}

const ada: XpEvent[] = [];

beforeAll(async () => {
  db = await freshDb();
  await seedUsers(db);
  // A member who has not finished onboarding: empty display name, with XP of their own.
  await db.exec(
    `insert into auth.users (id, email) values ('${NEWBIE}', 'secret-newbie@example.com')`,
  );

  const monday = lagosMonday(new Date());
  // Ada: one event a minute before the week began (Sunday 23:59 Lagos), one exactly at Monday
  // 00:00 Lagos, one mid-week, one old.
  ada.push(await award(ADA, new Date(monday.getTime() - 60_000), 100));
  ada.push(await award(ADA, monday, 10));
  ada.push(await award(ADA, new Date(monday.getTime() + 3 * DAY + 5 * 3_600_000), 5));
  ada.push(await award(ADA, new Date(monday.getTime() - 40 * DAY), 30));
  await award(BAYO, new Date(monday.getTime() + 2 * DAY), 40);
  await award(NEWBIE, monday, 80);
}, 60_000);

afterAll(async () => {
  await db.close();
});

type Row = { display_name: string; user_id: string; week_xp: number; all_time_xp: number };
const board = (as: string) =>
  asUser(db, as, async () => (await db.query<Row>('select * from public.leaderboard')).rows);

describe('leaderboard', () => {
  it('returns names and totals only, nothing else', async () => {
    const rows = await board(BAYO);
    for (const row of rows) {
      expect(Object.keys(row).sort()).toEqual([
        'all_time_xp',
        'display_name',
        'user_id',
        'week_xp',
      ]);
    }
    const { fields } = await asUser(db, BAYO, () => db.query('select * from public.leaderboard'));
    expect(fields.map((f) => f.name)).toEqual([
      'display_name',
      'user_id',
      'week_xp',
      'all_time_xp',
    ]);
    expect(JSON.stringify(rows)).not.toMatch(/example\.com|github|role|daily_goal/);
  });

  it('shows every named member to any signed-in member, including totals they cannot select directly', async () => {
    const rows = await board(BAYO);
    const byName = Object.fromEntries(rows.map((r) => [r.display_name, r]));
    expect(Object.keys(byName).sort()).toEqual(['Ada', 'Bayo', 'Judah']);
    expect(byName.Ada.all_time_xp).toBe(145);
    expect(byName.Bayo.all_time_xp).toBe(40);
    expect(byName.Judah).toMatchObject({ week_xp: 0, all_time_xp: 0 });

    const direct = await asUser(
      db,
      BAYO,
      async () => (await db.query('select * from public.xp_events')).rows,
    );
    expect(direct.every((r) => (r as { user_id: string }).user_id === BAYO)).toBe(true);
  });

  it('counts the week Monday to Sunday in Lagos time', async () => {
    const rows = await board(ADA);
    const mine = rows.find((r) => r.user_id === ADA);
    // Sunday 23:59 Lagos (last week) is out; Monday 00:00 Lagos and mid-week are in.
    expect(mine?.week_xp).toBe(15);
    expect(mine?.week_xp).toBe(weeklyXp(ada, new Date()));
  });

  it('leaves out members who have not set a display name', async () => {
    const rows = await board(ADA);
    expect(rows.some((r) => r.user_id === NEWBIE)).toBe(false);
  });

  it('is the same for an admin and a member', async () => {
    expect(await board(JUDAH)).toEqual(await board(ADA));
  });

  it('is closed to anon', async () => {
    expect(
      await asAnon(db, () => errorCode(() => db.query('select * from public.leaderboard'))),
    ).toBe('42501');
  });

  it('cannot be written to', async () => {
    // A grouped view is not updatable, and members hold no write grant on it either.
    expect(
      await asUser(db, ADA, () =>
        errorCode(() => db.query(`update public.leaderboard set week_xp = 999`)),
      ),
    ).not.toBeNull();
    expect(
      await asUser(db, ADA, () => errorCode(() => db.query(`delete from public.leaderboard`))),
    ).not.toBeNull();
  });
});
