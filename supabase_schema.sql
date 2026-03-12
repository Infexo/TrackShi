-- Run this in your Supabase SQL Editor

create extension if not exists "uuid-ossp";

-- Create profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  group_name text,
  daily_goal integer default 0,
  focus_whitelist text,
  updated_at timestamp with time zone
);

-- Add columns if they were missing from a previous run
alter table public.profiles add column if not exists group_name text;
alter table public.profiles add column if not exists daily_goal integer default 0;
alter table public.profiles add column if not exists focus_whitelist text;

-- Create subjects table
create table if not exists public.subjects (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  color text default '#3b82f6',
  created_at timestamp with time zone default now()
);

alter table public.subjects add column if not exists color text default '#3b82f6';

-- Create sessions table
create table if not exists public.sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  subject_id uuid references public.subjects on delete set null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  duration_minutes integer not null,
  duration_seconds integer not null default 0,
  date date not null,
  created_at timestamp with time zone default now()
);

alter table public.sessions add column if not exists duration_seconds integer not null default 0;

-- Create live_status table
create table if not exists public.live_status (
  user_id uuid references auth.users on delete cascade not null primary key,
  status text not null, -- 'studying' or 'offline'
  subject_id uuid references public.subjects on delete set null,
  started_at timestamp with time zone,
  updated_at timestamp with time zone default now()
);

-- Create todo_images table
create table if not exists public.todo_images (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  image_url text not null,
  created_at timestamp with time zone default now(),
  unique(user_id, date)
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.sessions enable row level security;
alter table public.live_status enable row level security;
alter table public.todo_images enable row level security;

-- Create RLS Policies

-- Profiles: Users can read all profiles (for group dashboard) but only update their own
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Subjects: Users can only see and manage their own subjects
drop policy if exists "Users can view own subjects" on public.subjects;
create policy "Users can view own subjects" on public.subjects for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own subjects" on public.subjects;
create policy "Users can insert own subjects" on public.subjects for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own subjects" on public.subjects;
create policy "Users can update own subjects" on public.subjects for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own subjects" on public.subjects;
create policy "Users can delete own subjects" on public.subjects for delete using (auth.uid() = user_id);

-- Sessions: Users can view all sessions (for group stats) but only manage their own
drop policy if exists "Sessions are viewable by everyone" on public.sessions;
create policy "Sessions are viewable by everyone" on public.sessions for select using (true);

drop policy if exists "Users can insert own sessions" on public.sessions;
create policy "Users can insert own sessions" on public.sessions for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own sessions" on public.sessions;
create policy "Users can update own sessions" on public.sessions for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own sessions" on public.sessions;
create policy "Users can delete own sessions" on public.sessions for delete using (auth.uid() = user_id);

-- Live Status: Viewable by everyone, updatable by owner
drop policy if exists "Live status viewable by everyone" on public.live_status;
create policy "Live status viewable by everyone" on public.live_status for select using (true);

drop policy if exists "Users can insert own live status" on public.live_status;
create policy "Users can insert own live status" on public.live_status for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own live status" on public.live_status;
create policy "Users can update own live status" on public.live_status for update using (auth.uid() = user_id);

-- Todo Images: Viewable by everyone, updatable by owner
drop policy if exists "Todo images viewable by everyone" on public.todo_images;
create policy "Todo images viewable by everyone" on public.todo_images for select using (true);

drop policy if exists "Users can insert own todo images" on public.todo_images;
create policy "Users can insert own todo images" on public.todo_images for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own todo images" on public.todo_images;
create policy "Users can update own todo images" on public.todo_images for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own todo images" on public.todo_images;
create policy "Users can delete own todo images" on public.todo_images for delete using (auth.uid() = user_id);

-- Create a trigger to automatically create a profile for new users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Enable realtime for live_status
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table public.live_status;

-- IMPORTANT: You must manually create a storage bucket named "todo-images" in the Supabase Dashboard
-- and set it to Public.

