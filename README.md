# Ranked CTF Duel Platform (MVP)

A one-to-one ranked competitive Capture The Flag platform.

## Setup Instructions

### 1. Supabase Setup
This project uses Supabase for the backend (Auth, Database, Realtime).

1. Create a new project on [Supabase.com](https://supabase.com/).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Open the file `supabase_schema.sql` from this project.
4. Copy the entire content of `supabase_schema.sql` and paste it into the Supabase SQL Editor.
5. Click **Run** to set up the database schema, security policies, and functions.
   - This will create Tables: `profiles`, `challenges`, `matches`, `match_queue`.
   - It will create Functions: `join_match`, `submit_flag`, `handle_new_user`.
   - It configures Row Level Security (RLS) policies.

### 2. Configure Environment Variables
1. Copy the `.env` file to a new file named `.env.local` (or just edit `.env` directly if you prefer, but `.env.local` is gitignored).
2. Get your Supabase credentials from **Project Settings > API**.
3. Fill in the variables:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run the Application
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open your browser to `http://localhost:5173`.

## How to Test (Walkthrough)

1. **Create Accounts**: Open the app in two different browsers (or one Incognito) to simulate two users. Sign up two new users.
2. **Setup Challenges**: Log in as one user, go to the **Admin** page. Create un test challenge (Title, Desc, Flag).
   - Example Flag: `CTF{test}`
3. **Matchmaking**: 
   - On both browsers, go to the **Lobby**.
   - Click "Start Ranked Match" on both.
   - The system should pair them and redirect both to the **Match Page**.
4. **Game Flow**:
   - Verify both users see the challenge.
   - User A submits an INCORRECT flag -> System says "Incorrect".
   - User B submits the CORRECT flag (`CTF{test}`) -> System says "You Win!", redirects to Result Page.
   - User A should be redirected to Result Page automatically (via Realtime subscription).
5. **Leaderboard**:
   - Check **Leaderboard** page. Winner should have +1 point.

## Features
- **Authentication**: Email/Password via Supabase.
- **Matchmaking Queue**: Pairs users FIFO.
- **Real-time Match Updates**: Opponent win triggers immediate redirect.
- **Ranking System**: +1 Win, -1 Loss.
- **Security**: Server-side flag validation via Postgres Functions.
