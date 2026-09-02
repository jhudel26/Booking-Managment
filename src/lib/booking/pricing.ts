import type { Booking, BookingStatus, TimeSlot } from "@/types";
import { calculateDurationHours, datesOverlap, minutesToTime, timeToMinutes } from "./time";

export function calculateTotalPrice(durationHours: number, pricePerHour: number): number {
  return Math.round(durationHours * pricePerHour * 100) / 100;
}

export function hasConflict(
  bookings: Booking[],
  date: string,
  startTime: string,
  endTime: string,
  excludeId?: string
): boolean {
  const blockingStatuses: BookingStatus[] = ["pending", "approved"];
  return bookings.some(
    (b) =>
      b.booking_date === date &&
      blockingStatuses.includes(b.status) &&
      b.id !== excludeId &&
      datesOverlap(b.start_time, b.end_time, startTime, endTime)
  );
}

export function buildDaySchedule(
  bookings: Booking[],
  date: string,
  dayStart = "06:00",
  dayEnd = "22:00",
  slotMinutes = 60
): TimeSlot[] {
  const dayBookings = bookings.filter(
    (b) =>
      b.booking_date === date &&
      (b.status === "pending" || b.status === "approved")
  );

  const slots: TimeSlot[] = [];
  let current = timeToMinutes(dayStart);
  const end = timeToMinutes(dayEnd);

  while (current < end) {
    const slotEnd = Math.min(current + slotMinutes, end);
    const start = minutesToTime(current);
    const slotEndTime = minutesToTime(slotEnd);

    const overlapping = dayBookings.find((b) =>
      datesOverlap(b.start_time, b.end_time, start, slotEndTime)
    );

    if (overlapping) {
      const bookingEnd = timeToMinutes(overlapping.end_time);
      slots.push({
        start: overlapping.start_time.slice(0, 5),
        end: overlapping.end_time.slice(0, 5),
        status: overlapping.status,
        booking: overlapping,
      });
      current = bookingEnd;
    } else {
      slots.push({ start, end: slotEndTime, status: "available" });
      current = slotEnd;
    }
  }

  return mergeAdjacentSlots(slots);
}

function mergeAdjacentSlots(slots: TimeSlot[]): TimeSlot[] {
  if (slots.length === 0) return slots;
  const merged: TimeSlot[] = [slots[0]];

  for (let i = 1; i < slots.length; i++) {
    const prev = merged[merged.length - 1];
    const curr = slots[i];
    if (prev.status === curr.status && prev.end === curr.start && !prev.booking && !curr.booking) {
      prev.end = curr.end;
    } else {
      merged.push(curr);
    }
  }
  return merged;
}

export function getBookingDuration(start: string, end: string): number {
  return calculateDurationHours(start, end);
}

export function generateBookingNumber(date: string, sequence: number): string {
  const dateStr = date.replace(/-/g, "");
  return `BK-${dateStr}-${String(sequence).padStart(3, "0")}`;
}
