-- Booking Management System - Complete Schema (Rimreserve)

-- Timezone: Asia/Manila

-- This single migration file contains all necessary schema, functions, triggers, RLS policies, and grants

-- Includes admin permission delegation system, public bookings, and notifications



-- Extensions

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE EXTENSION IF NOT EXISTS "btree_gist";



-- Custom types

CREATE TYPE user_role AS ENUM ('user', 'admin', 'super_admin');

CREATE TYPE booking_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');



-- Profiles (extends auth.users)

CREATE TABLE profiles (

  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  full_name TEXT NOT NULL DEFAULT '',

  email TEXT NOT NULL,

  role user_role NOT NULL DEFAULT 'user',

  is_active BOOLEAN NOT NULL DEFAULT true,

  can_create_admin BOOLEAN DEFAULT false,

  can_approve_bookings BOOLEAN DEFAULT false,

  can_manage_rates BOOLEAN DEFAULT false,

  can_grant_admin_permissions BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);



CREATE INDEX idx_profiles_role ON profiles(role);

CREATE INDEX idx_profiles_email ON profiles(email);



-- System settings

CREATE TABLE system_settings (

  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  setting_key TEXT NOT NULL UNIQUE,

  setting_value TEXT NOT NULL,

  updated_by UUID REFERENCES profiles(id),

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);



-- Price history

CREATE TABLE price_history (

  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  price_per_hour NUMERIC(10, 2) NOT NULL,

  effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  changed_by UUID REFERENCES profiles(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);



-- Bookings

CREATE TABLE bookings (

  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  booking_number TEXT NOT NULL UNIQUE,

  booking_date DATE NOT NULL,

  start_time TIME NOT NULL,

  end_time TIME NOT NULL,

  duration_hours NUMERIC(6, 2) NOT NULL,

  price_per_hour NUMERIC(10, 2) NOT NULL,

  total_price NUMERIC(12, 2) NOT NULL,

  requester_name TEXT NOT NULL,

  requester_contact TEXT NOT NULL DEFAULT '',

  purpose TEXT NOT NULL DEFAULT '',

  notes TEXT DEFAULT '',

  status booking_status NOT NULL DEFAULT 'pending',

  created_by UUID REFERENCES profiles(id),

  approved_by UUID REFERENCES profiles(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  approved_at TIMESTAMPTZ,

  rejected_at TIMESTAMPTZ,

  cancelled_at TIMESTAMPTZ,

  CONSTRAINT valid_time_range CHECK (end_time > start_time),

  CONSTRAINT valid_duration CHECK (duration_hours > 0),

  CONSTRAINT valid_price CHECK (price_per_hour >= 0 AND total_price >= 0)

);



CREATE INDEX idx_bookings_date ON bookings(booking_date);

CREATE INDEX idx_bookings_status ON bookings(status);

CREATE INDEX idx_bookings_created_by ON bookings(created_by);

CREATE INDEX idx_bookings_date_status ON bookings(booking_date, status);

CREATE INDEX idx_bookings_number ON bookings(booking_number);



-- Booking status history

CREATE TABLE booking_status_history (

  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,

  old_status booking_status,

  new_status booking_status NOT NULL,

  changed_by UUID REFERENCES profiles(id),

  reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);



CREATE INDEX idx_booking_status_history_booking ON booking_status_history(booking_id);



-- Audit logs

CREATE TABLE audit_logs (

  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  action TEXT NOT NULL,

  entity_type TEXT NOT NULL,

  entity_id TEXT,

  details JSONB DEFAULT '{}',

  performed_by UUID REFERENCES profiles(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);



CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

CREATE INDEX idx_audit_logs_action ON audit_logs(action);



-- Notifications table for admin alerts

CREATE TABLE notifications (

  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  type TEXT NOT NULL DEFAULT 'info',

  title TEXT NOT NULL,

  message TEXT NOT NULL,

  entity_type TEXT,

  entity_id TEXT,

  read BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);



CREATE INDEX idx_notifications_user_id ON notifications(user_id);

CREATE INDEX idx_notifications_read ON notifications(read);

CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);



-- Updated_at trigger

CREATE OR REPLACE FUNCTION update_updated_at()

RETURNS TRIGGER AS $$

BEGIN

  NEW.updated_at = NOW();

  RETURN NEW;

END;

$$ LANGUAGE plpgsql;



CREATE TRIGGER profiles_updated_at

  BEFORE UPDATE ON profiles

  FOR EACH ROW EXECUTE FUNCTION update_updated_at();



CREATE TRIGGER bookings_updated_at

  BEFORE UPDATE ON bookings

  FOR EACH ROW EXECUTE FUNCTION update_updated_at();



-- Auto-create profile on signup (improved version with error handling)

CREATE OR REPLACE FUNCTION public.handle_new_user()

RETURNS TRIGGER

LANGUAGE plpgsql

SECURITY DEFINER

SET search_path = public

AS $$

DECLARE

  assigned_role public.user_role := 'user';

  role_text TEXT;

BEGIN

  role_text := NEW.raw_user_meta_data->>'role';



  IF role_text IN ('user', 'admin', 'super_admin') THEN

    assigned_role := role_text::public.user_role;

  END IF;



  INSERT INTO public.profiles (id, full_name, email, role)

  VALUES (

    NEW.id,

    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),

    COALESCE(NEW.email, ''),

    assigned_role

  )

  ON CONFLICT (id) DO UPDATE SET

    email = EXCLUDED.email,

    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), profiles.full_name);



  RETURN NEW;

