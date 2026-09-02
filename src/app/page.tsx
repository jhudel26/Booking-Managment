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
import { LogIn, Circle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Circle className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Rimreserve
            </h1>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex items-center gap-4"
          >
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full border border-blue-200 dark:border-blue-800">
              <span className="text-sm text-muted-foreground">Current Rate:</span>
              <span className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {formatCurrency(pricePerHour)}/hr
              </span>
            </div>
            <ThemeToggle />
            {!isAuthenticated && (
              <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Link href="/login">
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </Link>
              </Button>
            )}
          </motion.div>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-12 space-y-12 flex-1">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-center space-y-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5, type: "spring" }}
            className="inline-block"
          >
            <h2 className="text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent animate-gradient">
              RIM|RESERVER
            </h2>
          </motion.div>
          <motion.h3
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="text-xl md:text-2xl font-semibold tracking-tight text-primary"
          >
            BASKETBALL COURT BOOKING SYSTEM
          </motion.h3>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="text-muted-foreground max-w-2xl mx-auto"
          >
            Book your court time slots with ease. View availability in real-time and manage your reservations.
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[600px] lg:min-h-[700px]"
        >
          <motion.div
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="h-full min-h-[600px] lg:min-h-[700px] border-0 shadow-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl">
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
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
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
          transition={{ delay: 1, duration: 0.5 }}
          className="text-center text-muted-foreground max-w-4xl mx-auto px-4 py-8"
        >
          <p className="text-sm md:text-base">
            View availability and see scheduled bookings. Select a date to view the daily schedule.
          </p>
        </motion.div>
      </main>

      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.5 }}
        className="border-t py-6 text-center text-sm text-muted-foreground shrink-0"
      >
        <div className="flex items-center justify-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Circle className="w-3 h-3 text-white" />
          </div>
          <p>Rimreserve &copy; {new Date().getFullYear()}</p>
        </div>
      </motion.footer>
    </div>
  );
}
