import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/session";
import { canAccessAdmin } from "@/lib/auth/permissions";
import { DashboardNav, adminNavItems } from "@/components/layout/dashboard-nav";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const profile = await getProfile();

  if (!profile || !canAccessAdmin(profile)) {
    redirect("/login");
  }

  // Redirect to super-admin if they have elevated permissions
  if (profile.role === "super_admin" || 
      profile.can_approve_bookings || 
      profile.can_create_admin || 
      profile.can_manage_rates) {
    redirect("/super-admin");
  }

  return (
    <div className="min-h-screen">
      <DashboardNav profile={profile} items={adminNavItems} title="Rimreserve Admin">
        {children}
      </DashboardNav>
    </div>
  );
}
