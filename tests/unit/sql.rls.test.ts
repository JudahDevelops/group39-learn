import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  ADA,
  BAYO,
  JUDAH,
  asAnon,
  asUser,
  errorCode,
  errorMessage,
  freshDb,
  seedUsers,
} from './sql.helpers';

let db: PGlite;

/** Each table, and the column that holds the owner's id. */
const TABLES = [
  { name: 'profiles', owner: 'id' },
  { name: 'progress', owner: 'user_id' },
  { name: 'xp_events', owner: 'user_id' },
  { name: 'attempts', owner: 'user_id' },
  { name: 'code_saves', owner: 'user_id' },
  { name: 'quiz_attempts', owner: 'user_id' },
  { name: 'lesson_feedback', owner: 'user_id' },
  { name: 'project_submissions', owner: 'user_id' },
] as const;

beforeAll(async () => {
  db = await freshDb();
  await seedUsers(db);
  // One row per member in every table except profiles (the trigger made those). Judah has none
  // of his own, so "admin sees all" is about other people's rows.
  for (const uid of [ADA, BAYO]) {
    await db.exec(`
      insert into public.progress (user_id, item_id, block_id) values ('${uid}', 'step-1', 'b1-profile');
      insert into public.xp_events (user_id, item_id, reason, amount) values ('${uid}', 'step-1', 'workshop_step', 5);
      insert into public.attempts (user_id, item_id, passed, failed_test_index) values ('${uid}', 'step-1', false, 2);
      insert into public.code_saves (user_id, item_id, files) values ('${uid}', 'step-1', '{"index.html":"<p>hi</p>"}');
      insert into public.quiz_attempts (user_id, quiz_id, score, total, passed, wrong_ids)
        values ('${uid}', 'b1-quiz', 10, 15, false, '{q1,q2}');
      insert into public.lesson_feedback (user_id, block_id, rating, comment) values ('${uid}', 'b1-lesson', 'just_right', null);
      insert into public.project_submissions (user_id, project_id, repo_url) values ('${uid}', 'p1', 'https://github.com/x/y');
    `);
  }
}, 60_000);

afterAll(async () => {
  await db.close();
});

describe('new users', () => {
  it('get a profile with an empty display name, role member and a 60 XP goal', async () => {
    const newcomer = '00000000-0000-4000-8000-0000000000aa';
    await db.exec(`insert into auth.users (id, email) values ('${newcomer}', 'new@example.com')`);
    const { rows } = await db.query<{ display_name: string; role: string; daily_goal_xp: number }>(
      `select display_name, role, daily_goal_xp from public.profiles where id = '${newcomer}'`,
    );
    expect(rows).toEqual([{ display_name: '', role: 'member', daily_goal_xp: 60 }]);
    await db.exec(`delete from auth.users where id = '${newcomer}'`);
  });

  it('lose their rows when the auth user is deleted', async () => {
    const gone = '00000000-0000-4000-8000-0000000000bb';
    await db.exec(`
      insert into auth.users (id, email) values ('${gone}', 'gone@example.com');
      insert into public.xp_events (user_id, item_id, reason, amount) values ('${gone}', 'x', 'lesson', 10);
      delete from auth.users where id = '${gone}';
    `);
    const profiles = await db.query(`select 1 from public.profiles where id = '${gone}'`);
    const xp = await db.query(`select 1 from public.xp_events where user_id = '${gone}'`);
    expect(profiles.rows).toHaveLength(0);
    expect(xp.rows).toHaveLength(0);
  });
});

describe('a member sees only their own rows', () => {
  for (const { name, owner } of TABLES) {
    it(`in ${name}`, async () => {
      const rows = await asUser(
        db,
        ADA,
        async () => (await db.query<Record<string, string>>(`select * from public.${name}`)).rows,
      );
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.every((r) => r[owner] === ADA)).toBe(true);
    });
  }

  it('and the other member sees only theirs', async () => {
    const rows = await asUser(
      db,
      BAYO,
      async () =>
        (await db.query<{ user_id: string }>('select user_id from public.xp_events')).rows,
    );
    expect(rows).toEqual([{ user_id: BAYO }]);
  });

  it('and anon cannot call the functions, nor members the trigger functions', async () => {
    for (const call of ['public.is_admin()', `public.streak('${ADA}')`]) {
      expect(await asAnon(db, () => errorCode(() => db.query(`select ${call}`))), call).toBe(
        '42501',
      );
    }
    for (const call of ['public.handle_new_user()', 'public.guard_profile_role()']) {
      expect(await asUser(db, ADA, () => errorCode(() => db.query(`select ${call}`))), call).toBe(
        '42501',
      );
    }
  });

  it('and anon sees nothing at all', async () => {
    for (const { name } of TABLES) {
      expect(
        await asAnon(db, () => errorCode(() => db.query(`select * from public.${name}`))),
      ).toBe('42501');
    }
  });
});

