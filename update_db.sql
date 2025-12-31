
-- 8. UPDATE challenges table
alter table public.challenges 
add column if not exists difficulty text default 'Easy',
add column if not exists category text default 'Misc',
add column if not exists external_link text;

-- 9. UPDATE join_match function
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
  my_rank int;
  opp_rank int;
  avg_rank int;
  target_difficulty text;
begin
  my_id := auth.uid();
  
  -- Check if I am already in a match that is active
  if exists (select 1 from matches where (player1_id = my_id or player2_id = my_id) and winner_id is null) then
      select id into new_match_id from matches where (player1_id = my_id or player2_id = my_id) and winner_id is null limit 1;
      return json_build_object('match_id', new_match_id, 'status', 'matched', 'message', 'Rejoined active match');
  end if;

  -- Find Opponent
  select user_id into opponent_id
  from match_queue
  where user_id != my_id
  order by joined_at asc
  limit 1;

  if opponent_id is not null then
    -- Found opponent!
    delete from match_queue where user_id = opponent_id;
    delete from match_queue where user_id = my_id;

    -- Calculate Difficulty based on Rank
    select rank_points into my_rank from profiles where id = my_id;
    select rank_points into opp_rank from profiles where id = opponent_id;
    
    avg_rank := (coalesce(my_rank, 0) + coalesce(opp_rank, 0)) / 2;
    
    if avg_rank < 300 then
        target_difficulty := 'Easy';
    elsif avg_rank < 800 then
        target_difficulty := 'Medium';
    else
        target_difficulty := 'Hard';
    end if;

    -- Pick Challenge matching difficulty
    select id into selected_challenge_id 
    from challenges 
    where difficulty = target_difficulty 
    order by random() limit 1;

    -- Fallback if specific difficulty not found
    if selected_challenge_id is null then
        select id into selected_challenge_id from challenges order by random() limit 1;
    end if;
    
    if selected_challenge_id is null then
        raise exception 'No challenges available';
    end if;

    -- Create match
    insert into matches (player1_id, player2_id, challenge_id, start_time)
    values (my_id, opponent_id, selected_challenge_id, now())
    returning id into new_match_id;

    return json_build_object('match_id', new_match_id, 'status', 'matched');
  else
    -- No opponent. Add self to queue.
    insert into match_queue (user_id) values (my_id)
    on conflict (user_id) do nothing;
    
    return json_build_object('status', 'queued');
  end if;
end;
$$;
