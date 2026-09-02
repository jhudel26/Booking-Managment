"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientOnly } from "@/components/ui/client-only";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getCalendarGrid, getDateString } from "@/lib/booking/time";
import { format } from "date-fns";
import type { Booking } from "@/types";

interface CalendarViewProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
  bookings?: Booking[];
  view?: "month" | "week" | "day";
}

export function CalendarView({
  selectedDate,
  onDateSelect,
  bookings = [],
  view = "month",
}: CalendarViewProps) {
  const selected = new Date(selectedDate + "T00:00:00");
  const [currentMonth, setCurrentMonth] = useState(
    new Date(selected.getFullYear(), selected.getMonth(), 1)
  );

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const grid = getCalendarGrid(year, month);

  const bookingsByDate = useMemo(() => {
    const map = new Map<string, Booking[]>();
    bookings.forEach((b) => {
      const existing = map.get(b.booking_date) || [];
      existing.push(b);
      map.set(b.booking_date, existing);
    });
    return map;
  }, [bookings]);

  const goToday = () => {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    onDateSelect(getDateString(today));
  };

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const getDateIndicators = (dateStr: string) => {
    const dayBookings = bookingsByDate.get(dateStr) || [];
    const hasApproved = dayBookings.some((b) => b.status === "approved");
    const hasPending = dayBookings.some((b) => b.status === "pending");
    return { hasApproved, hasPending, count: dayBookings.length };
  };

  if (view === "day") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{format(selected, "MMMM d, yyyy")}</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={goToday}>Today</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ClientOnly fallback={<Skeleton className="h-80 w-full" />}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{format(currentMonth, "MMMM yyyy")}</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToday}>Today</Button>
            <Button variant="outline" size="icon" onClick={prevMonth} aria-label="Previous month">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth} aria-label="Next month">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div key={day} className="p-2 text-center text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}
          {grid.map((date, i) => {
            if (!date) return <div key={`empty-${i}`} className="p-2" />;
            const dateStr = getDateString(date);
            const isSelected = dateStr === selectedDate;
            const isToday = dateStr === getDateString(new Date());
            const indicators = getDateIndicators(dateStr);

            return (
              <button
                key={dateStr}
                onClick={() => onDateSelect(dateStr)}
                className={cn(
                  "relative flex flex-col items-center justify-center rounded-lg p-2 text-sm transition-colors min-h-[5rem]",
                  isSelected && "bg-primary text-primary-foreground",
                  !isSelected && "hover:bg-accent",
                  isToday && !isSelected && "ring-2 ring-primary/50"
                )}
                aria-label={`${format(date, "MMMM d, yyyy")}${indicators.count ? `, ${indicators.count} bookings` : ""}`}
                aria-pressed={isSelected}
              >
                <span className="font-medium">{date.getDate()}</span>
                {indicators.count > 0 && (
                  <div className="flex gap-0.5 mt-1">
                    {indicators.hasApproved && (
                      <span className={cn("h-1.5 w-1.5 rounded-full", isSelected ? "bg-primary-foreground" : "bg-emerald-500")} aria-hidden />
                    )}
                    {indicators.hasPending && (
                      <span className={cn("h-1.5 w-1.5 rounded-full", isSelected ? "bg-primary-foreground/70" : "bg-amber-500")} aria-hidden />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </ClientOnly>
    </div>
  );
}