describe('an admin sees every row', () => {
  for (const { name, owner } of TABLES) {
    it(`in ${name}`, async () => {
      const rows = await asUser(
        db,
        JUDAH,
        async () => (await db.query<Record<string, string>>(`select * from public.${name}`)).rows,
      );
      const owners = new Set(rows.map((r) => r[owner]));
      expect(owners.has(ADA)).toBe(true);
      expect(owners.has(BAYO)).toBe(true);
    });
  }

  it('but writes only their own rows', async () => {
    const updated = await asUser(
      db,
      JUDAH,
      async () =>
        (
          await db.query(
            `update public.profiles set display_name = 'Hacked' where id = '${ADA}' returning id`,
          )
        ).rows,
    );
    expect(updated).toHaveLength(0);
    const code = await asUser(db, JUDAH, () =>
      errorCode(() =>
        db.query(
          `insert into public.xp_events (user_id, item_id, reason, amount) values ('${ADA}', 'z', 'lesson', 10)`,
        ),
      ),
    );
    expect(code).toBe('42501');
  });
});

describe('a member writes only their own rows', () => {
  it('cannot insert a row for someone else', async () => {
    const code = await asUser(db, ADA, () =>
      errorCode(() =>
        db.query(
          `insert into public.progress (user_id, item_id, block_id) values ('${BAYO}', 'step-9', 'b1')`,
        ),
      ),
    );
    expect(code).toBe('42501');
  });

  it('can insert their own', async () => {
    const code = await asUser(db, ADA, () =>
      errorCode(() =>
        db.query(
          `insert into public.progress (user_id, item_id, block_id) values ('${ADA}', 'step-2', 'b1-profile')`,
        ),
      ),
    );
    expect(code).toBeNull();
  });

  it("cannot update or delete someone else's rows (RLS hides them, so nothing changes)", async () => {
    const changed = await asUser(db, ADA, async () => {
      const a = await db.query(
        `update public.code_saves set files = '{}' where user_id = '${BAYO}' returning user_id`,
      );
      const b = await db.query(
        `update public.profiles set display_name = 'Mine now' where id = '${BAYO}' returning id`,
      );
      return a.rows.length + b.rows.length;
    });
    expect(changed).toBe(0);
    const { rows } = await db.query<{ display_name: string }>(
      `select display_name from public.profiles where id = '${BAYO}'`,
    );
    expect(rows[0].display_name).toBe('Bayo');
  });

  it('cannot delete from the append-only tables, even their own rows', async () => {
    for (const t of ['xp_events', 'attempts', 'quiz_attempts', 'lesson_feedback', 'progress']) {
      const code = await asUser(db, ADA, () =>
        errorCode(() => db.query(`delete from public.${t}`)),
      );
      expect(code, t).toBe('42501');
    }
  });

  it('cannot rewrite an XP event', async () => {
    const code = await asUser(db, ADA, () =>
      errorCode(() => db.query(`update public.xp_events set amount = 9999`)),
    );
    expect(code).toBe('42501');
  });

  it('can update their own display name, GitHub username and daily goal', async () => {
    const row = await asUser(
      db,
      ADA,
      async () =>
        (
          await db.query<{ display_name: string; github_username: string; daily_goal_xp: number }>(
            `update public.profiles set display_name = 'Ada O.', github_username = 'ada-o', daily_goal_xp = 100
           where id = '${ADA}' returning display_name, github_username, daily_goal_xp`,
          )
        ).rows[0],
    );
    expect(row).toEqual({ display_name: 'Ada O.', github_username: 'ada-o', daily_goal_xp: 100 });
    await db.exec(
      `update public.profiles set display_name = 'Ada', github_username = null, daily_goal_xp = 60 where id = '${ADA}'`,
    );
  });

  it('cannot save a malformed GitHub username or a blank-padded name', async () => {
    const bad = ['-ada', 'ada-', 'ada o', 'a'.repeat(40), ''];
    for (const g of bad) {
      const code = await asUser(db, ADA, () =>
        errorCode(() =>
          db.query('update public.profiles set github_username = $1 where id = $2', [g, ADA]),
        ),
      );
      expect(code, `github ${JSON.stringify(g)}`).toBe('23514');
    }
    const padded = await asUser(db, ADA, () =>
      errorCode(() =>
        db.query(`update public.profiles set display_name = ' Ada ' where id = '${ADA}'`),
      ),
    );
    expect(padded).toBe('23514');
  });
});

