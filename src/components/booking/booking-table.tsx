"use client";

import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { formatDate, formatTimeRange } from "@/lib/booking/time";
import type { Booking } from "@/types";

interface BookingCardProps {
  booking: Booking;
  onView?: (booking: Booking) => void;
  actions?: React.ReactNode;
}

export function BookingCard({ booking, onView, actions }: BookingCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <p className="font-mono text-xs text-muted-foreground">{booking.booking_number}</p>
            <p className="font-semibold">{booking.requester_name}</p>
          </div>
          <StatusBadge status={booking.status} />
        </div>
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>{booking.booking_date ? formatDate(booking.booking_date) : "N/A"}</p>
          <p>{formatTimeRange(booking.start_time, booking.end_time)}</p>
          <p className="font-medium text-foreground">{formatCurrency(booking.total_price)}</p>
          {booking.creator && (
            <p className="text-xs">Created by: {booking.creator.full_name || booking.creator.email}</p>
          )}
        </div>
        <div className="flex gap-2 mt-3">
          {onView && (
            <Button variant="outline" size="sm" onClick={() => onView(booking)}>
              View Details
            </Button>
          )}
          {actions}
        </div>
      </CardContent>
    </Card>
  );
}

interface BookingTableProps {
  bookings: Booking[];
  onView: (booking: Booking) => void;
  actions?: (booking: Booking) => React.ReactNode;
}

export function BookingTable({ bookings, onView, actions }: BookingTableProps) {
  if (bookings.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No reservations found.
      </div>
    );
  }

  return (
    <>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-3 pr-4 font-medium">Reservation</th>
              <th className="pb-3 pr-4 font-medium">Date</th>
              <th className="pb-3 pr-4 font-medium">Time</th>
              <th className="pb-3 pr-4 font-medium">Duration</th>
              <th className="pb-3 pr-4 font-medium">Requester</th>
              <th className="pb-3 pr-4 font-medium">Total</th>
              <th className="pb-3 pr-4 font-medium">Status</th>
              <th className="pb-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id} className="border-b last:border-0">
                <td className="py-3 pr-4 font-mono text-xs">{booking.booking_number}</td>
                <td className="py-3 pr-4">{booking.booking_date ? formatDate(booking.booking_date) : "N/A"}</td>
                <td className="py-3 pr-4">{formatTimeRange(booking.start_time, booking.end_time)}</td>
                <td className="py-3 pr-4">{booking.duration_hours}h</td>
                <td className="py-3 pr-4">{booking.requester_name}</td>
                <td className="py-3 pr-4">{formatCurrency(booking.total_price)}</td>
                <td className="py-3 pr-4"><StatusBadge status={booking.status} /></td>
                <td className="py-3">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => onView(booking)}>View</Button>
                    {actions?.(booking)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {bookings.map((booking) => (
          <BookingCard
            key={booking.id}
            booking={booking}
            onView={onView}
            actions={actions?.(booking)}
          />
        ))}
      </div>
    </>
  );
}
