import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { XP_BY_REASON, XP_REASONS } from '../../src/lib/xp';
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
      insert into public.xp_events (user_id, item_id, reason, amount) values ('${uid}', 'step-1', 'step', 5);
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

describe('XP cannot be faked', () => {
  const award = (uid: string, item: string, reason: string, amount: number) =>
    db.query(
      `insert into public.xp_events (user_id, item_id, reason, amount) values ('${uid}', '${item}', '${reason}', ${amount})`,
    );

  it('rejects an amount above 100, and accepts 100', async () => {
    expect(await asUser(db, ADA, () => errorCode(() => award(ADA, 'big-1', 'lesson', 500)))).toBe(
      '23514',
    );
    expect(await asUser(db, ADA, () => errorCode(() => award(ADA, 'big-2', 'lesson', 101)))).toBe(
      '23514',
    );
    expect(
      await asUser(db, ADA, () => errorCode(() => award(ADA, 'big-3', 'exam', 100))),
    ).toBeNull();
    const { rows } = await db.query<{ n: number }>(
      `select count(*)::int as n from public.xp_events where item_id in ('big-1', 'big-2')`,
    );
    expect(rows[0].n).toBe(0);
  });

  it('rejects an amount that does not match its reason', async () => {
    expect(await asUser(db, ADA, () => errorCode(() => award(ADA, 'fixed-1', 'lesson', 100)))).toBe(
      '23514',
    );
    expect(await asUser(db, ADA, () => errorCode(() => award(ADA, 'fixed-2', 'step', 40)))).toBe(
      '23514',
    );
    expect(
      await asUser(db, ADA, () => errorCode(() => award(ADA, 'fixed-3', 'lab', 40))),
    ).toBeNull();
  });

  it('rejects a reason that is not on the list', async () => {
    for (const reason of ['step_bonus', 'workshop_step', 'LESSON', 'cheat', '']) {
      const code = await asUser(db, ADA, () =>
        errorCode(() => award(ADA, 'odd-reason', reason, 5)),
      );
      expect(code, JSON.stringify(reason)).toBe('23514');
    }
  });

  it('accepts exactly the reasons in XP_REASONS (src/lib/xp.ts)', async () => {
    const def = (
      await db.query<{ def: string }>(
        `select pg_get_constraintdef(oid) as def from pg_constraint
         where conrelid = 'public.xp_events'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%reason%'`,
      )
    ).rows[0].def;
    const inDatabase = [...def.matchAll(/'([a-z_]+)'::text/g)].map((m) => m[1]).sort();
    expect(inDatabase).toEqual([...XP_REASONS].sort());

    for (const reason of XP_REASONS) {
      const code = await asUser(db, BAYO, () =>
        errorCode(() => award(BAYO, 'every-reason', reason, XP_BY_REASON[reason])),
      );
      expect(code, reason).toBeNull();
    }
  });
});

