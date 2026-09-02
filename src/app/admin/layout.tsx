import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/session";
import { canAccessAdmin } from "@/lib/auth/permissions";
import { DashboardNav, adminNavItems, getPermissionBasedNavItems } from "@/components/layout/dashboard-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();

  if (!profile || !canAccessAdmin(profile)) {
    redirect("/login");
  }

  // Only redirect actual super admins to super-admin dashboard
  if (profile.role === "super_admin") {
    redirect("/super-admin");
  }

  // Use permission-based navigation if permission columns exist in database
  const hasPermissionColumns = 'can_approve_bookings' in profile;
  const navItems = hasPermissionColumns ? getPermissionBasedNavItems(profile) : adminNavItems;

  return (
    <div className="min-h-screen">
      <DashboardNav profile={profile} items={navItems} title="Rimreserve Admin">
        {children}
      </DashboardNav>
    </div>
  );
}
