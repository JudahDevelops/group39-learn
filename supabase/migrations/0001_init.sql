-- Group 39 Learn: initial schema.
-- Paste this whole file into the Supabase SQL editor and run it once (docs/supabase-setup.md).
--
-- Access model:
--   * A member reads and writes only their own rows.
--   * An admin (profiles.role = 'admin') reads every row. Admins write only their own rows too.
--   * The leaderboard view is the one place members see anyone else's data: names and XP totals.
--   * Public signups are switched off in the dashboard, so every user was invited by Judah.

-- Profiles -----------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default ''
    check (char_length(display_name) <= 40 and display_name = btrim(display_name)),
  github_username text
    check (github_username ~ '^[A-Za-z0-9]([A-Za-z0-9-]{0,37}[A-Za-z0-9])?$'),
  role text not null default 'member' check (role in ('member', 'admin')),
  daily_goal_xp integer not null default 60 check (daily_goal_xp between 10 and 1000),
  created_at timestamptz not null default now()
);

-- True when the signed-in user is an admin. Security definer so the policies below can call it
-- without looping back through the profiles policies. It reads only the caller's own row.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- Every new auth user gets a profile. The display name stays empty until onboarding.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, role, daily_goal_xp)
  values (new.id, '', 'member', 60)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Users that existed before this migration.
insert into public.profiles (id, display_name, role, daily_goal_xp)
select id, '', 'member', 60 from auth.users
on conflict (id) do nothing;

-- Only an admin may change a role when the change comes through the API (the authenticated and
-- anon roles). The SQL editor and the service key run as other roles and are trusted, which is
-- how Judah makes himself admin. The column grant further down is a second lock on the same door.
create function public.guard_profile_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     and current_user in ('authenticated', 'anon')
     and not public.is_admin() then
    raise exception 'Only an admin can change a role.' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function public.guard_profile_role();

-- Progress -----------------------------------------------------------------

create table public.progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id text not null,
  block_id text not null,
  completed_at timestamptz not null default now(),
  primary key (user_id, item_id)
);
create index progress_block_idx on public.progress (block_id);

-- XP events ----------------------------------------------------------------
-- One row per item per reason. The unique constraint is what stops double awards.

create table public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id text not null,
  -- The reasons match XP_REASONS in src/lib/xp.ts. Nobody can award themselves a made-up reason
  -- or an amount above the biggest single award (an exam pass, 100).
  reason text not null
    check (reason in ('lesson', 'lesson_perfect', 'step', 'lab', 'quiz', 'project', 'exam')),
  amount integer not null,
  -- Each reason pays a fixed amount (src/lib/xp.ts XP), so a member cannot inflate one award.
  check (
    (reason = 'lesson' and amount = 10) or
    (reason = 'lesson_perfect' and amount = 5) or
    (reason = 'step' and amount = 5) or
    (reason = 'lab' and amount = 40) or
    (reason = 'quiz' and amount = 30) or
    (reason = 'project' and amount = 80) or
    (reason = 'exam' and amount = 100)
  ),
  created_at timestamptz not null default now(),
  unique (user_id, item_id, reason)
);
create index xp_events_user_created_idx on public.xp_events (user_id, created_at);

-- Attempts: every check of a workshop step or lab. Feeds the stuck list ------

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id text not null,
  passed boolean not null,
  failed_test_index integer check (failed_test_index >= 0),
  created_at timestamptz not null default now()
);
create index attempts_user_created_idx on public.attempts (user_id, created_at);
create index attempts_failed_item_idx on public.attempts (item_id) where not passed;

-- Code saves: lets a learner resume on another device -----------------------

create table public.code_saves (
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id text not null,
  files jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

-- Quiz attempts ------------------------------------------------------------

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  quiz_id text not null,
  score integer not null,
  total integer not null check (total > 0),
  passed boolean not null,
  wrong_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  check (score between 0 and total)
);
create index quiz_attempts_user_quiz_idx on public.quiz_attempts (user_id, quiz_id, created_at desc);

