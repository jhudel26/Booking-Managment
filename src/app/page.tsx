"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CalendarView } from "@/components/calendar/calendar-view";
import { DaySchedule } from "@/components/calendar/day-schedule";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { getDateString } from "@/lib/booking/time";
import type { Booking } from "@/types";
import { LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState(getDateString(new Date()));
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pricePerHour, setPricePerHour] = useState(200);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Check authentication status
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        setIsAuthenticated(!!user);

        const [bookingsRes, priceRes] = await Promise.all([
          fetch("/api/bookings"),
          fetch("/api/settings/price"),
        ]);
        if (bookingsRes.ok) setBookings(await bookingsRes.json());
        if (priceRes.ok) {
          const priceData = await priceRes.json();
          setPricePerHour(priceData.price_per_hour);
        }
      } catch {
        // handled by empty states
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <h1 className="text-lg font-bold">Rimreserve</h1>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 mr-4">
              <span className="text-sm text-muted-foreground">Current Rate:</span>
              <span className="font-semibold text-primary">{formatCurrency(pricePerHour)}/hr</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8 flex-1">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">RIM|RESERVER</h2>
          <h3 className="text-xl font-semibold tracking-tight text-primary">BASKETBALL COURT BOOKING SYSTEM</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[600px] lg:min-h-[700px]">
          <Card className="h-full min-h-[600px] lg:min-h-[700px]">
            <CardContent className="p-6 h-full min-h-[600px] lg:min-h-[700px]">
              {loading ? (
                <Skeleton className="h-[600px] lg:h-[700px] w-full" />
              ) : (
                <CalendarView
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                  bookings={bookings}
                />
              )}
            </CardContent>
          </Card>

          <DaySchedule
            date={selectedDate}
            bookings={bookings}
            loading={loading}
          />
        </div>

        <div className="text-center text-muted-foreground max-w-4xl mx-auto px-4">
          <p className="text-xs sm:text-sm md:text-base whitespace-nowrap">
            View availability and see scheduled bookings. Select a date to view the daily schedule.
          </p>
        </div>
      </main>

      <footer className="border-t py-3 text-center text-sm text-muted-foreground shrink-0">
        <p>Rimreserve &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