describe('timestamps are set by the server, not the member', () => {
  /** One insert per table that names its timestamp column, as a member might send it. */
  const WITH_TIMESTAMP = [
    [
      'progress',
      `insert into public.progress (user_id, item_id, block_id, completed_at) values ('${ADA}', 'ts-1', 'b', '2020-01-01')`,
    ],
    [
      'xp_events',
      `insert into public.xp_events (user_id, item_id, reason, amount, created_at) values ('${ADA}', 'ts-1', 'step', 5, '2020-01-01')`,
    ],
    [
      'attempts',
      `insert into public.attempts (user_id, item_id, passed, created_at) values ('${ADA}', 'ts-1', true, '2020-01-01')`,
    ],
    [
      'quiz_attempts',
      `insert into public.quiz_attempts (user_id, quiz_id, score, total, passed, created_at) values ('${ADA}', 'q', 1, 2, false, '2020-01-01')`,
    ],
    [
      'lesson_feedback',
      `insert into public.lesson_feedback (user_id, block_id, rating, created_at) values ('${ADA}', 'b', 'just_right', '2020-01-01')`,
    ],
    [
      'code_saves',
      `insert into public.code_saves (user_id, item_id, files, updated_at) values ('${ADA}', 'ts-1', '{}', '2020-01-01')`,
    ],
    [
      'project_submissions',
      `insert into public.project_submissions (user_id, project_id, repo_url, checked_at) values ('${ADA}', 'ts-1', 'https://github.com/x/y', '2020-01-01')`,
    ],
  ] as const;

  /** The same inserts with the timestamp left out, and the column that should come back as now(). */
  const WITHOUT_TIMESTAMP = [
    [
      'progress',
      'completed_at',
      `insert into public.progress (user_id, item_id, block_id) values ('${ADA}', 'ts-2', 'b')`,
    ],
    [
      'xp_events',
      'created_at',
      `insert into public.xp_events (user_id, item_id, reason, amount) values ('${ADA}', 'ts-2', 'step', 5)`,
    ],
    [
      'attempts',
      'created_at',
      `insert into public.attempts (user_id, item_id, passed) values ('${ADA}', 'ts-2', true)`,
    ],
    [
      'quiz_attempts',
      'created_at',
      `insert into public.quiz_attempts (user_id, quiz_id, score, total, passed) values ('${ADA}', 'ts-2', 1, 2, false)`,
    ],
    [
      'lesson_feedback',
      'created_at',
      `insert into public.lesson_feedback (user_id, block_id, rating) values ('${ADA}', 'ts-2', 'confusing')`,
    ],
    [
      'code_saves',
      'updated_at',
      `insert into public.code_saves (user_id, item_id, files) values ('${ADA}', 'ts-2', '{}')`,
    ],
    [
      'project_submissions',
      'checked_at',
      `insert into public.project_submissions (user_id, project_id, repo_url) values ('${ADA}', 'ts-2', 'https://github.com/x/y')`,
    ],
  ] as const;

  for (const [table, sql] of WITH_TIMESTAMP) {
    it(`${table}: a member cannot insert a timestamp of their choosing`, async () => {
      expect(await asUser(db, ADA, () => errorCode(() => db.query(sql)))).toBe('42501');
    });
  }

  for (const [table, column, sql] of WITHOUT_TIMESTAMP) {
    it(`${table}: leaving it out lets the server set ${column} to now()`, async () => {
      expect(await asUser(db, ADA, () => errorCode(() => db.query(sql)))).toBeNull();
      const { rows } = await db.query<{ fresh: boolean }>(
        `select (${column} > now() - interval '1 minute' and ${column} <= now()) as fresh
         from public.${table} where user_id = '${ADA}' order by ${column} desc limit 1`,
      );
      expect(rows[0].fresh).toBe(true);
    });
  }

  it('xp_events: a member cannot send an id either', async () => {
    const code = await asUser(db, ADA, () =>
      errorCode(() =>
        db.query(
          `insert into public.xp_events (id, user_id, item_id, reason, amount) values (gen_random_uuid(), '${ADA}', 'ts-3', 'step', 5)`,
        ),
      ),
    );
    expect(code).toBe('42501');
  });

  // The exact shape PostgREST sends for supabase-js upsert(): it rewrites every column it was given,
  // the key columns included, and never mentions a timestamp.
  it('upserts as the app sends them work on code_saves and project_submissions', async () => {
    const saved = await asUser(
      db,
      ADA,
      async () =>
        (
          await db.query<{ files: Record<string, string> }>(
            `insert into public.code_saves (user_id, item_id, files) values ('${ADA}', 'step-1', '{"index.html":"new"}')
           on conflict (user_id, item_id) do update
             set user_id = excluded.user_id, item_id = excluded.item_id, files = excluded.files
           returning files`,
          )
        ).rows[0],
    );
    expect(saved.files).toEqual({ 'index.html': 'new' });

    const checked = await asUser(
      db,
      ADA,
      async () =>
        (
          await db.query<{ passed: boolean }>(
            `insert into public.project_submissions (user_id, project_id, repo_url, run_url, jobs, passed)
           values ('${ADA}', 'p1', 'https://github.com/x/y', null, null, true)
           on conflict (user_id, project_id) do update
             set user_id = excluded.user_id, project_id = excluded.project_id, repo_url = excluded.repo_url,
                 run_url = excluded.run_url, jobs = excluded.jobs, passed = excluded.passed
           returning passed`,
          )
        ).rows[0],
    );
    expect(checked.passed).toBe(true);

    // Skipping duplicates is what markComplete sends.
    const again = await asUser(db, ADA, () =>
      errorCode(() =>
        db.query(
          `insert into public.progress (user_id, item_id, block_id) values ('${ADA}', 'step-1', 'b1-profile')
           on conflict (user_id, item_id) do nothing`,
        ),
      ),
    );
    expect(again).toBeNull();

    // And an upsert cannot take over someone else's row.
    const theirs = await asUser(db, ADA, () =>
      errorCode(() =>
        db.query(
          `insert into public.code_saves (user_id, item_id, files) values ('${BAYO}', 'step-1', '{}')
           on conflict (user_id, item_id) do update
             set user_id = excluded.user_id, item_id = excluded.item_id, files = excluded.files`,
        ),
      ),
    );
    expect(theirs).toBe('42501');
  });

  for (const [table, column, keys] of [
    ['code_saves', 'updated_at', `user_id = '${ADA}' and item_id = 'ts-old'`],
    ['project_submissions', 'checked_at', `user_id = '${ADA}' and project_id = 'ts-old'`],
  ] as const) {
    describe(`${table}.${column} on update`, () => {
      const fresh = async () =>
        (
          await db.query<{ fresh: boolean; future: boolean }>(
            `select (${column} > now() - interval '1 minute') as fresh, (${column} > now() + interval '1 minute') as future
             from public.${table} where ${keys}`,
          )
        ).rows[0];

      beforeAll(async () => {
        // Inserted by the SQL editor's role with an old timestamp: nothing touches it on insert.
        const row =
          table === 'code_saves'
            ? `insert into public.code_saves (user_id, item_id, files, updated_at) values ('${ADA}', 'ts-old', '{}', '2020-01-01')`
            : `insert into public.project_submissions (user_id, project_id, repo_url, checked_at) values ('${ADA}', 'ts-old', 'https://github.com/x/y', '2020-01-01')`;
        await db.exec(row);
      });

      it('a member cannot name it in an update', async () => {
        const code = await asUser(db, ADA, () =>
          errorCode(() =>
            db.query(`update public.${table} set ${column} = '2001-01-01' where ${keys}`),
          ),
        );
        expect(code).toBe('42501');
      });

      it('an update that leaves it out still moves it to now()', async () => {
        const change = table === 'code_saves' ? `files = '{"a":1}'` : `passed = true`;
        await asUser(db, ADA, () => db.query(`update public.${table} set ${change} where ${keys}`));
        expect((await fresh()).fresh).toBe(true);
      });

      it('a value sent on update is overwritten by now(), back-dated or forward-dated', async () => {
        await db.exec(`grant update (${column}) on public.${table} to authenticated`); // widened by mistake
        try {
          for (const sent of ['2001-01-01', '2999-01-01']) {
            await asUser(db, ADA, () =>
              db.query(`update public.${table} set ${column} = '${sent}' where ${keys}`),
            );
            const after = await fresh();
            expect(after.fresh, sent).toBe(true);
            expect(after.future, sent).toBe(false);
          }
        } finally {
          await db.exec(`revoke update (${column}) on public.${table} from authenticated`);
        }
      });
    });
  }
});