EXCEPTION

  WHEN OTHERS THEN

    RAISE LOG 'handle_new_user failed for %: %', NEW.id, SQLERRM;

    RAISE;

END;

$$;



CREATE TRIGGER on_auth_user_created

  AFTER INSERT ON auth.users

  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();



-- Generate booking number (RR prefix for Rimreserve)

CREATE OR REPLACE FUNCTION generate_booking_number(p_date DATE)

RETURNS TEXT AS $$

DECLARE

  v_count INTEGER;

  v_date_str TEXT;

BEGIN

  v_date_str := TO_CHAR(p_date, 'YYYYMMDD');

  SELECT COUNT(*) + 1 INTO v_count

  FROM bookings

  WHERE booking_date = p_date;

  RETURN 'RR-' || v_date_str || '-' || LPAD(v_count::TEXT, 3, '0');

END;

$$ LANGUAGE plpgsql;



-- Booking conflict check

CREATE OR REPLACE FUNCTION check_booking_conflict()

RETURNS TRIGGER AS $$

DECLARE

  v_conflict_count INTEGER;

BEGIN

  IF NEW.status NOT IN ('pending', 'approved') THEN

    RETURN NEW;

  END IF;



  SELECT COUNT(*) INTO v_conflict_count

  FROM bookings

  WHERE booking_date = NEW.booking_date

    AND status IN ('pending', 'approved')

    AND id IS DISTINCT FROM NEW.id

    AND start_time < NEW.end_time

    AND end_time > NEW.start_time;



  IF v_conflict_count > 0 THEN

    RAISE EXCEPTION 'Booking conflict: time slot overlaps with an existing booking'

      USING ERRCODE = 'P0001';

  END IF;



  RETURN NEW;

END;

$$ LANGUAGE plpgsql;



CREATE TRIGGER booking_conflict_check

  BEFORE INSERT OR UPDATE ON bookings

  FOR EACH ROW EXECUTE FUNCTION check_booking_conflict();



-- Booking status history trigger

CREATE OR REPLACE FUNCTION log_booking_status_change()

RETURNS TRIGGER AS $$

BEGIN

  IF TG_OP = 'INSERT' THEN

    INSERT INTO booking_status_history (booking_id, old_status, new_status, changed_by)

    VALUES (NEW.id, NULL, NEW.status, NEW.created_by);

  ELSIF OLD.status IS DISTINCT FROM NEW.status THEN

    INSERT INTO booking_status_history (booking_id, old_status, new_status, changed_by, reason)

    VALUES (NEW.id, OLD.status, NEW.status, NEW.approved_by, NEW.notes);

  END IF;

  RETURN NEW;

END;

$$ LANGUAGE plpgsql SECURITY DEFINER;



CREATE TRIGGER booking_status_history_log

  AFTER INSERT OR UPDATE ON bookings

  FOR EACH ROW EXECUTE FUNCTION log_booking_status_change();



-- Function to create notification for public bookings

CREATE OR REPLACE FUNCTION notify_admins_on_public_booking()

RETURNS TRIGGER AS $$

BEGIN

  -- Only notify for public bookings (created_by is null)

  IF NEW.created_by IS NULL THEN

    -- Get all admin users

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



