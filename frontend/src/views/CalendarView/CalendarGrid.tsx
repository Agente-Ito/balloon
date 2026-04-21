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
  selectedDate?: string | null;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function CalendarGrid({ month, celebrationDays, onDayClick, selectedDate }: CalendarGridProps) {
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
          const isSelected = selectedDate === dateStr;

          const baseClasses = "relative aspect-square min-h-[44px] select-none flex flex-col items-center justify-center rounded-lg text-sm border cursor-pointer transition-[background-color,border-color,color,transform,box-shadow] duration-150 outline-none focus-visible:ring-2 focus-visible:ring-lukso-purple/55 focus-visible:ring-offset-1 focus-visible:ring-offset-[#f5f0e1] active:scale-[0.98]";
          const selectedClasses = "bg-lukso-purple/30 border-lukso-purple/70 text-lukso-purple font-semibold shadow-[inset_0_0_0_1px_rgba(156,78,219,0.4)] active:bg-lukso-purple/35";
          const todayClasses = "bg-lukso-pink/20 border-lukso-pink/45 text-lukso-pink font-semibold active:bg-lukso-pink/25";
          const hasEventsClasses = "bg-white/10 border-white/20 hover:bg-white/15 hover:border-lukso-purple/35 active:bg-white/20";
          const emptyClasses = "text-white/45 border-transparent hover:bg-white/10 hover:border-white/15 hover:text-white/70 active:bg-white/15 active:text-white/80";

          const stateClasses = isSelected
            ? selectedClasses
            : isTodayDate
              ? todayClasses
              : hasCelebrations
                ? hasEventsClasses
                : emptyClasses;

          return (
            <button
              key={dateStr}
              onClick={() => onDayClick(dateStr)}
              className={`${baseClasses} ${stateClasses}`}
              aria-pressed={isSelected}
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
