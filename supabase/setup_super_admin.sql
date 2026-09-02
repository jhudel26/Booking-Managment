-- One-time Super Admin setup
-- Run AFTER creating a user in Supabase Auth Dashboard
--
-- Steps:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add user" and create with email/password
-- 3. Copy the user's UUID
-- 4. Run this SQL replacing the email below:

-- UPDATE profiles
-- SET role = 'super_admin', full_name = 'Super Administrator', is_active = true
-- WHERE email = 'your-email@example.com';

-- Verify:
-- SELECT id, email, role, is_active FROM profiles WHERE role = 'super_admin';
