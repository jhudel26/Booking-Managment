"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createAdminSchema, type CreateAdminInput } from "@/lib/validation/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientOnly } from "@/components/ui/client-only";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ROLE_LABELS, type Profile } from "@/types";
import { formatDate } from "@/lib/booking/time";
import { toast } from "sonner";
import { Plus, UserX, UserCheck, KeyRound, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [canGrantPermissions, setCanGrantPermissions] = useState(false);

  const form = useForm<CreateAdminInput>({
    resolver: zodResolver(createAdminSchema),
    defaultValues: {
      email: "",
      password: "",
      full_name: "",
      role: "admin",
    },
  });

  useEffect(() => {
    loadUsers();
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("can_grant_admin_permissions")
          .eq("id", user.id)
          .single();
        if (profile) {
          setCanGrantPermissions(profile.can_grant_admin_permissions || false);
        }
      }
    } catch (error) {
      console.error("Failed to check permissions:", error);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to load users");
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: CreateAdminInput) => {
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create admin");
      toast.success("Admin created successfully");
      setIsDialogOpen(false);
      form.reset();
      await loadUsers();
    } catch (error) {
      toast.error("Failed to create admin");
    }
  };

  const resetPassword = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}/reset-password`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to reset password");
      const data = await res.json();
      toast.success(`Password reset to: ${data.newPassword}`);
    } catch (error) {
      toast.error("Failed to reset password");
    }
  };

  const toggleActive = async (user: Profile) => {
    const previousUsers = [...users];
    setUsers(users.map(u => u.id === user.id ? { ...u, is_active: !user.is_active } : u));

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !user.is_active }),
      });
      if (!res.ok) {
        throw new Error("Failed to update user");
      }
      toast.success(user.is_active ? "User disabled" : "User enabled");
    } catch (error) {
      toast.error("Failed to update user");
      setUsers(previousUsers);
    }
  };

  const togglePermission = async (user: Profile, permission: string, value: boolean) => {
    const previousUsers = [...users];
    setUsers(users.map(u => u.id === user.id ? { ...u, [permission]: value } : u));

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [permission]: value }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update permission");
      }
      toast.success("Permission updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update permission");
      setUsers(previousUsers);
    }
  };

  if (!canGrantPermissions) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Manage Users</h1>
          <p className="text-muted-foreground">You don't have permission to manage admin users</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Users</h1>
          <p className="text-muted-foreground">Create and manage admin accounts</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Admin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Admin</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  {...form.register("full_name")}
                  placeholder="John Doe"
                />
                {form.formState.errors.full_name && (
                  <p className="text-sm text-destructive">{form.formState.errors.full_name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  placeholder="admin@example.com"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...form.register("password")}
                  placeholder="••••••••"
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full">
                Create Admin
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <ClientOnly fallback={<Skeleton className="h-64 w-full" />}>
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No admin users found
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {users
              .filter(user => user.role !== "super_admin" && user.id !== currentUserId)
              .map((user) => (
              <Card key={user.id}>
                <CardContent className="p-4 flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{user.full_name || user.email}</p>
                        <Badge variant="secondary">{ROLE_LABELS[user.role]}</Badge>
                        {!user.is_active && <Badge variant="destructive">Disabled</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Created {user.created_at ? formatDate(user.created_at) : "N/A"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActive(user)}
                      >
                        {user.is_active ? (
                          <><UserX className="h-4 w-4 mr-1" /> Disable</>
                        ) : (
                          <><UserCheck className="h-4 w-4 mr-1" /> Enable</>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resetPassword(user.id)}
                      >
                        <KeyRound className="h-4 w-4 mr-1" /> Reset Password
                      </Button>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Admin Permissions</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <Label htmlFor={`create-admin-${user.id}`} className="text-sm cursor-pointer">
                          Create Admin
                        </Label>
                        <Switch
                          id={`create-admin-${user.id}`}
                          checked={user.can_create_admin || false}
                          onCheckedChange={(checked) => togglePermission(user, 'can_create_admin', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <Label htmlFor={`approve-bookings-${user.id}`} className="text-sm cursor-pointer">
                          Approve Bookings
                        </Label>
                        <Switch
                          id={`approve-bookings-${user.id}`}
                          checked={user.can_approve_bookings || false}
                          onCheckedChange={(checked) => togglePermission(user, 'can_approve_bookings', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <Label htmlFor={`manage-rates-${user.id}`} className="text-sm cursor-pointer">
                          Manage Rates
                        </Label>
                        <Switch
                          id={`manage-rates-${user.id}`}
                          checked={user.can_manage_rates || false}
                          onCheckedChange={(checked) => togglePermission(user, 'can_manage_rates', checked)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ClientOnly>
    </div>
  );
}