-- Lesson feedback ----------------------------------------------------------

create table public.lesson_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  block_id text not null,
  rating text not null check (rating in ('too_easy', 'just_right', 'too_hard', 'confusing')),
  comment text,
  created_at timestamptz not null default now()
);
create index lesson_feedback_user_idx on public.lesson_feedback (user_id);
create index lesson_feedback_block_idx on public.lesson_feedback (block_id);

-- Project submissions ------------------------------------------------------

create table public.project_submissions (
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id text not null,
  repo_url text not null,
  run_url text,
  jobs jsonb,
  passed boolean not null default false,
  checked_at timestamptz not null default now(),
  primary key (user_id, project_id)
);

-- Server-set timestamps ----------------------------------------------------
-- Members cannot choose any timestamp. On insert the column default (now()) fills it, because the
-- insert grants below leave the timestamp columns out. On update these triggers overwrite it, so
-- even a widened grant could not back-date or forward-date a save or a project check.

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create function public.set_checked_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.checked_at := now();
  return new;
end;
$$;

create trigger code_saves_set_updated_at
  before update on public.code_saves
  for each row execute function public.set_updated_at();

create trigger project_submissions_set_checked_at
  before update on public.project_submissions
  for each row execute function public.set_checked_at();

-- Row-level security -------------------------------------------------------
-- (select auth.uid()) and (select public.is_admin()) are evaluated once per statement, not per row.

alter table public.profiles enable row level security;
alter table public.progress enable row level security;
alter table public.xp_events enable row level security;
alter table public.attempts enable row level security;
alter table public.code_saves enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.lesson_feedback enable row level security;
alter table public.project_submissions enable row level security;

-- Profiles: read your own (admins read all); update your own. No insert or delete from the API.
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- progress
create policy progress_select on public.progress
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy progress_insert_own on public.progress
  for insert to authenticated
  with check (user_id = (select auth.uid()));

-- xp_events (append only)
create policy xp_events_select on public.xp_events
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy xp_events_insert_own on public.xp_events
  for insert to authenticated
  with check (user_id = (select auth.uid()));

-- attempts (append only)
create policy attempts_select on public.attempts
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy attempts_insert_own on public.attempts
  for insert to authenticated
  with check (user_id = (select auth.uid()));

-- code_saves
create policy code_saves_select on public.code_saves
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy code_saves_insert_own on public.code_saves
  for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy code_saves_update_own on public.code_saves
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- quiz_attempts (append only)
create policy quiz_attempts_select on public.quiz_attempts
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy quiz_attempts_insert_own on public.quiz_attempts
  for insert to authenticated
  with check (user_id = (select auth.uid()));

-- lesson_feedback (append only)
create policy lesson_feedback_select on public.lesson_feedback
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy lesson_feedback_insert_own on public.lesson_feedback
  for insert to authenticated
  with check (user_id = (select auth.uid()));

-- project_submissions
create policy project_submissions_select on public.project_submissions
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy project_submissions_insert_own on public.project_submissions
  for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy project_submissions_update_own on public.project_submissions
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Leaderboard --------------------------------------------------------------
-- Runs with the view owner's rights (the default for views), so it can total every member's XP
-- even though the policies above hide other members' rows. It exposes these four columns and
-- nothing else. Week is Monday to Sunday in Africa/Lagos. Members who have not set a display
-- name yet are left out. Supabase's linter flags this as a "security definer view"; that is the
-- point of it.

create view public.leaderboard as
with bounds as (
  select
    (date_trunc('week', now() at time zone 'Africa/Lagos') at time zone 'Africa/Lagos')
      as week_start,
    ((date_trunc('week', now() at time zone 'Africa/Lagos') + interval '7 days')
      at time zone 'Africa/Lagos') as week_end
)
select
  p.display_name,
  p.id as user_id,
  coalesce(sum(x.amount) filter (
    where x.created_at >= b.week_start and x.created_at < b.week_end
  ), 0)::integer as week_xp,
  coalesce(sum(x.amount), 0)::integer as all_time_xp
