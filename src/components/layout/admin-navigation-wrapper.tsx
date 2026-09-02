"use client";

import { useEffect, useState } from "react";
import { DashboardNav, adminNavItems } from "@/components/layout/dashboard-nav";
import type { Profile } from "@/types";
import { Calendar, LayoutDashboard, Users, Settings, ClipboardList } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface AdminNavigationWrapperProps {
  profile: Profile;
  title: string;
  children: React.ReactNode;
}

export function AdminNavigationWrapper({ profile, title, children }: AdminNavigationWrapperProps) {
  const [navItems, setNavItems] = useState<NavItem[]>(adminNavItems);

  useEffect(() => {
    const items = [...adminNavItems];
    
    // Add booking management if they can approve bookings
    if (profile.can_approve_bookings) {
      items.push({ 
        href: "/admin/bookings-management", 
        label: "Manage Bookings", 
        icon: <ClipboardList className="h-4 w-4" /> 
      });
    }
    
    // Add user management if they can create admins
    if (profile.can_create_admin) {
      items.push({ 
        href: "/admin/users", 
        label: "Manage Users", 
        icon: <Users className="h-4 w-4" /> 
      });
    }
    
    // Add rate management if they can manage rates
    if (profile.can_manage_rates) {
      items.push({ 
        href: "/admin/settings", 
        label: "Manage Rates", 
        icon: <Settings className="h-4 w-4" /> 
      });
    }
    
    setNavItems(items);
  }, [profile]);

  return (
    <DashboardNav profile={profile} items={navItems} title={title}>
      {children}
    </DashboardNav>
  );
}
