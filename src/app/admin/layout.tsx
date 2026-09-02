import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/session";
import { canAccessAdmin } from "@/lib/auth/permissions";
import { DashboardNav, adminNavItems } from "@/components/layout/dashboard-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();

  if (!profile || !canAccessAdmin(profile)) {
    redirect("/login");
  }

  // Only redirect actual super admins to super-admin dashboard
  if (profile.role === "super_admin") {
    redirect("/super-admin");
  }

  return (
    <div className="min-h-screen">
      <DashboardNav profile={profile} items={adminNavItems} title="Rimreserve">
        {children}
      </DashboardNav>
    </div>
  );
}
