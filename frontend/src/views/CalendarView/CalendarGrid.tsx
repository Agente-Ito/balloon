import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isToday,
  getDay,
} from "date-fns";
import { CELEBRATION_COLORS } from "@/constants/celebrationTypes";
import type { CelebrationDay } from "@/types";

interface CalendarGridProps {
  month: Date;
  celebrationDays: CelebrationDay[];
  onDayClick: (date: string) => void;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function CalendarGrid({ month, celebrationDays, onDayClick }: CalendarGridProps) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Map celebrations by date string
  const celebrationMap = new Map<string, CelebrationDay>();
  for (const day of celebrationDays) {
    celebrationMap.set(day.date, day);
  }

  // Leading empty cells for the first week
  const startWeekday = getDay(monthStart); // 0 = Sun

  return (
    <div>
      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((wd) => (
          <div key={wd} className="text-center text-xs text-white/30 py-1 font-medium">
            {wd}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {/* Leading empty cells */}
        {Array.from({ length: startWeekday }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const cellData = celebrationMap.get(dateStr);
          const hasCelebrations = !!cellData && cellData.celebrations.length > 0;
          const isTodayDate = isToday(day);

          return (
            <button
              key={dateStr}
              onClick={() => onDayClick(dateStr)}
              className={`
                relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm
                transition-colors cursor-pointer
                ${isTodayDate ? "bg-lukso-pink/20 border border-lukso-pink/40 font-semibold text-lukso-pink" : ""}
                ${hasCelebrations && !isTodayDate ? "bg-white/5 hover:bg-white/10" : ""}
                ${!hasCelebrations && !isTodayDate ? "text-white/40 hover:bg-white/5 hover:text-white/60" : ""}
              `}
            >
              <span className="text-xs leading-none">{format(day, "d")}</span>

              {/* Celebration dots */}
              {hasCelebrations && (
                <div className="flex gap-0.5 mt-0.5">
                  {cellData.celebrations.slice(0, 3).map((c, i) => (
                    <span
                      key={i}
                      className={`w-1 h-1 rounded-full ${CELEBRATION_COLORS[c.type]}`}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
