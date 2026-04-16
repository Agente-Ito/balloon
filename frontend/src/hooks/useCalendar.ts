/**
 * Aggregate own celebrations and social celebrations (from followed profiles)
 * into a month-indexed map for the calendar view.
 */
import { useMemo } from "react";
import { format, isSameMonth, parseISO } from "date-fns";
import type { Celebration, CelebrationDay, Address, ProfileCelebrationData } from "@/types";
import { CelebrationType } from "@/types";
import { GLOBAL_HOLIDAYS } from "@/constants/celebrationTypes";

interface UseCalendarParams {
  profileData: ProfileCelebrationData | undefined;
  /** Optionally pass celebration data from followed profiles */
  socialProfiles?: { address: Address; data: ProfileCelebrationData }[];
  month: Date; // the month being rendered
}

export function useCalendar({ profileData, socialProfiles = [], month }: UseCalendarParams) {
  const celebrationDays = useMemo<CelebrationDay[]>(() => {
    const year = month.getFullYear();
    const dayMap = new Map<string, Celebration[]>();

    const addToDay = (dateStr: string, celebration: Celebration) => {
      if (!dayMap.has(dateStr)) dayMap.set(dateStr, []);
      dayMap.get(dateStr)!.push(celebration);
    };

    // ── Own birthday ────────────────────────────────────────────────────
    if (profileData?.birthday) {
      const bday = profileData.birthday;
      // Supports YYYY-MM-DD (full date) and --MM-DD (year omitted)
      const parts = bday.startsWith("--")
        ? ["", bday.slice(2, 4), bday.slice(5, 7)]
        : bday.split("-");
      const [, monthStr, dayStr] = parts;
      const dateStr = `${year}-${monthStr}-${dayStr}`;
      const date = parseISO(dateStr);
      if (isSameMonth(date, month)) {
        addToDay(dateStr, {
          id: "birthday",
          type: CelebrationType.Birthday,
          title: "My Birthday",
          date: profileData.birthday,
          recurring: true,
        });
      }
    }

    // ── UP Anniversary ──────────────────────────────────────────────────
    if (profileData?.profileCreatedAt) {
      const createdDate = new Date(profileData.profileCreatedAt * 1000);
      const annivThisYear = new Date(createdDate);
      annivThisYear.setFullYear(year);
      if (isSameMonth(annivThisYear, month) && annivThisYear.getFullYear() > createdDate.getFullYear()) {
        const dateStr = format(annivThisYear, "yyyy-MM-dd");
        addToDay(dateStr, {
          id: "up-anniversary",
          type: CelebrationType.UPAnniversary,
          title: "UP Anniversary",
          date: dateStr,
          recurring: true,
        });
      }
    }

    // ── Own custom events ───────────────────────────────────────────────
    for (const event of profileData?.events ?? []) {
      const eventDate = event.recurring
        ? `${year}-${event.date.slice(5)}` // replace year component
        : event.date;

      const date = parseISO(eventDate);
      if (isSameMonth(date, month)) {
        addToDay(eventDate, { ...event, date: eventDate });
      }
    }

    // ── Global holidays ─────────────────────────────────────────────────
    for (const holiday of GLOBAL_HOLIDAYS) {
      const dateStr = `${year}-${holiday.date}`;
      const date = parseISO(dateStr);
      if (isSameMonth(date, month)) {
        addToDay(dateStr, {
          id: holiday.id,
          type: CelebrationType.GlobalHoliday,
          title: holiday.title,
          date: dateStr,
          recurring: true,
          description: holiday.description,
        });
      }
    }

    // ── Social celebrations (followed profiles) ─────────────────────────
    for (const { address, data } of socialProfiles) {
      if (data.birthday && data.settings.birthdayVisible) {
        const [, monthStr, dayStr] = data.birthday.split("-");
        const dateStr = `${year}-${monthStr}-${dayStr}`;
        const date = parseISO(dateStr);
        if (isSameMonth(date, month)) {
          addToDay(dateStr, {
            id: `social-birthday-${address}`,
            type: CelebrationType.Birthday,
            title: `${address.slice(0, 8)}... Birthday`,
            date: dateStr,
            recurring: true,
            profileAddress: address,
          });
        }
      }

      if (data.settings.eventsVisible) {
        for (const event of data.events) {
          const eventDate = event.recurring
            ? `${year}-${event.date.slice(5)}`
            : event.date;
          const date = parseISO(eventDate);
          if (isSameMonth(date, month)) {
            addToDay(eventDate, {
              ...event,
              id: `social-${address}-${event.id}`,
              date: eventDate,
              profileAddress: address,
            });
          }
        }
      }
    }

    return Array.from(dayMap.entries()).map(([date, celebrations]) => ({
      date,
      celebrations,
    }));
  }, [profileData, socialProfiles, month]);

  const todayCelebrations = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    return celebrationDays.find((d) => d.date === today)?.celebrations ?? [];
  }, [celebrationDays]);

  const nextCelebration = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const upcoming = celebrationDays
      .filter((d) => d.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date));
    return upcoming[0] ?? null;
  }, [celebrationDays]);

  return { celebrationDays, todayCelebrations, nextCelebration };
}
