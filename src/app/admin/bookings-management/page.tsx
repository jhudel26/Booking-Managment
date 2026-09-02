"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BookingDetailDialog } from "@/components/booking/booking-detail-dialog";
import { ClientOnly } from "@/components/ui/client-only";
import { STATUS_LABELS, type Booking } from "@/types";
import { formatDate, formatTimeRange } from "@/lib/booking/time";
import { Filter, Download } from "lucide-react";

export default function AdminBookingsManagementPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected" | "cancelled">("all");

  useEffect(() => {
    loadBookings();
  }, [filter]);

  const loadBookings = async () => {
    try {
      const url = filter === "all" 
        ? "/api/bookings" 
        : `/api/bookings?status=${filter}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load bookings");
      const data = await res.json();
      setBookings(data);
    } catch (error) {
      console.error("Failed to load bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await fetch("/api/bookings/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: filter === "all" ? undefined : filter }),
      });
      if (!res.ok) throw new Error("Failed to export bookings");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rimreserve-reservations-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to export bookings:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Bookings</h1>
          <p className="text-muted-foreground">Approve or reject reservation requests</p>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Excel
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All
        </Button>
        <Button
          variant={filter === "pending" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("pending")}
        >
          Pending
        </Button>
        <Button
          variant={filter === "approved" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("approved")}
        >
          Approved
        </Button>
        <Button
          variant={filter === "rejected" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("rejected")}
        >
          Rejected
        </Button>
        <Button
          variant={filter === "cancelled" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("cancelled")}
        >
          Cancelled
        </Button>
      </div>

      <ClientOnly fallback={<Skeleton className="h-64 w-full" />}>
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No bookings found
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {bookings.map((booking) => (
              <Card key={booking.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-mono text-xs text-muted-foreground">{booking.booking_number}</p>
                      <p className="font-semibold">{booking.requester_name}</p>
                    </div>
                    <Badge variant="secondary">{STATUS_LABELS[booking.status]}</Badge>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>{booking.booking_date ? formatDate(booking.booking_date) : "N/A"}</p>
                    <p>{formatTimeRange(booking.start_time, booking.end_time)}</p>
                    <p className="font-medium text-foreground">
                      ₱{booking.total_price?.toLocaleString() || "0"}
                    </p>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedBooking(booking)}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ClientOnly>

      {selectedBooking && (
        <BookingDetailDialog
          booking={selectedBooking}
          open={!!selectedBooking}
          onOpenChange={(open) => !open && setSelectedBooking(null)}
          onApprove={async (id, reason) => {
            const res = await fetch(`/api/bookings/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "approved", reason }),
            });
            if (res.ok) {
              setSelectedBooking(null);
              await loadBookings();
            }
          }}
          onReject={async (id, reason) => {
            const res = await fetch(`/api/bookings/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "rejected", reason }),
            });
            if (res.ok) {
              setSelectedBooking(null);
              await loadBookings();
            }
          }}
          onCancel={async (id, reason) => {
            const res = await fetch(`/api/bookings/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "cancelled", reason }),
            });
            if (res.ok) {
              setSelectedBooking(null);
              await loadBookings();
            }
          }}
        />
      )}
    </div>
  );
}
