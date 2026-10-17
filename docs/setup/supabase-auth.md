# Connect Supabase Auth for Play XI

Play XI uses Supabase email magic links. The browser uses only the project URL and publishable key; database access is restricted by row-level security.

## Supabase project setup

1. Create or open the Supabase project for Play XI.
2. In **SQL Editor**, run [`../../supabase/migrations/20261017000000_add_manager_sync.sql`](../../supabase/migrations/20261017000000_add_manager_sync.sql).
3. In **Authentication → URL Configuration**, set the Site URL to `https://playfpl.digital` and add `https://playfpl.digital/**` and `http://localhost:3000/**` to the redirect allow list.
4. Copy the **Project URL** and **Publishable key** from the project's API settings.
5. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in Render's environment settings, then redeploy.

For local development, put the same two values in `.env.local` at the repository root. Never put a Supabase secret key or legacy service-role key in a `VITE_` variable or browser code.

## What gets saved

- The signed-in manager's public FPL Team ID.
- That manager's private Play XI lineup plans, keyed by FPL team and Gameweek.

Each row is protected by a policy that requires `auth.uid()` to match its `user_id`. Existing browser-local team IDs and lineup plans remain available; after sign-in, Play XI can copy them into the user's account.
