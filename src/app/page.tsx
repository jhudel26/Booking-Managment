"use client";

import { useState, useEffect } from "react";
import { CalendarView } from "@/components/calendar/calendar-view";
import { DaySchedule } from "@/components/calendar/day-schedule";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { getDateString } from "@/lib/booking/time";
import type { Booking } from "@/types";
import { Circle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState(getDateString(new Date()));
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pricePerHour, setPricePerHour] = useState(200);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
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
      <motion.header
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="flex items-center gap-3"
          >
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Circle className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-bold">
              Rimreserve
            </h1>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="flex items-center gap-3"
          >
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md">
              <span className="text-sm text-muted-foreground">Current Rate:</span>
              <span className="font-semibold text-foreground">
                {formatCurrency(pricePerHour)}/hr
              </span>
            </div>
            <ThemeToggle />
          </motion.div>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-8 space-y-8 flex-1">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="text-center space-y-3"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className="inline-block"
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              RIM|RESERVER
            </h2>
          </motion.div>
          <motion.h3
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
            className="text-lg md:text-xl font-semibold text-primary"
          >
            BASKETBALL COURT BOOKING SYSTEM
          </motion.h3>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[600px] lg:min-h-[700px]"
        >
          <motion.div
            whileHover={{ scale: 1.005 }}
            transition={{ duration: 0.15 }}
          >
            <Card className="h-full min-h-[600px] lg:min-h-[700px] border shadow-sm">
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
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.005 }}
            transition={{ duration: 0.15 }}
          >
            <DaySchedule
              date={selectedDate}
              bookings={bookings}
              loading={loading}
            />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.3 }}
          className="text-center text-muted-foreground max-w-4xl mx-auto px-4 py-6"
        >
          <p className="text-sm md:text-base">
            View availability and see scheduled bookings. Select a date to view the daily schedule.
          </p>
        </motion.div>
      </main>

      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.3 }}
        className="border-t py-4 text-center text-sm text-muted-foreground shrink-0"
      >
        <div className="flex items-center justify-center gap-2">
          <div className="w-5 h-5 bg-primary rounded flex items-center justify-center">
            <Circle className="w-2.5 h-2.5 text-primary-foreground" />
          </div>
          <p>Rimreserve &copy; {new Date().getFullYear()}</p>
        </div>
      </motion.footer>
    </div>
  );
}
