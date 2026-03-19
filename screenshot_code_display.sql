-- =========================================================
-- PART 1: RANKED MATCHMAKING & DYNAMIC DIFFICULTY
-- (Located in: join_match function)
-- =========================================================

  -- 1. Find Opponent from Queue (FIFO)
  select user_id into opponent_id
  from match_queue
  where user_id != my_id
  order by joined_at asc
  limit 1;

  if opponent_id is not null then
    
    -- 2. Calculate Average Rank (Matchmaking Rating)
    select rank_points into my_rank from profiles where id = my_id;
    select rank_points into opp_rank from profiles where id = opponent_id;
    
    avg_rank := (coalesce(my_rank, 0) + coalesce(opp_rank, 0)) / 2;
    
    -- 3. Dynamic Difficulty Selection
    if avg_rank < 300 then
        target_difficulty := 'Easy';
    elsif avg_rank < 800 then
        target_difficulty := 'Medium';
    else
        target_difficulty := 'Hard';
    end if;

    -- 4. Assign Random Challenge of Target Difficulty
    select id into selected_challenge_id 
    from challenges 
    where difficulty = target_difficulty 
    order by random() limit 1;

    -- 5. Create Match Session
    insert into matches (player1_id, player2_id, challenge_id, start_time)
    values (my_id, opponent_id, selected_challenge_id, now())
    returning id into new_match_id;

    return json_build_object('match_id', new_match_id, 'status', 'matched');


-- =========================================================
-- PART 2: FLAG VALIDATION & RANK UPDATES
-- (Located in: submit_flag function)
-- =========================================================

  -- 1. Verify Flag against Database
  select * from challenges where id = match_record.challenge_id into challenge_record;

  if challenge_record.flag = flag_submission then
    -- CORRECT FLAG!
    
    -- 2. End Match & Set Winner
    update matches 
    set winner_id = my_id, end_time = now()
    where id = match_id_input;

    -- 3. Update Rank Points (Elo-like logic)
    -- Winner gains points
    update profiles 
    set rank_points = rank_points + 1 
    where id = my_id;

    -- Loser loses points (min 0)
    if match_record.player1_id = my_id then
       update profiles 
       set rank_points = greatest(0, rank_points - 1) 
       where id = match_record.player2_id;
    else
       update profiles 
       set rank_points = greatest(0, rank_points - 1) 
       where id = match_record.player1_id;
    end if;

    return json_build_object('success', true, 'message', 'Correct! You win!');
  else
    return json_build_object('success', false, 'message', 'Incorrect flag');
  end if;
