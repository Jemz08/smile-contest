# Smile Club

A camera-powered smile contest hosted as a static Vercel site with serverless API routes.

## Shared leaderboard setup

1. Create a Supabase project and run [`supabase/schema.sql`](supabase/schema.sql) in its SQL Editor.
2. In Vercel, add these environment variables to the `smile-contest` project for Production, Preview, and Development:
   - `SUPABASE_URL`: the project's URL.
   - `SUPABASE_SERVICE_ROLE_KEY`: the server-only service-role key. Never expose it in browser code or commit it.
   - `ADMIN_PASSWORD`: a strong, unique password for the board owner.
   - `ADMIN_SESSION_SECRET`: a random secret of at least 32 characters. Generate one locally with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.
3. Redeploy the project after adding the variables.

Scores and consented, reduced-size JPEG snapshots are visible on the shared leaderboard. The admin password and database service key are only used by Vercel serverless functions. Clearing the board requires the admin password and removes all shared scores and photos.

## Local preview

The existing Python static server shows a browser-local preview. It does not exercise the shared API or admin login. Run the API tests with `node --test api/tests/api.test.cjs`.
