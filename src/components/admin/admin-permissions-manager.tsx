"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Shield, ShieldCheck } from "lucide-react";

interface AdminProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  can_create_admin: boolean;
  can_approve_bookings: boolean;
  can_manage_rates: boolean;
  can_grant_admin_permissions: boolean;
}

export function AdminPermissionsManager() {
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const loadAdmins = async () => {
    try {
      const res = await fetch("/api/admin/permissions");
      if (res.ok) {
        setAdmins(await res.json());
      }
    } catch (error) {
      toast.error("Failed to load admins");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAdmins(); }, []);

  const updatePermission = async (adminId: string, permissions: any) => {
    setUpdating(adminId);
    try {
      const res = await fetch("/api/admin/permissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: adminId, permissions }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to update permissions");
        return;
      }

      toast.success("Permissions updated successfully");
      await loadAdmins();
    } catch (error) {
      toast.error("Failed to update permissions");
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Admin Permissions
            </CardTitle>
            <CardDescription className="mt-2">
              Manage admin permissions and access controls
            </CardDescription>
          </div>
          <Button onClick={loadAdmins} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {admins.map((admin) => (
            <div
              key={admin.id}
              className="border rounded-lg p-4 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{admin.full_name || admin.email}</h4>
                    <Badge variant={admin.role === "super_admin" ? "default" : "secondary"}>
                      {admin.role === "super_admin" ? "Super Admin" : "Admin"}
                    </Badge>
                    {!admin.is_active && (
                      <Badge variant="destructive">Inactive</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{admin.email}</p>
                </div>
                {admin.role === "super_admin" && (
                  <ShieldCheck className="h-5 w-5 text-primary" />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor={`create-admin-${admin.id}`} className="flex flex-col space-y-1">
                    <span>Create Admin Users</span>
                    <span className="text-xs text-muted-foreground">
                      Can create new admin accounts
                    </span>
                  </Label>
                  <Switch
                    id={`create-admin-${admin.id}`}
                    checked={admin.can_create_admin}
                    disabled={updating === admin.id || admin.role === "super_admin"}
                    onCheckedChange={(checked) =>
                      updatePermission(admin.id, { ...admin, can_create_admin: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor={`approve-bookings-${admin.id}`} className="flex flex-col space-y-1">
                    <span>Approve Bookings</span>
                    <span className="text-xs text-muted-foreground">
                      Can approve/reject bookings
                    </span>
                  </Label>
                  <Switch
                    id={`approve-bookings-${admin.id}`}
                    checked={admin.can_approve_bookings}
                    disabled={updating === admin.id || admin.role === "super_admin"}
                    onCheckedChange={(checked) =>
                      updatePermission(admin.id, { ...admin, can_approve_bookings: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor={`manage-rates-${admin.id}`} className="flex flex-col space-y-1">
                    <span>Manage Rates</span>
                    <span className="text-xs text-muted-foreground">
                      Can change hourly rates
                    </span>
                  </Label>
                  <Switch
                    id={`manage-rates-${admin.id}`}
                    checked={admin.can_manage_rates}
                    disabled={updating === admin.id || admin.role === "super_admin"}
                    onCheckedChange={(checked) =>
                      updatePermission(admin.id, { ...admin, can_manage_rates: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor={`active-${admin.id}`} className="flex flex-col space-y-1">
                    <span>Active Status</span>
                    <span className="text-xs text-muted-foreground">
                      Account is active
                    </span>
                  </Label>
                  <Switch
                    id={`active-${admin.id}`}
                    checked={admin.is_active}
                    disabled={updating === admin.id || admin.role === "super_admin"}
                    onCheckedChange={(checked) =>
                      updatePermission(admin.id, { ...admin, is_active: checked })
                    }
                  />
                </div>
              </div>
            </div>
          ))}

          {admins.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No admin users found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
