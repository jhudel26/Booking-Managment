import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { canAccessSuperAdmin } from "@/lib/auth/permissions";
import * as XLSX from "xlsx";

export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  let query = supabase
    .from("bookings")
    .select("*, creator:profiles!bookings_created_by_fkey(*), approver:profiles!bookings_approved_by_fkey(*)")
    .order("booking_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (startDate) query = query.gte("booking_date", startDate);
  if (endDate) query = query.lte("booking_date", endDate);
  if (status) query = query.eq("status", status);

  const { data: bookings, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Filter by search term if provided
  let filteredBookings = bookings;
  if (search) {
    const searchLower = search.toLowerCase();
    filteredBookings = bookings.filter((booking: any) =>
      booking.requester_name.toLowerCase().includes(searchLower) ||
      booking.booking_number.toLowerCase().includes(searchLower)
    );
  }

  // Transform data for Excel export
  const excelData = filteredBookings.map((booking: any) => ({
    "Reservation Number": booking.booking_number,
    "Date": booking.booking_date,
    "Start Time": booking.start_time,
    "End Time": booking.end_time,
    "Duration (hours)": booking.duration_hours,
    "Price per Hour": booking.price_per_hour,
    "Total Price": booking.total_price,
    "Requester Name": booking.requester_name,
    "Contact": booking.requester_contact,
    "Purpose": booking.purpose,
    "Notes": booking.notes,
    "Status": booking.status,
    "Created By": booking.creator?.full_name || booking.creator?.email,
    "Approved By": booking.approver?.full_name || booking.approver?.email,
    "Created At": booking.created_at,
    "Approved At": booking.approved_at,
  }));

  // Create workbook
  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Reservations");

  // Generate buffer
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  // Return file
  return new NextResponse(new Uint8Array(buffer as Buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="rimreserve-reservations-${new Date().toISOString().split('T')[0]}.xlsx"`,
    },
  });
}
