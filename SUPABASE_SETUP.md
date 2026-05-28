# Supabase Connection and Database Setup

## What the `.env` File Does

The frontend uses a local `.env` file to identify your Supabase project and make
browser requests through Supabase Row Level Security (RLS).

Create `.env` in the project root:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_PUBLISHABLE_KEY
```

Get these values in Supabase Dashboard under **Project Settings > API**.

- `VITE_SUPABASE_URL` identifies the project.
- `VITE_SUPABASE_PUBLISHABLE_KEY` is designed for frontend/browser use.
- A legacy `anon` key can be placed in `VITE_SUPABASE_ANON_KEY` if the project
  does not yet show publishable keys.

Do **not** put a `service_role` key, secret key, database password, or personal
access token in any `VITE_` variable. Vite sends those variables to the browser.

The `.gitignore` already excludes `.env` and `.env.*`, so local credentials are
not committed.

When a valid Supabase URL and publishable key are configured, the application
uses the live database. For local UI demonstration only, `VITE_ENABLE_DEMO_MODE=true`
can enable sample browser data; do not use that flag in production.

## Can Tables Be Created Automatically?

Yes. The project already includes [schema.sql](schema.sql), which creates or
upgrades:

- `public.applicants`
- indexes for admin filters
- RLS policies for public submission and admin review
- Data API privileges restricted by those RLS policies
- the private `applicant-resumes` Storage bucket
- Storage policies for upload and authorized viewing

There are two safe ways to apply it.

### Option A: Supabase SQL Editor

For first setup, open **SQL Editor** in your Supabase Dashboard, paste the
contents of `schema.sql`, and run it once. This is the simplest route for a new
project.

### Option B: Supabase CLI Migrations

For a maintained production project, schema changes should be migrations:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase migration new recruitment_setup
# place the reviewed SQL in the new migration file
supabase db push
```

This records which database changes have been deployed and avoids manually
editing production tables later. Once you provide the project reference and
authenticate the CLI locally, Codex can create and push the migration with your
approval.

## Which Details to Provide

Safe to provide for frontend connection:

```text
Project URL
Publishable key (or legacy anon key)
Project reference ID
```

Keep private:

```text
service_role or secret key
Database password
Supabase personal access token
Admin user's password
```

If a private credential is required by the CLI, enter it locally into the CLI
prompt rather than adding it to application files or chat.

## Admin Account Requirement

The database policy permits candidate details and resumes only for authenticated
users whose trusted application metadata contains:

```json
{ "role": "admin" }
```

This role must be set from a trusted server-side/admin operation; it must not be
set from the public React application. After changing admin metadata, sign out
and sign in again so the refreshed session includes the current claim.

## Resume Security

Candidate CVs are stored in the private `applicant-resumes` bucket. The app
allows a signed-in authorized admin to generate a short-lived signed link when
viewing a resume. Resume files must not be placed in a public bucket.

For a publicly promoted application form, add spam/rate-limit protection before
high-volume use because anonymous candidates can submit profiles and upload
permitted resume documents.

## Connection Checklist

1. Create the Supabase project.
2. Create local `.env` with the project URL and publishable key.
3. Apply `schema.sql` through SQL Editor, or authorize a CLI migration workflow.
4. Create an admin Auth user and assign trusted `app_metadata.role = "admin"`.
5. Restart the Vite dev server after changing `.env`.
6. Submit one candidate profile and verify it appears in the admin dashboard.
7. Upload and open one resume to verify private Storage policy behavior.

## Official References

- [Supabase JavaScript client](https://supabase.com/docs/reference/javascript/initializing)
- [Database migrations](https://supabase.com/docs/guides/deployment/database-migrations)
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Private Storage buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals)
