import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { canAccessSuperAdmin, canApproveBooking } from "@/lib/auth/permissions";
import { logAudit } from "@/lib/audit";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bookings")
    .select("*, creator:profiles!bookings_created_by_fkey(*), approver:profiles!bookings_approved_by_fkey(*)")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json(data);
}

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

  if (!canApproveBooking(profile)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const serviceClient = await createServiceClient();

  const { data, error } = await serviceClient
    .from("bookings")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit("reservation_edited", "reservation", id, user.id, body);

  return NextResponse.json(data);
}

async function handleBookingAction(
  id: string,
  action: "approved" | "rejected" | "cancelled",
  reason?: string
) {
  console.log("=== Booking Action Start ===");
  console.log("Action:", action, "ID:", id, "Reason:", reason);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  console.log("User:", user?.id);

  if (!user) {
    console.log("No user found");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  console.log("Profile:", profile);
  console.log("Profile error:", profileError);

  if (profileError || !profile) {
    console.log("Profile fetch failed");
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }

  const canApprove = canApproveBooking(profile);
  console.log("Can approve booking:", canApprove);

  if (!canApprove) {
    console.log("Permission denied");
    return NextResponse.json({ error: "Forbidden - You don't have permission to approve bookings" }, { status: 403 });
  }

  const now = new Date().toISOString();

  const updateData: Record<string, unknown> = {
    status: action,
    notes: reason || undefined,
  };

  if (action === "approved") {
    updateData.approved_by = user.id;
    updateData.approved_at = now;
  } else if (action === "rejected") {
    updateData.rejected_at = now;
    updateData.approved_by = user.id;
  } else if (action === "cancelled") {
    updateData.cancelled_at = now;
  }

  console.log("Update data:", updateData);

  const { data, error } = await supabase
    .from("bookings")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  console.log("Update result:", { data, error });

  if (error) {
    console.log("Update error:", error);
    if (error.message.includes("conflict")) {
      return NextResponse.json(
        { error: "Cannot approve: time slot conflicts with another reservation" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message, details: error }, { status: 500 });
  }

  await logAudit(`reservation_${action}`, "reservation", id, user.id, { reason });
  console.log("=== Booking Action Success ===");
  return NextResponse.json(data);
}

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json();
  const { action, reason } = body;

  if (!["approve", "reject", "cancel"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const statusMap = {
    approve: "approved" as const,
    reject: "rejected" as const,
    cancel: "cancelled" as const,
  };

  return handleBookingAction(id, statusMap[action as keyof typeof statusMap], reason);
}
