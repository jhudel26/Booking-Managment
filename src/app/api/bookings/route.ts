import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { bookingCreateSchema } from "@/lib/validation/schemas";
import { calculateTotalPrice, getBookingDuration, hasConflict, generateBookingNumber } from "@/lib/booking/pricing";
import { canCreateBooking } from "@/lib/auth/permissions";
import { logAudit } from "@/lib/audit";
import type { Booking } from "@/types";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const status = searchParams.get("status");
  const mine = searchParams.get("mine") === "true";

  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from("bookings")
    .select("*, creator:profiles!bookings_created_by_fkey(*), approver:profiles!bookings_approved_by_fkey(*)")
    .order("booking_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (date) query = query.eq("booking_date", date);
  if (status) query = query.eq("status", status);
  if (mine && user) query = query.eq("created_by", user.id);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
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

  if (!canCreateBooking(profile)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = bookingCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const serviceClient = await createServiceClient();

  const { data: priceSetting } = await serviceClient
    .from("system_settings")
    .select("setting_value")
    .eq("setting_key", "rimreserve_price_per_hour")
    .single();

  const pricePerHour = parseFloat(priceSetting?.setting_value || "200");
  const duration = getBookingDuration(parsed.data.start_time, parsed.data.end_time);
  const totalPrice = calculateTotalPrice(duration, pricePerHour);

  const { data: existingBookings } = await serviceClient
    .from("bookings")
    .select("*")
    .eq("booking_date", parsed.data.booking_date)
    .in("status", ["pending", "approved"]);

  if (hasConflict(
    (existingBookings as Booking[]) || [],
    parsed.data.booking_date,
    parsed.data.start_time,
    parsed.data.end_time
  )) {
    return NextResponse.json(
      { error: "This time slot conflicts with an existing reservation" },
      { status: 409 }
    );
  }

  const { count } = await serviceClient
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("booking_date", parsed.data.booking_date);

  const bookingNumber = generateBookingNumber(parsed.data.booking_date, (count || 0) + 1);

  const { data: booking, error } = await serviceClient
    .from("bookings")
    .insert({
      booking_number: bookingNumber,
      booking_date: parsed.data.booking_date,
      start_time: parsed.data.start_time,
      end_time: parsed.data.end_time,
      duration_hours: duration,
      price_per_hour: pricePerHour,
      total_price: totalPrice,
      requester_name: parsed.data.requester_name,
      requester_contact: parsed.data.requester_contact || "",
      purpose: parsed.data.purpose || "",
      notes: parsed.data.notes || "",
      status: "pending",
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    if (error.message.includes("conflict")) {
      return NextResponse.json(
        { error: "This time slot conflicts with an existing reservation" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit("reservation_created", "reservation", booking.id, user.id, {
    booking_number: bookingNumber,
    date: parsed.data.booking_date,
  });

  return NextResponse.json(booking, { status: 201 });
}
