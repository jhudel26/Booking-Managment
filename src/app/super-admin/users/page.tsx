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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ROLE_LABELS, type Profile } from "@/types";
import { formatDate } from "@/lib/booking/time";
import { toast } from "sonner";
import { Plus, UserX, UserCheck, KeyRound } from "lucide-react";

export default function UsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateAdminInput>({
    resolver: zodResolver(createAdminSchema),
    defaultValues: { role: "admin" },
  });

  const loadUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        setUsers(await res.json());
      } else {
        console.error("Failed to load users:", res.status);
        toast.error("Failed to load users");
      }
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const onCreate = async (data: CreateAdminInput) => {
    setCreating(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create user");
      }
      toast.success("Admin user created successfully");
      reset();
      setDialogOpen(false);
      await loadUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (user: Profile) => {
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !user.is_active }),
    });
    if (!res.ok) {
      toast.error("Failed to update user");
      return;
    }
    toast.success(user.is_active ? "User disabled" : "User enabled");
    await loadUsers();
  };

  const resetPassword = async (userId: string) => {
    const res = await fetch(`/api/users/${userId}`, { method: "POST" });
    if (!res.ok) {
      toast.error("Failed to send reset email");
      return;
    }
    toast.success("Password reset email sent");
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Admin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Admin User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input id="full_name" {...register("full_name")} />
                {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register("email")} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" {...register("password")} />
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? "Creating..." : "Create Admin"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        <ClientOnly fallback={<Skeleton className="h-64 w-full" />}>
          {users.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No admin users found.</p>
          ) : (
            users.map((user) => (
              <Card key={user.id}>
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                    {user.role !== "super_admin" && (
                      <>
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
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </ClientOnly>
      </div>
    </div>
  );
}
