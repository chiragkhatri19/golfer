-- ==========================================
-- AUTO-ADMIN SETUP FOR DEMO/RECRUITER
-- ==========================================
-- Run this ONCE in Supabase SQL Editor
-- The FIRST user to sign up will automatically become admin
-- ==========================================

-- Update the existing handle_new_user trigger to auto-assign admin to first user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  admin_count INTEGER;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  
  -- Check if any admin exists
  SELECT COUNT(*) INTO admin_count FROM public.user_roles WHERE role = 'admin';
  
  -- If no admin exists, make this user an admin
  IF admin_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    -- Otherwise, make them a regular user
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;
  
  RETURN NEW;
END;
$$;

-- ==========================================
-- HOW IT WORKS:
-- ==========================================
-- 1. First person to sign up → becomes ADMIN automatically
-- 2. Everyone else → becomes regular USER
-- 3. Admin can then promote others via Admin Panel
-- ==========================================

-- ==========================================
-- FOR RECRUITER TESTING:
-- ==========================================
-- Option 1: First signup gets admin (run this SQL first)
-- Option 2: Manually promote any user:
--   INSERT INTO public.user_roles (user_id, role) 
--   VALUES ('USER_UUID', 'admin');
-- ==========================================
