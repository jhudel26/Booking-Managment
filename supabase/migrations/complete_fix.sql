-- Complete Fix for Booking System - requester_name Error
-- Run this entire script in Supabase SQL Editor
-- This handles all dependencies and recreates the problematic trigger function

-- ============================================================================
-- STEP 1: Clean up existing problematic objects
-- ============================================================================

-- Drop the existing trigger on bookings table
DROP TRIGGER IF EXISTS on_public_booking_created ON bookings;

-- Drop any trigger on notifications table that might depend on the function
DROP TRIGGER IF EXISTS Notifications ON notifications;

-- Drop the function with CASCADE to handle any remaining dependencies
DROP FUNCTION IF EXISTS notify_admins_on_public_booking() CASCADE;

-- ============================================================================
-- STEP 2: Recreate the function with proper field handling
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_admins_on_public_booking()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify for public bookings (created_by is null)
  IF NEW.created_by IS NULL THEN
    -- Get all admin users and insert notification
    INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id)
    SELECT 
      p.id,
      'booking',
      'New Public Booking Request',
      'A new booking request has been submitted by ' || COALESCE(NEW.requester_name, 'Unknown') || ' for ' || TO_CHAR(NEW.booking_date, 'YYYY-MM-DD') || ' from ' || NEW.start_time || ' to ' || NEW.end_time,
      'booking',
      NEW.id::TEXT
    FROM profiles p
    WHERE p.role IN ('admin', 'super_admin')
    AND p.is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 3: Recreate the trigger
-- ============================================================================

CREATE TRIGGER on_public_booking_created
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_on_public_booking();

-- ============================================================================
-- STEP 4: Verification queries (optional - to verify the fix)
-- ============================================================================

-- Check if the function was created successfully
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name = 'notify_admins_on_public_booking';

-- Check if the trigger was created successfully
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_public_booking_created';

-- Verify the bookings table has the requester_name column
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'bookings'
  AND column_name = 'requester_name';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

-- If you see all the verification queries return results, the fix was successful!
-- You can now try creating a booking again.