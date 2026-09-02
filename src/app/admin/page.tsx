"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatCard } from "@/components/dashboard/stat-card";
import { BookingTable } from "@/components/booking/booking-table";
import { BookingDetailDialog } from "@/components/booking/booking-detail-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Booking } from "@/types";
import { Calendar } from "lucide-react";

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/bookings?mine=true");
        if (res.ok) setBookings(await res.json());
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const pending = bookings.filter((b) => b.status === "pending").length;
  const approved = bookings.filter((b) => b.status === "approved").length;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Rimreserve</h1>
        <Button asChild>
          <Link href="/admin/calendar">
            <Calendar className="h-4 w-4 mr-2" />
            New Reservation
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="My Reservations" value={bookings.length} />
        <StatCard title="Pending" value={pending} />
        <StatCard title="Approved" value={approved} />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Reservations</h2>
        <BookingTable
          bookings={bookings.slice(0, 10)}
          onView={setSelectedBooking}
        />
      </div>

      <BookingDetailDialog
        booking={selectedBooking}
        open={!!selectedBooking}
        onOpenChange={(open) => !open && setSelectedBooking(null)}
      />
    </div>
  );
}
