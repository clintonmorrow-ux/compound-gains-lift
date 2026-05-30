-- Compound Gains · Lift — Supabase Schema
-- Safe to run multiple times (IF NOT EXISTS throughout)

-- ── Extensions ────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Tables ────────────────────────────────────────────────────────────────

-- Profiles (extends Supabase auth.users — may already exist)
create table if not exists public.profiles (
  id         uuid references auth.users on delete cascade primary key,
  created_at timestamptz default now()
);

-- User settings (week tracker + rounding preference)
create table if not exists public.user_settings (
  id           uuid references public.profiles(id) on delete cascade primary key,
  current_week integer      default 1 check (current_week between 1 and 12),
  round_to_lbs numeric(4,1) default 5,
  updated_at   timestamptz  default now()
);

-- 1RM / reference weights per exercise
create table if not exists public.user_1rm (
  id            uuid         default uuid_generate_v4() primary key,
  user_id       uuid         references public.profiles(id) on delete cascade not null,
  exercise_name text         not null,
  weight_lbs    numeric(6,1) not null,
  updated_at    timestamptz  default now(),
  unique(user_id, exercise_name)
);

-- Workout sessions
create table if not exists public.sessions (
  id           uuid        default uuid_generate_v4() primary key,
  user_id      uuid        references public.profiles(id) on delete cascade not null,
  week_number  integer     not null check (week_number between 1 and 12),
  workout_key  text        not null check (workout_key in ('A','B','C','D')),
  started_at   timestamptz default now(),
  completed_at timestamptz,
  notes        text
);

-- Individual logged sets within a session
create table if not exists public.logged_sets (
  id            uuid         default uuid_generate_v4() primary key,
  session_id    uuid         references public.sessions(id) on delete cascade not null,
  exercise_name text         not null,
  set_number    integer      not null,
  weight_lbs    numeric(6,1),
  reps          integer,
  completed_at  timestamptz  default now(),
  skipped       boolean      default false
);

-- ── Row Level Security ────────────────────────────────────────────────────

alter table public.profiles     enable row level security;
alter table public.user_settings enable row level security;
alter table public.user_1rm     enable row level security;
alter table public.sessions     enable row level security;
alter table public.logged_sets  enable row level security;

-- ── RLS Policies (drop first so re-runs don't error) ─────────────────────

drop policy if exists "own profile"   on public.profiles;
drop policy if exists "own settings"  on public.user_settings;
drop policy if exists "own 1rms"      on public.user_1rm;
drop policy if exists "own sessions"  on public.sessions;
drop policy if exists "own sets"      on public.logged_sets;

create policy "own profile"  on public.profiles     for all using (auth.uid() = id);
create policy "own settings" on public.user_settings for all using (auth.uid() = id);
create policy "own 1rms"     on public.user_1rm     for all using (auth.uid() = user_id);
create policy "own sessions" on public.sessions     for all using (auth.uid() = user_id);
create policy "own sets"     on public.logged_sets  for all using (
  auth.uid() = (select user_id from public.sessions where id = session_id)
);

-- ── Auto-create profile + settings on signup ──────────────────────────────

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
    values (new.id)
    on conflict (id) do nothing;
  insert into public.user_settings (id)
    values (new.id)
    on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if it exists, then recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Equipment preference (run this if upgrading from initial schema) ────
alter table public.user_settings
  add column if not exists equipment_types text[]
  default array['barbell','dumbbells','cables','machines']::text[];

-- ── Exercise preferences (run to upgrade) ─────────────────────────
alter table public.user_settings
  add column if not exists exercise_preferences jsonb default '{}'::jsonb;
