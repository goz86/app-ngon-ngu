create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  study_goal text default '20 từ mỗi ngày',
  preferred_language text default 'en',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create table if not exists public.user_word_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  word_id text not null,
  set_id text not null,
  set_title text not null,
  language text not null,
  term text not null,
  meaning text not null,
  pos text,
  status text not null default 'Mới',
  mastery_level smallint not null default 0 check (mastery_level between 0 and 5),
  ease_factor numeric(4,2) not null default 2.50,
  interval_days integer not null default 0,
  review_count integer not null default 0,
  correct_count integer not null default 0,
  incorrect_count integer not null default 0,
  streak_count integer not null default 0,
  last_result text not null default 'new',
  last_reviewed_at timestamptz,
  next_review_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, word_id)
);

create index if not exists idx_user_word_progress_user_due
  on public.user_word_progress (user_id, next_review_at);

create index if not exists idx_user_word_progress_user_set
  on public.user_word_progress (user_id, set_id);

drop trigger if exists trg_user_word_progress_updated_at on public.user_word_progress;
create trigger trg_user_word_progress_updated_at
before update on public.user_word_progress
for each row
execute function public.set_updated_at();

create table if not exists public.study_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  set_id text not null,
  word_id text not null,
  term text not null,
  result text not null check (result in ('known', 'unknown')),
  source_mode text not null default 'flashcard',
  mastery_level smallint not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_study_events_user_created_at
  on public.study_events (user_id, created_at desc);

create index if not exists idx_study_events_user_set
  on public.study_events (user_id, set_id);

create table if not exists public.user_sets (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  language text not null,
  topic text,
  level text,
  description text,
  words jsonb not null default '[]'::jsonb,
  is_public boolean not null default false,
  share_slug text unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_user_sets_user_id
  on public.user_sets (user_id);

create index if not exists idx_user_sets_share_slug
  on public.user_sets (share_slug);

alter table public.user_sets
  add column if not exists level text;

drop trigger if exists trg_user_sets_updated_at on public.user_sets;
create trigger trg_user_sets_updated_at
before update on public.user_sets
for each row
execute function public.set_updated_at();

create table if not exists public.word_examples (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  set_id text not null,
  word_id text not null,
  language text not null,
  term text not null,
  meaning text not null,
  example_text text not null,
  example_translation text,
  source text not null default 'ai',
  model text,
  position smallint not null default 0 check (position between 0 and 9),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, word_id, position)
);

create index if not exists idx_word_examples_user_word
  on public.word_examples (user_id, word_id, position);

create index if not exists idx_word_examples_user_set
  on public.word_examples (user_id, set_id);

drop trigger if exists trg_word_examples_updated_at on public.word_examples;
create trigger trg_word_examples_updated_at
before update on public.word_examples
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.user_word_progress enable row level security;
alter table public.study_events enable row level security;
alter table public.user_sets enable row level security;
alter table public.word_examples enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Users can read own word progress" on public.user_word_progress;
create policy "Users can read own word progress"
on public.user_word_progress
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own word progress" on public.user_word_progress;
create policy "Users can insert own word progress"
on public.user_word_progress
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own word progress" on public.user_word_progress;
create policy "Users can update own word progress"
on public.user_word_progress
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own word progress" on public.user_word_progress;
create policy "Users can delete own word progress"
on public.user_word_progress
for delete
using (auth.uid() = user_id);

drop policy if exists "Users can read own study events" on public.study_events;
create policy "Users can read own study events"
on public.study_events
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own study events" on public.study_events;
create policy "Users can insert own study events"
on public.study_events
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can read own user sets" on public.user_sets;
create policy "Users can read own user sets"
on public.user_sets
for select
using (auth.uid() = user_id or is_public = true);

drop policy if exists "Users can insert own user sets" on public.user_sets;
create policy "Users can insert own user sets"
on public.user_sets
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own user sets" on public.user_sets;
create policy "Users can update own user sets"
on public.user_sets
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own user sets" on public.user_sets;
create policy "Users can delete own user sets"
on public.user_sets
for delete
using (auth.uid() = user_id);

drop policy if exists "Users can read own word examples" on public.word_examples;
create policy "Users can read own word examples"
on public.word_examples
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own word examples" on public.word_examples;
create policy "Users can insert own word examples"
on public.word_examples
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own word examples" on public.word_examples;
create policy "Users can update own word examples"
on public.word_examples
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own word examples" on public.word_examples;
create policy "Users can delete own word examples"
on public.word_examples
for delete
using (auth.uid() = user_id);
