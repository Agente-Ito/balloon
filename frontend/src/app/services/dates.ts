/**
 * Client-side date utilities for the Celebrations dApp.
 * All functions are pure and timezone-agnostic (uses UTC).
 */
import type { GlobalHoliday } from "@/app/types";

// ── Calendar helpers ──────────────────────────────────────────────────────────

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

export function toMMDD(dateStr: string): string {
  return dateStr.slice(5); // "YYYY-MM-DD" → "MM-DD"
}

export function isSameDay(a: string, b: string): boolean {
  return a.slice(0, 10) === b.slice(0, 10);
}

export function isTodayMMDD(mmdd: string): boolean {
  return toMMDD(todayISO()) === mmdd;
}

/** Days until the next occurrence of a "MM-DD" recurring date (0 = today) */
export function daysUntil(mmdd: string): number {
  const [mm, dd] = mmdd.split("-").map(Number);
  const now = new Date();
  const thisYear = new Date(now.getFullYear(), mm - 1, dd);
  const nextYear = new Date(now.getFullYear() + 1, mm - 1, dd);
  const target = thisYear >= now ? thisYear : nextYear;
  return Math.floor((target.getTime() - now.getTime()) / 86400_000);
}

/** Returns "YYYY-MM-DD" for N days from now */
export function dateInDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

/** All days in a given month as "YYYY-MM-DD" strings */
export function daysInMonth(year: number, month: number): string[] {
  const count = new Date(year, month, 0).getDate(); // month here is 1-indexed
  return Array.from({ length: count }, (_, i) =>
    `${year}-${String(month).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`
  );
}

// ── Global holidays (client-side definition mirrors the contract) ─────────────

export const GLOBAL_HOLIDAYS: GlobalHoliday[] = [
  { id: "new-year",      slug: "new-year",      title: "New Year's Day",             date: "01-01", month: 1,  day: 1,  emoji: "🎆", description: "The first day of the year",          badgeEnabled: true,  greetingEnabled: true,  defaultVisibility: "public" },
  { id: "valentine",     slug: "valentine",     title: "Valentine's Day",            date: "02-14", month: 2,  day: 14, emoji: "💝", description: "Day of love and affection",         badgeEnabled: true,  greetingEnabled: true,  defaultVisibility: "public" },
  { id: "womens-day",    slug: "womens-day",    title: "International Women's Day",  date: "03-08", month: 3,  day: 8,  emoji: "💐", description: "Celebrating women worldwide",        badgeEnabled: true,  greetingEnabled: true,  defaultVisibility: "public" },
  { id: "earth-day",     slug: "earth-day",     title: "Earth Day",                  date: "04-22", month: 4,  day: 22, emoji: "🌍", description: "Environmental awareness day",        badgeEnabled: false, greetingEnabled: true,  defaultVisibility: "public" },
  { id: "workers-day",   slug: "workers-day",   title: "International Workers' Day", date: "05-01", month: 5,  day: 1,  emoji: "✊", description: "Labour Day",                         badgeEnabled: false, greetingEnabled: true,  defaultVisibility: "public" },
  { id: "halloween",     slug: "halloween",     title: "Halloween",                  date: "10-31", month: 10, day: 31, emoji: "🎃", description: "Spooky season",                     badgeEnabled: true,  greetingEnabled: true,  defaultVisibility: "public" },
  { id: "christmas-eve", slug: "christmas-eve", title: "Christmas Eve",              date: "12-24", month: 12, day: 24, emoji: "🌟", description: "The eve of Christmas",              badgeEnabled: false, greetingEnabled: true,  defaultVisibility: "public" },
  { id: "christmas",     slug: "christmas",     title: "Christmas Day",              date: "12-25", month: 12, day: 25, emoji: "🎄", description: "Christmas Day",                     badgeEnabled: true,  greetingEnabled: true,  defaultVisibility: "public" },
  { id: "new-year-eve",  slug: "new-year-eve",  title: "New Year's Eve",             date: "12-31", month: 12, day: 31, emoji: "🥂", description: "Last day of the year",              badgeEnabled: false, greetingEnabled: true,  defaultVisibility: "public" },
];

export function holidaysOnDate(mmdd: string): GlobalHoliday[] {
  return GLOBAL_HOLIDAYS.filter((h) => h.date === mmdd);
}

// ── UP Anniversary ────────────────────────────────────────────────────────────

/** Returns the UP anniversary year count given a creation timestamp (0 if not yet 1 year) */
export function upAnniversaryYears(createdAtTimestamp: number): number {
  const years = Math.floor((Date.now() / 1000 - createdAtTimestamp) / 31_536_000);
  return Math.max(0, years);
}
