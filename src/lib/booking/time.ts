import { format, parse } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { APP_TIMEZONE } from "@/types";

export function toManilaTime(date: Date | string): Date {
  return toZonedTime(typeof date === "string" ? new Date(date) : date, APP_TIMEZONE);
}

export function fromManilaTime(date: Date): Date {
  return fromZonedTime(date, APP_TIMEZONE);
}

export function formatDate(date: string | Date | null | undefined, pattern = "MMMM d, yyyy"): string {
  if (!date) return "N/A";
  
  let d: Date;
  if (typeof date === "string") {
    // Try parsing as ISO date first, then as yyyy-MM-dd
    const isoDate = new Date(date);
    if (!isNaN(isoDate.getTime())) {
      d = isoDate;
    } else {
      d = parse(date, "yyyy-MM-dd", new Date());
    }
  } else {
    d = date;
  }
  
  // Handle invalid dates
  if (isNaN(d.getTime())) return "Invalid Date";
  
  return format(toManilaTime(d), pattern);
}

export function formatTime(time: string | null | undefined): string {
  if (!time) return "N/A";
  
  try {
    const parsed = parse(time.slice(0, 5), "HH:mm", new Date());
    if (isNaN(parsed.getTime())) return "Invalid Time";
    return format(parsed, "hh:mm a");
  } catch {
    return "Invalid Time";
  }
}

export function formatTimeRange(start: string | null | undefined, end: string | null | undefined): string {
  return `${formatTime(start)} - ${formatTime(end)}`;
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function calculateDurationHours(start: string, end: string): number {
  const diff = timeToMinutes(end) - timeToMinutes(start);
  return Math.round((diff / 60) * 100) / 100;
}

export function generateTimeOptions(
  startHour = 6,
  endHour = 22,
  intervalMinutes = 30
): string[] {
  const options: string[] = [];
  for (let h = startHour; h <= endHour; h++) {
    for (let m = 0; m < 60; m += intervalMinutes) {
      if (h === endHour && m > 0) break;
      options.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return options;
}

export function datesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return s1 < e2 && e1 > s2;
}

export function getDateString(date: Date): string {
  return format(toManilaTime(date), "yyyy-MM-dd");
}

export function getMonthDays(year: number, month: number): Date[] {
  const days: Date[] = [];
  const lastDay = new Date(year, month + 1, 0);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  return days;
}

export function getCalendarGrid(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = (firstDay.getDay() + 6) % 7;
  const grid: (Date | null)[] = [];

  for (let i = 0; i < startPad; i++) grid.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    grid.push(new Date(year, month, d));
  }
  while (grid.length % 7 !== 0) grid.push(null);
  return grid;
}
