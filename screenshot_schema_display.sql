-- =========================================================
-- DATABASE SCHEMA DEFINITIONS
-- =========================================================

-- 1. USER PROFILES
-- Stores player information and ranking data
create table public.profiles (
  id uuid references auth.users not null primary key,
  username text unique,
  rank_points int default 0,
  created_at timestamptz default now()
);

-- 2. CHALLENGES
-- Stores CTF problems, flags, and difficulty settings
create table public.challenges (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text not null,
  flag text not null,
  difficulty text default 'Easy', -- Easy, Medium, Hard
  category text default 'Misc',   -- Crypto, Web, etc.
  external_link text,             -- Optional URL for external hosted challenges
  created_at timestamptz default now()
);

-- 3. MATCH SESSIONS
-- Records 1v1 duel details between two players
create table public.matches (
  id uuid default gen_random_uuid() primary key,
  player1_id uuid references public.profiles(id) not null,
  player2_id uuid references public.profiles(id) not null,
  challenge_id uuid references public.challenges(id) not null,
  start_time timestamptz default now(),
  end_time timestamptz,
  winner_id uuid references public.profiles(id),
  created_at timestamptz default now()
);
