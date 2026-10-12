import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { streakDays } from '../../src/lib/xp';
import type { XpEvent } from '../../src/store/types';
import { ADA, BAYO, JUDAH, asUser, freshDb, seedUsers } from './sql.helpers';

let db: PGlite;
let n = 0;

beforeAll(async () => {
  db = await freshDb();
  await seedUsers(db);
}, 60_000);

afterAll(async () => {
  await db.close();
});

beforeEach(async () => {
  await db.exec('delete from public.xp_events');
});

/** Inserts one XP event per ISO instant for `uid` and returns them as src/lib/xp.ts sees them. */
async function earn(uid: string, ...instants: string[]): Promise<XpEvent[]> {
  const events: XpEvent[] = [];
  for (const at of instants) {
    n += 1;
    await db.query(
      'insert into public.xp_events (user_id, item_id, reason, amount, created_at) values ($1, $2, $3, 5, $4)',
      [uid, `item-${n}`, 'workshop_step', at],
    );
    events.push({
      userId: uid,
      itemId: `item-${n}`,
      reason: 'workshop_step',
      amount: 5,
      createdAt: at,
    });
  }
  return events;
}

async function streak(uid: string, asOf: string): Promise<number> {
  const { rows } = await db.query<{ s: number }>(
    'select public.streak($1::uuid, $2::timestamptz) as s',
    [uid, asOf],
  );
  return rows[0].s;
}

/** SQL result, and the TypeScript function on the same events, which must agree. */
async function both(events: XpEvent[], asOf: string): Promise<[number, number]> {
  return [await streak(ADA, asOf), streakDays(events, new Date(asOf))];
}

// Lagos is UTC+1: 2026-10-07T23:30Z is 00:30 on 8 October in Lagos.
describe('streak(uid) in Africa/Lagos time', () => {
  it('is 0 with no XP', async () => {
    expect(await streak(ADA, '2026-10-08T10:00:00Z')).toBe(0);
  });

  it('counts two Lagos days that share one UTC day (across Lagos midnight)', async () => {
    const events = await earn(ADA, '2026-10-07T22:30:00Z', '2026-10-07T23:30:00Z');
    expect(await both(events, '2026-10-08T10:00:00Z')).toEqual([2, 2]);
  });

  it('puts 23:59:59 and 00:00:00 Lagos on different days', async () => {
    const events = await earn(ADA, '2026-10-07T22:59:59Z', '2026-10-07T23:00:00Z');
    expect(await both(events, '2026-10-08T10:00:00Z')).toEqual([2, 2]);
  });

  it('keeps yesterday alive until today ends', async () => {
    const events = await earn(ADA, '2026-10-06T09:00:00Z', '2026-10-07T09:00:00Z');
    // Morning of the 8th in Lagos, nothing earned yet today: still 2.
    expect(await both(events, '2026-10-08T06:00:00Z')).toEqual([2, 2]);
    // 23:30 Lagos on the 8th, still nothing today: still 2, because today has not ended.
    expect(await both(events, '2026-10-08T22:30:00Z')).toEqual([2, 2]);
    // 00:00 Lagos on the 9th: yesterday is now the 8th, which is empty. Broken.
    expect(await both(events, '2026-10-08T23:00:00Z')).toEqual([0, 0]);
  });

  it('counts a yesterday-only run as 1, and adds today once it has XP', async () => {
    const events = await earn(ADA, '2026-10-07T12:00:00Z');
    expect(await both(events, '2026-10-08T12:00:00Z')).toEqual([1, 1]);
    const more = await earn(ADA, '2026-10-08T12:30:00Z');
    expect(await both([...events, ...more], '2026-10-08T13:00:00Z')).toEqual([2, 2]);
  });

  it('stops at a 2-day gap', async () => {
    // XP on 1, 2, 3 October, nothing on the 4th and 5th, then 6 and 7.
    const events = await earn(
      ADA,
      '2026-10-01T10:00:00Z',
      '2026-10-02T10:00:00Z',
      '2026-10-03T10:00:00Z',
      '2026-10-06T10:00:00Z',
      '2026-10-07T10:00:00Z',
    );
    expect(await both(events, '2026-10-07T20:00:00Z')).toEqual([2, 2]);
    // Looking from the 5th with only the first run behind it: the 4th is empty, so 0.
    expect(await both(events, '2026-10-05T10:00:00Z')).toEqual([0, 0]);
    // Looking from the 3rd: the run of three.
    expect(await both(events, '2026-10-03T20:00:00Z')).toEqual([3, 3]);
  });

  it('is 0 when the last XP was two or more days ago', async () => {
    const events = await earn(ADA, '2026-10-05T10:00:00Z');
    expect(await both(events, '2026-10-07T10:00:00Z')).toEqual([0, 0]);
  });

  it('counts a day with many events once', async () => {
    const events = await earn(
      ADA,
      '2026-10-07T07:00:00Z',
      '2026-10-07T08:00:00Z',
      '2026-10-07T09:00:00Z',
    );
    expect(await both(events, '2026-10-07T20:00:00Z')).toEqual([1, 1]);
  });

  it('ignores other members', async () => {
    await earn(BAYO, '2026-10-07T10:00:00Z', '2026-10-06T10:00:00Z');
    expect(await streak(ADA, '2026-10-07T20:00:00Z')).toBe(0);
    expect(await streak(BAYO, '2026-10-07T20:00:00Z')).toBe(2);
  });

  it('matches src/lib/xp.ts on randomised histories', async () => {
    // A small seeded generator, so the same histories run every time.
    let seed = 20261008;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    const base = Date.parse('2026-09-01T00:00:00Z');
    for (let round = 0; round < 12; round += 1) {
      await db.exec('delete from public.xp_events');
      const instants: string[] = [];
      for (let day = 0; day < 40; day += 1) {
        if (rand() < 0.7) {
          // Up to two events a day, at any hour, so Lagos midnight gets crossed often.
          const count = 1 + Math.floor(rand() * 2);
          for (let k = 0; k < count; k += 1) {
            instants.push(
              new Date(base + day * 86_400_000 + Math.floor(rand() * 86_400_000)).toISOString(),
            );
          }
        }
      }
      const events = await earn(ADA, ...instants);
      for (const offsetHours of [3, 9, 17, 22.5, 23.5]) {
        for (const day of [10, 20, 30, 38, 41]) {
          const asOf = new Date(base + day * 86_400_000 + offsetHours * 3_600_000).toISOString();
          const [fromSql, fromTs] = await both(events, asOf);
          expect(fromSql, `round ${round}, as of ${asOf}`).toBe(fromTs);
        }
      }
    }
  }, 120_000);

  it('is visible to the member and an admin, but a member asking about someone else gets 0', async () => {
    await earn(ADA, '2026-10-07T10:00:00Z', '2026-10-06T10:00:00Z');
    const asOf = '2026-10-07T20:00:00Z';
    const call = (who: string) =>
      asUser(
        db,
        who,
        async () =>
          (
            await db.query<{ s: number }>('select public.streak($1::uuid, $2::timestamptz) as s', [
              ADA,
              asOf,
            ])
          ).rows[0].s,
      );
    expect(await call(ADA)).toBe(2);
    expect(await call(JUDAH)).toBe(2);
    expect(await call(BAYO)).toBe(0);
  });

  it('defaults "now" so the app can call streak(uid) with one argument', async () => {
    const now = new Date().toISOString();
    await earn(ADA, now);
    const { rows } = await db.query<{ s: number }>('select public.streak($1::uuid) as s', [ADA]);
    expect(rows[0].s).toBe(1);
  });
});
