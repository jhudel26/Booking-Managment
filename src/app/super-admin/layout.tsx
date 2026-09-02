import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/session";
import { canAccessSuperAdmin } from "@/lib/auth/permissions";
import { DashboardNav, superAdminNavItems } from "@/components/layout/dashboard-nav";

export default async function SuperAdminLayout({ children }: LayoutProps<"/super-admin">) {
  const profile = await getProfile();

  if (!profile || !canAccessSuperAdmin(profile)) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <DashboardNav profile={profile} items={superAdminNavItems} title="Super Admin">
        {children}
      </DashboardNav>
    </div>
  );
}
