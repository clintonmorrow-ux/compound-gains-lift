-- Compound Gains · Lift — Supabase Schema
-- Run this in your Supabase SQL editor

create extension if not exists "uuid-ossp";

-- Profiles (auto-created on signup)
create table public.profiles (
  id         uuid references auth.users on delete cascade primary key,
  created_at timestamptz default now()
);

-- User settings
create table public.user_settings (
  id           uuid references public.profiles(id) on delete cascade primary key,
  current_week integer     default 1  check (current_week between 1 and 12),
  round_to_lbs numeric(4,1) default 5,
  updated_at   timestamptz default now()
);

-- 1RM / reference weights
create table public.user_1rm (
  id            uuid        default uuid_generate_v4() primary key,
  user_id       uuid        references public.profiles(id) on delete cascade not null,
  exercise_name text        not null,
  weight_lbs    numeric(6,1) not null,
  updated_at    timestamptz default now(),
  unique(user_id, exercise_name)
);

-- Workout sessions
create table public.sessions (
  id           uuid        default uuid_generate_v4() primary key,
  user_id      uuid        references public.profiles(id) on delete cascade not null,
  week_number  integer     not null check (week_number between 1 and 12),
  workout_key  text        not null check (workout_key in ('A','B','C','D')),
  started_at   timestamptz default now(),
  completed_at timestamptz,
  notes        text
);

-- Logged sets
create table public.logged_sets (
  id            uuid        default uuid_generate_v4() primary key,
  session_id    uuid        references public.sessions(id) on delete cascade not null,
  exercise_name text        not null,
  set_number    integer     not null,
  weight_lbs    numeric(6,1),
  reps          integer,
  completed_at  timestamptz default now(),
  skipped       boolean     default false
);

-- RLS
alter table public.profiles     enable row level security;
alter table public.user_settings enable row level security;
alter table public.user_1rm     enable row level security;
alter table public.sessions     enable row level security;
alter table public.logged_sets  enable row level security;

-- Policies
create policy "own profile"   on public.profiles     for all using (auth.uid() = id);
create policy "own settings"  on public.user_settings for all using (auth.uid() = id);
create policy "own 1rms"      on public.user_1rm     for all using (auth.uid() = user_id);
create policy "own sessions"  on public.sessions     for all using (auth.uid() = user_id);
create policy "own sets"      on public.logged_sets  for all using (
  auth.uid() = (select user_id from public.sessions where id = session_id)
);

-- Auto-create profile on signup (works for anonymous auth too)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  insert into public.user_settings (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