-- Trigger to call notification function

DROP TRIGGER IF EXISTS on_public_booking_created ON bookings;

CREATE TRIGGER on_public_booking_created

  AFTER INSERT ON bookings

  FOR EACH ROW

  EXECUTE FUNCTION notify_admins_on_public_booking();



-- Helper: get user role

CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)

RETURNS user_role AS $$

BEGIN

  RETURN (SELECT role FROM profiles WHERE id = user_id);

END;

$$ LANGUAGE plpgsql SECURITY DEFINER;



-- Enable RLS

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

ALTER TABLE booking_status_history ENABLE ROW LEVEL SECURITY;

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;



-- Profiles RLS policies

CREATE POLICY "Users can view own profile"

  ON profiles FOR SELECT

  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"

  ON profiles FOR SELECT

  USING (

    EXISTS (

      SELECT 1 FROM profiles 

      WHERE id = auth.uid() 

      AND role IN ('admin', 'super_admin')

    )

  );

CREATE POLICY "Users can update own profile"

  ON profiles FOR UPDATE

  USING (auth.uid() = id);

CREATE POLICY "Service role can do anything"

  ON profiles FOR ALL

  USING (auth.role() = 'service_role');



-- Bookings RLS policies

CREATE POLICY "Public can view bookings"

  ON bookings FOR SELECT

  USING (true);

CREATE POLICY "Users can view own bookings"

  ON bookings FOR SELECT

  USING (auth.uid() = created_by);

CREATE POLICY "Admins can view all bookings"

  ON bookings FOR SELECT

  USING (

    EXISTS (

      SELECT 1 FROM profiles 

      WHERE id = auth.uid() 

      AND role IN ('admin', 'super_admin')

    )

  );

CREATE POLICY "Service role can do anything"

  ON bookings FOR ALL

  USING (auth.role() = 'service_role');



-- System settings RLS policies

CREATE POLICY "Public can view system settings"

  ON system_settings FOR SELECT

  USING (true);

CREATE POLICY "Service role can do anything"

  ON system_settings FOR ALL

  USING (auth.role() = 'service_role');



-- Price history RLS policies

CREATE POLICY "Admins can view price history"

  ON price_history FOR SELECT

  USING (

    EXISTS (

      SELECT 1 FROM profiles 

      WHERE id = auth.uid() 

      AND role IN ('admin', 'super_admin')

    )

  );

CREATE POLICY "Service role can do anything"

  ON price_history FOR ALL

  USING (auth.role() = 'service_role');



-- Booking status history RLS policies

CREATE POLICY "Users can view own booking history"

  ON booking_status_history FOR SELECT

  USING (

    EXISTS (

      SELECT 1 FROM bookings b

      WHERE b.id = booking_status_history.booking_id

      AND b.created_by = auth.uid()

    )

  );

CREATE POLICY "Admins can view all booking history"

  ON booking_status_history FOR SELECT

  USING (

    EXISTS (

      SELECT 1 FROM profiles 

      WHERE id = auth.uid() 

      AND role IN ('admin', 'super_admin')

    )

  );

CREATE POLICY "Service role can do anything"

  ON booking_status_history FOR ALL

  USING (auth.role() = 'service_role');



-- Audit logs RLS policies

CREATE POLICY "Admins can view audit logs"

  ON audit_logs FOR SELECT

  USING (

    EXISTS (

      SELECT 1 FROM profiles 

      WHERE id = auth.uid() 

      AND role IN ('admin', 'super_admin')

    )

  );

CREATE POLICY "Service role can do anything"

  ON audit_logs FOR ALL

  USING (auth.role() = 'service_role');



-- Notifications RLS policies

CREATE POLICY "Users can view own notifications"

  ON notifications FOR SELECT

  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"

  ON notifications FOR UPDATE

  USING (auth.uid() = user_id);

CREATE POLICY "Service role can do anything"

  ON notifications FOR ALL

  USING (auth.role() = 'service_role');



-- Default system setting (200 PHP per hour)

INSERT INTO system_settings (setting_key, setting_value)

VALUES ('rimreserve_price_per_hour', '200')

ON CONFLICT (setting_key) DO NOTHING;

-- Default price history entry

INSERT INTO price_history (price_per_hour, effective_from)

VALUES (200, NOW())

ON CONFLICT DO NOTHING;