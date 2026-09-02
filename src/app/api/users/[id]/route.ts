import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { canManageUsers } from "@/lib/auth/permissions";
import { updateUserSchema } from "@/lib/validation/schemas";
import { logAudit } from "@/lib/audit";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!canManageUsers(profile)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  
  // Allow direct permission updates without full schema validation
  const allowedUpdates = [
    'is_active', 'full_name', 'role', 'is_active',
    'can_create_admin', 'can_approve_bookings', 'can_manage_rates'
  ];
  
  const updateData: Record<string, unknown> = {};
  for (const key of allowedUpdates) {
    if (key in body) {
      updateData[key] = body[key];
    }
  }

  if (updateData.role === "super_admin") {
    return NextResponse.json(
      { error: "Cannot assign Super Admin role via API" },
      { status: 403 }
    );
  }

  const serviceClient = await createServiceClient();

  const { data, error } = await serviceClient
    .from("profiles")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log permission changes
  if ('can_create_admin' in updateData || 'can_approve_bookings' in updateData || 'can_manage_rates' in updateData) {
    await logAudit("admin_permissions_updated", "profile", id, user.id, updateData);
  }

  if (updateData.is_active !== undefined) {
    await logAudit(
      updateData.is_active ? "admin_enabled" : "admin_disabled",
      "profile",
      id,
      user.id
    );
  }

  return NextResponse.json(data);
}

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!canManageUsers(profile)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: targetUser } = await (await createServiceClient())
    .from("profiles")
    .select("email")
    .eq("id", id)
    .single();

  if (!targetUser?.email) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const serviceClient = await createServiceClient();
  const { error } = await serviceClient.auth.resetPasswordForEmail(targetUser.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/login`,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit("password_reset_triggered", "profile", id, user.id);

  return NextResponse.json({ success: true });
}
