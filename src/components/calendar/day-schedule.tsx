"use client";

import { StatusBadge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { buildDaySchedule } from "@/lib/booking/pricing";
import { formatDate, formatTimeRange } from "@/lib/booking/time";
import type { Booking } from "@/types";

interface DayScheduleProps {
  date: string;
  bookings: Booking[];
  loading?: boolean;
  showDetails?: boolean;
}

export function DaySchedule({ date, bookings, loading, showDetails }: DayScheduleProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const schedule = buildDaySchedule(bookings, date);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{formatDate(date)}</CardTitle>
        <p className="text-sm text-muted-foreground">Today&apos;s Schedule</p>
      </CardHeader>
      <CardContent>
        {schedule.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No schedule data available.
          </p>
        ) : (
          <div className="space-y-2" role="list" aria-label="Daily schedule">
            {schedule.map((slot, i) => (
              <div
                key={`${slot.start}-${slot.end}-${i}`}
                role="listitem"
                className="flex items-center justify-between rounded-lg border p-3 gap-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm">
                    {formatTimeRange(slot.start, slot.end)}
                  </p>
                  {showDetails && slot.booking && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {slot.booking.requester_name}
                      {slot.booking.purpose && ` — ${slot.booking.purpose}`}
                    </p>
                  )}
                </div>
                <StatusBadge status={slot.status} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
