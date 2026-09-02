import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/session";
import { canAccessSuperAdmin } from "@/lib/auth/permissions";
import { DashboardNav, superAdminNavItems } from "@/components/layout/dashboard-nav";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();

  if (!profile) {
    redirect("/login");
  }

  // Allow access if user is super admin OR has elevated permissions
  const hasAccess = profile.role === "super_admin" || 
    profile.can_approve_bookings || 
    profile.can_create_admin || 
    profile.can_manage_rates;

  if (!hasAccess) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <DashboardNav profile={profile} items={superAdminNavItems} title="Rimreserve">
        {children}
      </DashboardNav>
    </div>
  );
}
