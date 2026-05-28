-- =============================================================================
-- Migration: Create admin_users table and update RLS policies
-- Run this entire script in Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)
-- =============================================================================

-- 1. Create admin_users table
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable Row Level Security on admin_users table
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 3. Allow authenticated users to check if they are admin (read-only)
DROP POLICY IF EXISTS "Authenticated users can check admin status" ON public.admin_users;
CREATE POLICY "Authenticated users can check admin status"
  ON public.admin_users FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. Insert both admin users (including the active one 953621104301@ritrjpm.ac.in)
INSERT INTO public.admin_users (user_id, email)
SELECT id, email FROM auth.users 
WHERE email IN ('953621104301@ritrjpm.ac.in', 'lsabish2001@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- 5. Revoke/Grant permissions for the applicants table
GRANT SELECT, UPDATE ON public.applicants TO authenticated;

-- 6. Update Row-Level Security (RLS) policies on applicants table
-- Drop the old app_metadata-based policies
DROP POLICY IF EXISTS "Admins can read applicants" ON public.applicants;
DROP POLICY IF EXISTS "Admins can update applicants" ON public.applicants;

-- Recreate policies checking the admin_users table
CREATE POLICY "Admins can read applicants"
  ON public.applicants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update applicants"
  ON public.applicants
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
    )
  );

-- 7. Update Row-Level Security (RLS) policies on storage.objects (resumes)
-- Drop the old app_metadata-based policy
DROP POLICY IF EXISTS "Admins can read resumes" ON storage.objects;

-- Recreate policy checking the admin_users table
CREATE POLICY "Admins can read resumes"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'applicant-resumes'
    AND EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
    )
  );

-- Verify it worked (run these to check if users got added):
-- SELECT * FROM public.admin_users;
