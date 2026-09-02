"use client";

import { useEffect, useState } from "react";
import { BookingTable } from "@/components/booking/booking-table";
import { BookingDetailDialog } from "@/components/booking/booking-detail-dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Booking } from "@/types";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 10;

export default function SuperAdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [page, setPage] = useState(0);

  const loadData = async () => {
    try {
      const res = await fetch("/api/bookings");
      if (res.ok) setBookings(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleAction = async (id: string, action: string, reason?: string) => {
    const res = await fetch(`/api/bookings/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason }),
    });

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error || `Failed to ${action} booking`);
      return;
    }

    toast.success(`Booking ${action}d successfully`);
    await loadData();
    setSelectedBooking(null);
  };

  let filtered = bookings.filter((b) => {
    const matchesSearch =
      !search ||
      b.requester_name.toLowerCase().includes(search.toLowerCase()) ||
      b.booking_number.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  filtered = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "date-asc":
        return a.booking_date.localeCompare(b.booking_date);
      case "date-desc":
        return b.booking_date.localeCompare(a.booking_date);
      case "total-asc":
        return a.total_price - b.total_price;
      case "total-desc":
        return b.total_price - a.total_price;
      default:
        return 0;
    }
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Rimreserve Management</h1>

      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <Input
          placeholder="Search bookings..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          className="sm:max-w-xs"
        />
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
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
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-desc">Date (Newest)</SelectItem>
            <SelectItem value="date-asc">Date (Oldest)</SelectItem>
            <SelectItem value="total-desc">Total (High)</SelectItem>
            <SelectItem value="total-asc">Total (Low)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <BookingTable
        bookings={paginated}
        onView={setSelectedBooking}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages} ({filtered.length} bookings)
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <BookingDetailDialog
        booking={selectedBooking}
        open={!!selectedBooking}
        onOpenChange={(open) => !open && setSelectedBooking(null)}
        isSuperAdmin
        onApprove={(id, reason) => handleAction(id, "approve", reason)}
        onReject={(id, reason) => handleAction(id, "reject", reason)}
        onCancel={(id, reason) => handleAction(id, "cancel", reason)}
      />
    </div>
  );
}
