import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export async function GET() {
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

  // Only super admin or admins with can_grant_admin_permissions can view permissions
  if (!profile || (profile.role !== "super_admin" && !profile.can_grant_admin_permissions)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const serviceClient = await createServiceClient();
  const { data, error } = await serviceClient
    .from("profiles")
    .select("id, full_name, email, role, is_active, can_create_admin, can_approve_bookings, can_manage_rates, can_grant_admin_permissions")
    .in("role", ["admin", "super_admin"])
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
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

  // Only super admin or admins with can_grant_admin_permissions can update permissions
  if (!profile || (profile.role !== "super_admin" && !profile.can_grant_admin_permissions)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { targetUserId, permissions } = body;

  if (!targetUserId || !permissions) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const serviceClient = await createServiceClient();

  // Get target user's current profile
  const { data: targetProfile, error: fetchError } = await serviceClient
    .from("profiles")
    .select("role, can_grant_admin_permissions")
    .eq("id", targetUserId)
    .single();

  if (fetchError || !targetProfile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Non-super admins cannot grant can_grant_admin_permissions to anyone
  if (profile.role !== "super_admin" && permissions.can_grant_admin_permissions === true) {
    return NextResponse.json({ error: "Cannot grant admin management permission" }, { status: 403 });
  }

  // Non-super admins cannot modify super admin permissions
  if (profile.role !== "super_admin" && targetProfile.role === "super_admin") {
    return NextResponse.json({ error: "Cannot modify super admin permissions" }, { status: 403 });
  }

  // Update permissions
  const { data, error } = await serviceClient
    .from("profiles")
    .update({
      can_create_admin: permissions.can_create_admin,
      can_approve_bookings: permissions.can_approve_bookings,
      can_manage_rates: permissions.can_manage_rates,
      can_grant_admin_permissions: profile.role === "super_admin" ? permissions.can_grant_admin_permissions : targetProfile.can_grant_admin_permissions,
      is_active: permissions.is_active,
    })
    .eq("id", targetUserId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit("admin_permissions_updated", "profile", targetUserId, user.id, {
    permissions,
  });

  return NextResponse.json(data);
}
