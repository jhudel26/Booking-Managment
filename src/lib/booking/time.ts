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
  
  try {
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
    
    // For consistent server/client rendering, use UTC for formatting
    const formatted = format(d, pattern);
    return formatted;
  } catch (error) {
    console.error("Date formatting error:", error, date);
    return "Invalid Date";
  }
}

export function formatTime(time: string | null | undefined): string {
  if (!time) return "N/A";
  
  try {
    const timeStr = time.slice(0, 5);
    const [hours, minutes] = timeStr.split(":").map(Number);
    
    if (isNaN(hours) || isNaN(minutes)) return "Invalid Time";
    
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    const displayMinutes = String(minutes).padStart(2, "0");
    
    return `${displayHours}:${displayMinutes} ${period}`;
  } catch (error) {
    console.error("Time formatting error:", error, time);
    return "Invalid Time";
  }
}

export function formatTimeForDisplay(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  const displayMinutes = String(minutes).padStart(2, "0");
  return `${displayHours}:${displayMinutes} ${period}`;
}

export function formatTimeRange(start: string | null | undefined, end: string | null | undefined): string {
  const startTime = formatTime(start);
  const endTime = formatTime(end);
  return `${startTime} - ${endTime}`;
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

export function generateTimeOptions12Hour(
  startHour = 6,
  endHour = 22,
  intervalMinutes = 30
): { label: string; value: string }[] {
  const options: { label: string; value: string }[] = [];
  for (let h = startHour; h <= endHour; h++) {
    for (let m = 0; m < 60; m += intervalMinutes) {
      if (h === endHour && m > 0) break;
      const value = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      const period = h >= 12 ? "PM" : "AM";
      const displayHours = h % 12 || 12;
      const displayMinutes = String(m).padStart(2, "0");
      const label = `${displayHours}:${displayMinutes} ${period}`;
      options.push({ label, value });
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
  // Ensure grid always has 6 rows (42 cells) for consistent height
  while (grid.length < 42) grid.push(null);
  return grid;
}
