"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, LayoutDashboard, Users, Settings, ClipboardList, Menu, X, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import type { Profile } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

function NavLinks({
  items,
  pathname,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      {items.map((item) => {
        // Only highlight on exact match - this prevents parent highlighting when on child pages
        const isActive = pathname === item.href;
        
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

export function DashboardNav({
  profile,
  items,
  title,
  children,
}: {
  profile: Profile;
  items: NavItem[];
  title: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center gap-4 px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <Link href="/" className="font-semibold text-lg">
            {title}
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden sm:inline text-sm text-muted-foreground">
              {profile.full_name || profile.email}
            </span>
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-3.5rem)]">
        <aside className="hidden lg:flex w-64 flex-col border-r bg-muted/30 p-4">
          <nav className="flex flex-col gap-1">
            <NavLinks items={items} pathname={pathname} />
          </nav>
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
            <aside className="fixed left-0 top-14 bottom-0 w-64 border-r bg-background p-4">
              <nav className="flex flex-col gap-1">
                <NavLinks items={items} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
              </nav>
            </aside>
          </div>
        )}

        <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
      </div>
    </>
  );
}

export const adminNavItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: "/admin/calendar", label: "Calendar", icon: <Calendar className="h-4 w-4" /> },
  { href: "/admin/bookings", label: "My Reservations", icon: <ClipboardList className="h-4 w-4" /> },
];

export const superAdminNavItems: NavItem[] = [
  { href: "/super-admin", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: "/super-admin/bookings", label: "Reservations", icon: <ClipboardList className="h-4 w-4" /> },
  { href: "/super-admin/users", label: "Users", icon: <Users className="h-4 w-4" /> },
  { href: "/super-admin/settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
];
