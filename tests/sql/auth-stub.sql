-- Test only. Never run this on Supabase, which already has all of it.
-- A minimal stand-in for the parts of Supabase the migration touches, so supabase/migrations
-- can run in PGlite: the anon and authenticated roles, auth.users and auth.uid().

create role anon nologin;
create role authenticated nologin;

create schema auth;

create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  created_at timestamptz not null default now()
);

-- Supabase reads the signed-in user's id from the request's JWT claims. Tests set it with
-- set_config('request.jwt.claim.sub', '<uuid>', false) after SET ROLE authenticated.
create function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

-- Like Supabase: both roles can call auth.uid(), neither can read auth.users.
grant usage on schema auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;

-- Supabase grants every new table and function in public to anon and authenticated by default.
-- Mirrored here, so the migration's revokes (and not just an empty grant list) are what keep
-- anon out and members read-only where they should be.
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant execute on functions to anon, authenticated;
