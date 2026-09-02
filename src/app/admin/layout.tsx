import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/session";
import { canAccessAdmin } from "@/lib/auth/permissions";
import { DashboardNav, adminNavItems } from "@/components/layout/dashboard-nav";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const profile = await getProfile();

  if (!profile || !canAccessAdmin(profile)) {
    redirect("/login");
  }

  if (profile.role === "super_admin") {
    redirect("/super-admin");
  }

  return (
    <div className="min-h-screen">
      <DashboardNav profile={profile} items={adminNavItems} title="Admin Portal">
        {children}
      </DashboardNav>
    </div>
  );
}
