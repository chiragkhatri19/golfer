-- ==========================================
-- CREATE DEMO ADMIN ACCOUNT
-- ==========================================
-- Run this ONCE in Supabase SQL Editor
-- This creates a ready-to-use admin account for recruiters
-- ==========================================

-- Step 1: Create the auth user (password: demo123)
-- Note: Supabase doesn't allow direct password insertion via SQL
-- So we'll use a different approach - see instructions below

-- ALTERNATIVE APPROACH:
-- 1. Sign up normally with: demo@charitydrive.com / demo123
-- 2. Then run this to make that user admin:

-- INSERT INTO public.user_roles (user_id, role) 
-- SELECT id, 'admin' FROM auth.users WHERE email = 'demo@charitydrive.com';

-- ==========================================
-- BETTER SOLUTION: Auto-admin trigger
-- ==========================================
-- This makes the FIRST user who signs up automatically an admin
-- Perfect for demo/recruiter testing

CREATE OR REPLACE FUNCTION public.make_first_user_admin()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Check if this is the first user
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to run after user role is inserted
CREATE TRIGGER trg_make_first_user_admin
  AFTER INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.make_first_user_admin();

-- ==========================================
-- INSTRUCTIONS FOR RECRUITER:
-- ==========================================
-- 1. Sign up with ANY email (e.g., recruiter@test.com)
-- 2. They will AUTOMATICALLY become admin
-- 3. They can access /admin routes immediately
-- ==========================================