describe('XP is awarded once per item per reason', () => {
  it('rejects the same (item, reason) twice with a unique violation', async () => {
    const insert = () =>
      db.query(
        `insert into public.xp_events (user_id, item_id, reason, amount) values ('${ADA}', 'lesson-6-1', 'lesson', 10)`,
      );
    expect(await asUser(db, ADA, () => errorCode(insert))).toBeNull();
    expect(await asUser(db, ADA, () => errorCode(insert))).toBe('23505');
    const { rows } = await db.query<{ n: number }>(
      `select count(*)::int as n from public.xp_events where user_id = '${ADA}' and item_id = 'lesson-6-1'`,
    );
    expect(rows[0].n).toBe(1);
  });

  it('allows the same item for another reason, and the same pair for another member', async () => {
    const bonus = `insert into public.xp_events (user_id, item_id, reason, amount) values ('${ADA}', 'lesson-6-1', 'lesson_perfect', 5)`;
    expect(await asUser(db, ADA, () => errorCode(() => db.query(bonus)))).toBeNull();
    const bayo = `insert into public.xp_events (user_id, item_id, reason, amount) values ('${BAYO}', 'lesson-6-1', 'lesson', 10)`;
    expect(await asUser(db, BAYO, () => errorCode(() => db.query(bayo)))).toBeNull();
  });

  it('rejects zero and negative amounts', async () => {
    for (const amount of [0, -5]) {
      const code = await asUser(db, ADA, () =>
        errorCode(() =>
          db.query(
            `insert into public.xp_events (user_id, item_id, reason, amount) values ('${ADA}', 'odd', 'lesson', ${amount})`,
          ),
        ),
      );
      expect(code, String(amount)).toBe('23514');
    }
  });
});

describe('role changes', () => {
  it('a member cannot change their own role through the API', async () => {
    const code = await asUser(db, ADA, () =>
      errorCode(() => db.query(`update public.profiles set role = 'admin' where id = '${ADA}'`)),
    );
    expect(code).toBe('42501');
    const { rows } = await db.query<{ role: string }>(
      `select role from public.profiles where id = '${ADA}'`,
    );
    expect(rows[0].role).toBe('member');
  });

  it('the trigger blocks it even if the column grant is widened by mistake', async () => {
    await db.exec('grant update (role) on public.profiles to authenticated');
    try {
      const message = await asUser(db, ADA, () =>
        errorMessage(() =>
          db.query(`update public.profiles set role = 'admin' where id = '${ADA}'`),
        ),
      );
      expect(message).toBe('Only an admin can change a role.');
      const { rows } = await db.query<{ role: string }>(
        `select role from public.profiles where id = '${ADA}'`,
      );
      expect(rows[0].role).toBe('member');

      // An admin passes the trigger, but row-level security still limits them to their own row.
      const others = await asUser(
        db,
        JUDAH,
        async () =>
          (
            await db.query(
              `update public.profiles set role = 'admin' where id = '${BAYO}' returning id`,
            )
          ).rows,
      );
      expect(others).toHaveLength(0);
      const own = await asUser(db, JUDAH, () =>
        errorCode(() =>
          db.query(`update public.profiles set role = 'admin' where id = '${JUDAH}'`),
        ),
      );
      expect(own).toBeNull();
    } finally {
      await db.exec('revoke update (role) on public.profiles from authenticated');
    }
  });

  it('the SQL editor (a trusted role) can still promote someone', async () => {
    await db.exec(`update public.profiles set role = 'admin' where id = '${BAYO}'`);
    await db.exec(`update public.profiles set role = 'member' where id = '${BAYO}'`);
    const { rows } = await db.query<{ role: string }>(
      `select role from public.profiles where id = '${BAYO}'`,
    );
    expect(rows[0].role).toBe('member');
  });

  it('rejects a role outside member or admin', async () => {
    expect(
      await errorCode(() =>
        db.query(`update public.profiles set role = 'owner' where id = '${ADA}'`),
      ),
    ).toBe('23514');
  });
});
