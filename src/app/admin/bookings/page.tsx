"use client";

import { useEffect, useState } from "react";
import { BookingTable } from "@/components/booking/booking-table";
import { BookingDetailDialog } from "@/components/booking/booking-detail-dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ContentLoader } from "@/components/ui/content-loader";
import type { Booking, Profile } from "@/types";

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const profileRes = await fetch("/api/profile");
        if (profileRes.ok) setProfile(await profileRes.json());
        
        const bookingsRes = await fetch("/api/bookings?mine=true");
        if (bookingsRes.ok) setBookings(await bookingsRes.json());
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = bookings.filter((b) => {
    const matchesSearch =
      !search ||
      b.requester_name.toLowerCase().includes(search.toLowerCase()) ||
      b.booking_number.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleApprove = async (id: string, reason?: string) => {
    const res = await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "approved", reason }),
    });
    if (res.ok) {
      setSelectedBooking(null);
      const bookingsRes = await fetch("/api/bookings?mine=true");
      if (bookingsRes.ok) setBookings(await bookingsRes.json());
    }
  };

  const handleReject = async (id: string, reason?: string) => {
    const res = await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "rejected", reason }),
    });
    if (res.ok) {
      setSelectedBooking(null);
      const bookingsRes = await fetch("/api/bookings?mine=true");
      if (bookingsRes.ok) setBookings(await bookingsRes.json());
    }
  };

  const handleCancel = async (id: string, reason?: string) => {
    const res = await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled", reason }),
    });
    if (res.ok) {
      setSelectedBooking(null);
      const bookingsRes = await fetch("/api/bookings?mine=true");
      if (bookingsRes.ok) setBookings(await bookingsRes.json());
    }
  };

  if (loading) {
    return <ContentLoader label="Loading your reservations..." size="md" />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Bookings</h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search bookings..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <BookingTable bookings={filtered} onView={setSelectedBooking} />

      <BookingDetailDialog
        booking={selectedBooking}
        open={!!selectedBooking}
        onOpenChange={(open) => !open && setSelectedBooking(null)}
        canApprove={profile?.can_approve_bookings || false}
        onApprove={handleApprove}
        onReject={handleReject}
        onCancel={handleCancel}
      />
    </div>
  );
}
