import type { Profile, UserRole } from "@/types";

export function canAccessAdmin(profile: Profile | null): boolean {
  return !!profile && profile.is_active && ["admin", "super_admin"].includes(profile.role);
}

export function canAccessSuperAdmin(profile: Profile | null): boolean {
  return !!profile && profile.is_active && profile.role === "super_admin";
}

export function canCreateBooking(profile: Profile | null): boolean {
  return canAccessAdmin(profile);
}

export function canApproveBooking(profile: Profile | null): boolean {
  return canAccessSuperAdmin(profile) || (profile?.can_approve_bookings === true);
}

export function canManageUsers(profile: Profile | null): boolean {
  return canAccessSuperAdmin(profile) || (profile?.can_create_admin === true);
}

export function canManagePrice(profile: Profile | null): boolean {
  return canAccessSuperAdmin(profile) || (profile?.can_manage_rates === true);
}

export function getDashboardPath(role: UserRole, profile?: Partial<Profile> | null): string {
  switch (role) {
    case "super_admin":
      return "/super-admin";
    case "admin":
      // Admins always go to admin dashboard, regardless of permissions
      return "/admin";
    default:
      return "/";
  }
}
