# Connect Supabase Auth for Play XI

Play XI supports Supabase email magic links and Google sign-in. The browser uses only the project URL and publishable key; database access is restricted by row-level security.

## Supabase project setup

1. Create or open the Supabase project for Play XI.
2. In **SQL Editor**, run [`../../supabase/migrations/20261017000000_add_manager_sync.sql`](../../supabase/migrations/20261017000000_add_manager_sync.sql).
3. In **Authentication → URL Configuration**, set the Site URL to `https://playfpl.digital` and add `https://playfpl.digital/**` and `http://localhost:3000/**` to the redirect allow list.
4. Copy the **Project URL** and **Publishable key** from the project's API settings.
5. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in Render's environment settings, then redeploy.

## Enable Google sign-in

The Google button starts Supabase OAuth, but Google sign-in will remain unavailable until the Google provider is configured with OAuth credentials:

1. In [Google Auth Platform](https://console.cloud.google.com/auth/clients), set up Play XI's app name and support email, choose the **External** audience, and create an OAuth client with application type **Web application**. While the app is in testing, only the listed test users can sign in; publish it for general Google-account access.
2. Add `https://playfpl.digital` as an **Authorized JavaScript origin**. Add `http://localhost:3000` only if you use that local development origin.
3. In Supabase, open **Authentication → Providers → Google** and copy its displayed callback URL. Add that exact URL to Google's **Authorized redirect URIs**. It normally has the form `https://<project-ref>.supabase.co/auth/v1/callback`.
4. Copy the Google OAuth client ID and client secret into Supabase's Google provider settings and enable the provider. Do not put the client secret in Play XI, Render's `VITE_` variables, or source control.
5. In Supabase **Authentication → URL Configuration**, allow `https://playfpl.digital/**` and `http://localhost:3000/**` (only if used). The app returns Google users to the origin where they started sign-in.
6. Save the provider settings and redeploy Play XI if you changed its environment. Test Google sign-in on the production domain.

Google sign-in requests identity details for authentication only. Play XI does not request access to Google Drive, Calendar, or other Google services.

For local development, put the same two values in `.env.local` at the repository root. Never put a Supabase secret key or legacy service-role key in a `VITE_` variable or browser code.

## What gets saved

- The signed-in manager's public FPL Team ID.
- That manager's private Play XI lineup plans, keyed by FPL team and Gameweek.

Each row is protected by a policy that requires `auth.uid()` to match its `user_id`. Existing browser-local team IDs and lineup plans remain available; after sign-in, Play XI can copy them into the user's account.
