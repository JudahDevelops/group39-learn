import { PGlite } from '@electric-sql/pglite';
import { vi } from 'vitest';
import stubSql from '../sql/auth-stub.sql?raw';
import migrationSql from '../../supabase/migrations/0001_init.sql?raw';

/** Fixed ids so assertions can name who owns what. */
export const ADA = '00000000-0000-4000-8000-000000000001';
export const BAYO = '00000000-0000-4000-8000-000000000002';
export const JUDAH = '00000000-0000-4000-8000-000000000003';

/**
 * The unit tests run in jsdom, whose Blob and File have no arrayBuffer(); PGlite needs it to
 * unpack its bundle. Swap in Node's own Blob. PGlite builds a File when one exists and a Blob
 * otherwise, so File is hidden. (The module name is a variable so the app's TypeScript config,
 * which does not load Node's types, does not need them.)
 */
async function swapInNodeBlob(): Promise<void> {
  const nodeBuffer = 'node:buffer';
  const { Blob: NodeBlob } = await import(/* @vite-ignore */ nodeBuffer);
  vi.stubGlobal('Blob', NodeBlob);
  vi.stubGlobal('File', undefined);
}

/** A fresh in-memory Postgres with the Supabase stand-in and the real migration applied. */
export async function freshDb(): Promise<PGlite> {
  await swapInNodeBlob();
  const db = new PGlite();
  await db.exec(stubSql);
  await db.exec(migrationSql);
  return db;
}

/**
 * Creates three auth users (the trigger gives each a profile), names them, and makes Judah an
 * admin the way the setup doc does: as the SQL editor's role, not through the API.
 */
export async function seedUsers(db: PGlite): Promise<void> {
  await db.exec(`
    insert into auth.users (id, email) values
      ('${ADA}', 'ada@example.com'),
      ('${BAYO}', 'bayo@example.com'),
      ('${JUDAH}', 'judah@example.com');
    update public.profiles set display_name = 'Ada' where id = '${ADA}';
    update public.profiles set display_name = 'Bayo' where id = '${BAYO}';
    update public.profiles set display_name = 'Judah', role = 'admin' where id = '${JUDAH}';
  `);
}

/** Runs `fn` the way PostgREST would for a signed-in user: role authenticated, JWT sub set. */
export async function asUser<T>(db: PGlite, userId: string, fn: () => Promise<T>): Promise<T> {
  await db.exec(
    `select set_config('request.jwt.claim.sub', '${userId}', false); set role authenticated;`,
  );
  try {
    return await fn();
  } finally {
    await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`);
  }
}

/** Runs `fn` as the anon role, which has no access to anything here. */
export async function asAnon<T>(db: PGlite, fn: () => Promise<T>): Promise<T> {
  await db.exec('set role anon');
  try {
    return await fn();
  } finally {
    await db.exec('reset role');
  }
}

/** The Postgres error code of a rejected query (e.g. '23505', '42501'), or null if it passed. */
export async function errorCode(run: () => Promise<unknown>): Promise<string | null> {
  try {
    await run();
    return null;
  } catch (e) {
    return (e as { code?: string }).code ?? 'unknown';
  }
}

/** The message of a rejected query, or null if it passed. */
export async function errorMessage(run: () => Promise<unknown>): Promise<string | null> {
  try {
    await run();
    return null;
  } catch (e) {
    return (e as Error).message;
  }
}
