
-- =========================================================
-- INITIAL SEED DATA: CTF CHALLENGES
-- Run this in the Supabase SQL Editor to populate the system
-- =========================================================

-- Ensure columns exist (if not already added by update_db.sql)
ALTER TABLE public.challenges 
ADD COLUMN IF NOT EXISTS difficulty text DEFAULT 'Easy',
ADD COLUMN IF NOT EXISTS category text DEFAULT 'Misc',
ADD COLUMN IF NOT EXISTS external_link text;

-- Clear existing challenges to avoid duplicates (Optional/Testing)
-- TRUNCATE TABLE public.challenges CASCADE;

INSERT INTO public.challenges (title, description, flag, difficulty, category) 
VALUES 
-- EASY CHALLENGES (Avg Rank < 300)
(
    'Inspect the Elements', 
    'The flag is hidden within the HTML source of the target webpage. Can you find it using your browser devtools?', 
    'CTF{dev_t00ls_expert}', 
    'Easy', 
    'Web'
),
(
    'The Hidden Secret', 
    'Decrypt this ROT13 message: "Qvtvgny_Sbgerff_Vf_Eryrnfrq".', 
    'CTF{Digital_Fortress_Is_Released}', 
    'Easy', 
    'Crypto'
),
(
    'Base64 Decoder', 
    'The flag is encoded in Base64: Q1RGe2Jhc2U2NF9pc19ub3RfZW5jcnlwdGlvbn0=', 
    'CTF{base64_is_not_encryption}', 
    'Easy', 
    'Crypto'
),

-- MEDIUM CHALLENGES (300 <= Avg Rank < 800)
(
    'Robots Rules', 
    'Standard compliance for search engines involves a specific file. Find the flag hidden in the directory that robots are forbidden from entering.', 
    'CTF{r0b0ts_4re_w4tching}', 
    'Medium', 
    'Web'
),
(
    'Header Hunt', 
    'A server response header called "X-CTF-FLAG" contains the key. Use a tool like cURL or Postman to inspect the headers.', 
    'CTF{h3ader_m4gic_v2}', 
    'Medium', 
    'Web'
),
(
    'Hash Collision', 
    'Find the original string for this MD5 hash: 5d41402abc4b2a76b9719d911017c592', 
    'CTF{hello}', 
    'Medium', 
    'Crypto'
),

-- HARD CHALLENGES (Avg Rank >= 800)
(
    'Buffer Overflow 101', 
    'A local binary is vulnerable to a classic stack buffer overflow. Overwrite the EIP to point to the "get_shell" function at address 0x080486ad.', 
    'CTF{expl0it_th3_st4ck}', 
    'Hard', 
    'Pwn'
),
(
    'SQL Injection Pro', 
    'The login bypass is possible using a specialized payload. Find the flag in the "hidden_flags" table using a UNION SELECT attack.', 
    'CTF{un1on_select_mast3r}', 
    'Hard', 
    'Web'
),
(
    'Magic Bytes Restoration', 
    'The provided image file has a corrupted header. Restore the original file signature (89 50 4E 47) to view the flag hidden in the image pixels.', 
    'CTF{m4gic_byt3s_f1xed}', 
    'Hard', 
    'Forensics'
);

-- =========================================================
-- END OF SEED SCRIPT
-- =========================================================
