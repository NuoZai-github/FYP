-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- 1. USERS / PROFILES
create table public.profiles (
  id uuid references auth.users not null primary key,
  username text unique,
  rank_points int default 0,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using ( true );

create policy "Users can update own profile"
  on public.profiles for update
  using ( auth.uid() = id );

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, rank_points)
  values (new.id, new.raw_user_meta_data->>'username', 0);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. CHALLENGES
create table public.challenges (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text not null,
  flag text not null,
  created_at timestamptz default now()
);

alter table public.challenges enable row level security;

create policy "Challenges are viewable by everyone"
  on public.challenges for select
  using ( true );

-- 3. MATCHES
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

alter table public.matches enable row level security;

create policy "Players can see their matches"
  on public.matches for select
  using ( auth.uid() = player1_id or auth.uid() = player2_id );

-- 4. MATCH QUEUE (Simple matchmaking)
create table public.match_queue (
  user_id uuid references public.profiles(id) primary key,
  joined_at timestamptz default now()
);

alter table public.match_queue enable row level security;

create policy "Users can join queue"
  on public.match_queue for insert
  with check ( auth.uid() = user_id );

create policy "Users can see queue status"
  on public.match_queue for select
  using ( true );

create policy "Users can leave queue"
  on public.match_queue for delete
  using ( auth.uid() = user_id );


-- 5. FUNCTION: JOIN MATCH
create or replace function join_match()
returns json
language plpgsql
security definer
as $$
declare
  opponent_id uuid;
  new_match_id uuid;
  selected_challenge_id uuid;
  my_id uuid;
begin
  my_id := auth.uid();
  
  -- Check if I am already in a match that is active
  if exists (select 1 from matches where (player1_id = my_id or player2_id = my_id) and winner_id is null) then
      -- If user is already in a match, return that match id
      select id into new_match_id from matches where (player1_id = my_id or player2_id = my_id) and winner_id is null limit 1;
      return json_build_object('match_id', new_match_id, 'status', 'matched', 'message', 'Rejoined active match');
  end if;

  -- Check if anyone else is in queue (ordered by time)
  select user_id into opponent_id
  from match_queue
  where user_id != my_id
  order by joined_at asc
  limit 1;

  if opponent_id is not null then
    -- Found opponent!
    delete from match_queue where user_id = opponent_id;
    delete from match_queue where user_id = my_id;

    -- Pick a random challenge
    select id into selected_challenge_id from challenges order by random() limit 1;
    
    if selected_challenge_id is null then
        raise exception 'No challenges available';
    end if;

    -- Create match
    insert into matches (player1_id, player2_id, challenge_id, start_time)
    values (my_id, opponent_id, selected_challenge_id, now())
    returning id into new_match_id;

    return json_build_object('match_id', new_match_id, 'status', 'matched');
  else
    -- No opponent. Add self to queue if not exists.
    insert into match_queue (user_id) values (my_id)
    on conflict (user_id) do nothing;
    
    return json_build_object('status', 'queued');
  end if;
end;
$$;


-- 6. FUNCTION: SUBMIT FLAG
create or replace function submit_flag(match_id_input uuid, flag_submission text)
returns json
language plpgsql
security definer
as $$
declare
  match_record record;
  challenge_record record;
  my_id uuid;
begin
  my_id := auth.uid();

  -- Get match details
  select * from matches where id = match_id_input into match_record;
  
  if match_record is null then
    return json_build_object('success', false, 'message', 'Match not found');
  end if;

  if match_record.winner_id is not null then
     return json_build_object('success', false, 'message', 'Match already ended');
  end if;

  if match_record.player1_id != my_id and match_record.player2_id != my_id then
     return json_build_object('success', false, 'message', 'Not a participant');
  end if;

  -- Get challenge flag
  select * from challenges where id = match_record.challenge_id into challenge_record;

  if challenge_record.flag = flag_submission then
    -- CORRECT FLAG!
    
    -- 1. Update Match w/ Winner and End Time
    update matches 
    set winner_id = my_id, end_time = now()
    where id = match_id_input;

    -- 2. Update Rank Points
    -- Winner +1
    update profiles set rank_points = rank_points + 1 where id = my_id;
    -- Loser -1 (min 0)
    if match_record.player1_id = my_id then
       update profiles set rank_points = greatest(0, rank_points - 1) where id = match_record.player2_id;
    else
       update profiles set rank_points = greatest(0, rank_points - 1) where id = match_record.player1_id;
    end if;

    return json_build_object('success', true, 'message', 'Correct! You win!');
  else
    return json_build_object('success', false, 'message', 'Incorrect flag');
  end if;
end;
$$;
