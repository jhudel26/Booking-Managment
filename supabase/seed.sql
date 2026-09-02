-- Development seed data (DO NOT use in production)
-- Run after creating users via Supabase Auth dashboard

-- To set up development users:
-- 1. Create users in Supabase Auth dashboard
-- 2. Update their roles:
--
-- UPDATE profiles SET role = 'super_admin', full_name = 'Super Admin'
-- WHERE email = 'superadmin@example.com';
--
-- UPDATE profiles SET role = 'admin', full_name = 'Admin User'
-- WHERE email = 'admin@example.com';

-- Sample bookings (requires existing admin user ID)
-- Replace 'YOUR_ADMIN_USER_ID' with actual UUID

/*
INSERT INTO bookings (
  booking_number, booking_date, start_time, end_time, duration_hours,
  price_per_hour, total_price, requester_name, requester_contact, purpose,
  status, created_by, approved_by, approved_at
) VALUES
(
  'BK-20260910-001', '2026-09-10', '10:00', '13:00', 3,
  200, 600, 'John Doe', 'john@example.com', 'Team Meeting',
  'approved', 'YOUR_ADMIN_USER_ID', 'YOUR_SUPER_ADMIN_ID', NOW()
),
(
  'BK-20260910-002', '2026-09-10', '15:00', '17:00', 2,
  200, 400, 'Jane Smith', 'jane@example.com', 'Workshop',
  'pending', 'YOUR_ADMIN_USER_ID', NULL, NULL
);
*/
