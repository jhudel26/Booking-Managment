import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { canAccessSuperAdmin } from "@/lib/auth/permissions";

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

  if (!canAccessSuperAdmin(profile)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: bookings } = await supabase.from("bookings").select("status, total_price");

  const stats = {
    total: bookings?.length || 0,
    pending: bookings?.filter((b) => b.status === "pending").length || 0,
    approved: bookings?.filter((b) => b.status === "approved").length || 0,
    rejected: bookings?.filter((b) => b.status === "rejected").length || 0,
    cancelled: bookings?.filter((b) => b.status === "cancelled").length || 0,
    revenue: bookings
      ?.filter((b) => b.status === "approved")
      .reduce((sum, b) => sum + Number(b.total_price), 0) || 0,
  };

  return NextResponse.json(stats);
}
