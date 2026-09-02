"use client";

import { useState, useEffect } from "react";
import { CalendarView } from "@/components/calendar/calendar-view";
import { DaySchedule } from "@/components/calendar/day-schedule";
import { BookingForm } from "@/components/booking/booking-form";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getDateString } from "@/lib/booking/time";
import type { Booking } from "@/types";
import type { BookingCreateInput } from "@/lib/validation/schemas";
import { useRouter } from "next/navigation";

export default function AdminCalendarPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(getDateString(new Date()));
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pricePerHour, setPricePerHour] = useState(200);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      setLoading(true);
      try {
        const [bookingsRes, priceRes] = await Promise.all([
          fetch("/api/bookings"),
          fetch("/api/settings/price"),
        ]);
        if (cancelled) return;
        if (bookingsRes.ok) setBookings(await bookingsRes.json());
        if (priceRes.ok) {
          const data = await priceRes.json();
          setPricePerHour(data.price_per_hour);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, []);

  const reloadData = async () => {
    const [bookingsRes, priceRes] = await Promise.all([
      fetch("/api/bookings"),
      fetch("/api/settings/price"),
    ]);
    if (bookingsRes.ok) setBookings(await bookingsRes.json());
    if (priceRes.ok) {
      const data = await priceRes.json();
      setPricePerHour(data.price_per_hour);
    }
  };

  const handleSubmit = async (data: BookingCreateInput) => {
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to create reservation");
    }

    await reloadData();
    router.push("/admin/bookings");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Rimreserve Calendar</h1>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              {loading ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <CalendarView
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                  bookings={bookings}
                />
              )}
            </CardContent>
          </Card>

          <DaySchedule date={selectedDate} bookings={bookings} loading={loading} showDetails />
        </div>

        <BookingForm
          date={selectedDate}
          pricePerHour={pricePerHour}
          onSubmit={handleSubmit}
          loading={loading}
        />
      </div>
    </div>
  );
}
