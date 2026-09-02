"use client";

import { useState, useEffect } from "react";
import { CalendarView } from "@/components/calendar/calendar-view";
import { DaySchedule } from "@/components/calendar/day-schedule";
import { BookingForm } from "@/components/booking/booking-form";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { getDateString } from "@/lib/booking/time";
import type { Booking } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { bookingCreateSchema, type BookingCreateInput } from "@/lib/validation/schemas";

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState(getDateString(new Date()));
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pricePerHour, setPricePerHour] = useState(200);
  const [loading, setLoading] = useState(true);
  const [showBookingForm, setShowBookingForm] = useState(false);

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

  const handleBookingSubmit = async (data: BookingCreateInput) => {
    const res = await fetch("/api/bookings/public", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to submit booking");
    }

    // Reload bookings to check for conflicts
    const bookingsRes = await fetch("/api/bookings");
    if (bookingsRes.ok) setBookings(await bookingsRes.json());
    
    // Close the form and show DaySchedule
    setShowBookingForm(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(/background.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(8px)',
          opacity: 0.3,
        }}
      />
      <motion.header
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative"
      >
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="flex items-center gap-3"
          >
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
            <Button onClick={() => setShowBookingForm(!showBookingForm)}>
              {showBookingForm ? "Close" : "Book a Slot"}
            </Button>
            <ThemeToggle />
          </motion.div>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-8 space-y-8 flex-1 relative z-10 pb-30">
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
              RIM|RESERVE
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
            className="relative min-h-[600px] lg:min-h-[700px]"
          >
            <AnimatePresence mode="wait">
              {showBookingForm ? (
                <motion.div
                  key="booking-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0"
                >
                  <BookingForm
                    date={selectedDate}
                    pricePerHour={pricePerHour}
                    onSubmit={handleBookingSubmit}
                    loading={loading}
                    isPublic={true}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="day-schedule"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0"
                >
                  <DaySchedule
                    date={selectedDate}
                    bookings={bookings}
                    loading={loading}
                  />
                </motion.div>
              )}
            </AnimatePresence>
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
        className="border-t py-4 text-sm text-muted-foreground shrink-0 relative z-10"
      >
        <div className="container mx-auto px-4 flex justify-between items-center">
          <a 
            href="https://jhudel.vercel.app/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Developed by Jhudel
          </a>
          <div className="text-center text-xs">
            <a 
              href="https://www.google.com/maps/place/St.+Joseph+Village+4/@14.2892728,121.1355264,7a,75y,173.16h,81.31t/data=!3m7!1e1!3m5!1sQJ3BNUrPwdVRwCqskZqxDw!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D8.691826304126067%26panoid%3DQJ3BNUrPwdVRwCqskZqxDw%26yaw%3D173.15925240632416!7i16384!8i8192!4m10!1m2!2m1!1s+ST.+JOSEPH+VILLAGE+6+PHASE+4+HOMEOWNERS+ASSOCIATION,+INC+Blk.+3+Lot+25,+Phase+4,+Saint+Joseph+Village+6,+Brgy.+Marinig+Cabuyao+City,+Laguna!3m6!1s0x3397d8faa34bba17:0xe53caa604e13eda3!8m2!3d14.28926!4d121.1355322!15sCosBU1QuIEpPU0VQSCBWSUxMQUdFIDYgUEhBU0UgNCBIT01FT1dORVJTIEFTU09DSUFUSU9OLCBJTkMgQmxrLiAzIExvdCAyNSwgUGhhc2UgNCwgU2FpbnQgSm9zZXBoIFZpbGxhZ2UgNiwgQnJneS4gTWFyaW5pZyBDYWJ1eWFvIENpdHksIExhZ3VuYZIBE2hvdXNpbmdfZGV2ZWxvcG1lbnTgAQA!16s%2Fg%2F1pp2tvth5?entry=ttu&g_ep=EgoyMDI2MDgzMC4wIKXMDSoASAFQAw%3D%3D"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold hover:text-foreground transition-colors"
            >
              ST. JOSEPH VILLAGE 6 PHASE 4 HOMEOWNERS ASSOCIATION, INC.
            </a>
          </div>
          <p>Rimreserve &copy; {new Date().getFullYear()}</p>
        </div>
      </motion.footer>
    </div>
  );
}
