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
  return canAccessSuperAdmin(profile);
}

export function canManageUsers(profile: Profile | null): boolean {
  return canAccessSuperAdmin(profile);
}

export function canManagePrice(profile: Profile | null): boolean {
  return canAccessSuperAdmin(profile);
}

export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case "super_admin":
      return "/super-admin";
    case "admin":
      return "/admin";
    default:
      return "/";
  }
}
