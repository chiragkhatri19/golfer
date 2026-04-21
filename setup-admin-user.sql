-- ==========================================
-- CREATE ADMIN USER
-- ==========================================
-- Run this AFTER you sign up your first user
-- Replace 'YOUR_USER_UUID_HERE' with your actual user ID
-- ==========================================

-- Step 1: Find your user ID
-- Run this query first to get your user ID:
-- SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 1;

-- Step 2: Replace the UUID below with your actual user ID
-- Then run this:
-- INSERT INTO public.user_roles (user_id, role) 
-- VALUES ('YOUR_USER_UUID_HERE', 'admin');

-- Example:
-- INSERT INTO public.user_roles (user_id, role) 
-- VALUES ('12345678-1234-1234-1234-123456789abc', 'admin');
