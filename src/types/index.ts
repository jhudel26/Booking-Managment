export const APP_TIMEZONE = "Asia/Manila";

export type UserRole = "user" | "admin" | "super_admin";
export type BookingStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  booking_number: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  price_per_hour: number;
  total_price: number;
  requester_name: string;
  requester_contact: string;
  purpose: string;
  notes: string | null;
  status: BookingStatus;
  created_by: string;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  rejected_at: string | null;
  cancelled_at: string | null;
  creator?: Profile;
  approver?: Profile;
}

export interface BookingStatusHistory {
  id: string;
  booking_id: string;
  old_status: BookingStatus | null;
  new_status: BookingStatus;
  changed_by: string | null;
  reason: string | null;
  created_at: string;
}

export interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  updated_by: string | null;
  updated_at: string;
}

export interface PriceHistory {
  id: string;
  price_per_hour: number;
  effective_from: string;
  changed_by: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  performed_by: string | null;
  created_at: string;
  performer?: Profile;
}

export interface TimeSlot {
  start: string;
  end: string;
  status: BookingStatus | "available";
  booking?: Booking;
}

export interface DashboardStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
  revenue: number;
}

export const BOOKING_STATUS_LABELS: Record<BookingStatus | "available", string> = {
  available: "Available",
  pending: "Pending",
  approved: "Booked",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  user: "User",
  admin: "Admin",
  super_admin: "Super Admin",
};