from public.profiles p
cross join bounds b
left join public.xp_events x on x.user_id = p.id
where p.display_name <> ''
group by p.id, p.display_name, b.week_start, b.week_end;

-- Streak -------------------------------------------------------------------
-- Same rule as src/lib/xp.ts streakDays(): a day counts when it has at least one XP event, in
-- Africa/Lagos time. The run ends today if today has XP, otherwise yesterday (the streak stays
-- alive until today ends). With neither, it is 0. `as_of` exists so tests can move "now".
-- Not security definer: the caller's row-level security applies, so a member asking about
-- someone else gets 0.

create function public.streak(uid uuid, as_of timestamptz default now())
returns integer
language sql
stable
set search_path = ''
as $$
  with today as (
    select (as_of at time zone 'Africa/Lagos')::date as d
  ),
  days as (
    select distinct (x.created_at at time zone 'Africa/Lagos')::date as d
    from public.xp_events x
    where x.user_id = uid
  ),
  anchor as (
    select case
      when exists (select 1 from days join today using (d)) then today.d
      when exists (select 1 from days, today where days.d = today.d - 1) then today.d - 1
    end as d
    from today
  ),
  ranked as (
    select days.d, row_number() over (order by days.d desc) as rn
    from days, anchor
    where anchor.d is not null and days.d <= anchor.d
  )
  select count(*)::integer
  from ranked, anchor
  where anchor.d - ranked.d = ranked.rn - 1;
$$;

-- Grants -------------------------------------------------------------------
-- Supabase grants new tables to anon and authenticated by default. Take that back, then give
-- the signed-in role only what it needs. Row-level security still filters every row.

revoke all on table
  public.profiles, public.progress, public.xp_events, public.attempts, public.code_saves,
  public.quiz_attempts, public.lesson_feedback, public.project_submissions, public.leaderboard
  from anon, authenticated;

grant usage on schema public to authenticated;

grant select on public.profiles to authenticated;
-- No update on role: promoting someone happens in the SQL editor.
grant update (display_name, github_username, daily_goal_xp) on public.profiles to authenticated;

-- Inserts are granted column by column. The timestamp columns (completed_at, created_at,
-- updated_at, checked_at) and the generated ids are left out on purpose, so the server's default
-- sets them and a member cannot back-date or forward-date a row. A column missing from a grant
-- fails with "permission denied", never a silent default.
grant select on public.progress, public.xp_events, public.attempts, public.code_saves,
  public.quiz_attempts, public.lesson_feedback, public.project_submissions to authenticated;

grant insert (user_id, item_id, block_id) on public.progress to authenticated;
grant insert (user_id, item_id, reason, amount) on public.xp_events to authenticated;
grant insert (user_id, item_id, passed, failed_test_index) on public.attempts to authenticated;
grant insert (user_id, quiz_id, score, total, passed, wrong_ids) on public.quiz_attempts to authenticated;
grant insert (user_id, block_id, rating, comment) on public.lesson_feedback to authenticated;

-- An upsert (insert ... on conflict do update) rewrites every column it sends, the two key
-- columns included, so those need update grants too. Row-level security still pins user_id to
-- the caller. updated_at and checked_at are not granted; the triggers above set them.
grant insert (user_id, item_id, files) on public.code_saves to authenticated;
grant update (user_id, item_id, files) on public.code_saves to authenticated;
grant insert (user_id, project_id, repo_url, run_url, jobs, passed)
  on public.project_submissions to authenticated;
grant update (user_id, project_id, repo_url, run_url, jobs, passed)
  on public.project_submissions to authenticated;
grant select on public.leaderboard to authenticated;

revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.guard_profile_role() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.set_checked_at() from public, anon, authenticated;
revoke execute on function public.streak(uuid, timestamptz) from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.streak(uuid, timestamptz) to authenticated;
