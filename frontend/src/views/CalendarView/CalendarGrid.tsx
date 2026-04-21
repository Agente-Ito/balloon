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
          <div key={wd} className="text-center text-xs text-[#5a4a2f] py-1 font-semibold tracking-wide">
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

          const baseClasses = "relative aspect-square min-h-[44px] select-none flex flex-col items-center justify-center rounded-lg text-sm border cursor-pointer transition-[background-color,border-color,color,transform,box-shadow] duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#c99a2e]/60 focus-visible:ring-offset-1 focus-visible:ring-offset-[#f5f0e1] active:scale-[0.98]";
          const selectedClasses = "bg-[#f8ecd0] border-[#c99a2e]/80 text-[#4f3300] font-semibold shadow-[0_2px_8px_rgba(107,75,14,0.24),inset_0_0_0_1px_rgba(201,154,46,0.42)] active:bg-[#f3e1b7]";
          const todayClasses = "bg-[#fde9b7] border-[#d7a63b]/75 text-[#5a3a00] font-semibold shadow-[inset_0_0_0_1px_rgba(215,166,59,0.35)] active:bg-[#f8df9f]";
          const hasEventsClasses = "bg-[#fff7e5]/75 border-[#d2bc8d]/70 text-[#3f301a] hover:bg-[#fff1d4] hover:border-[#c99a2e]/55 active:bg-[#f7e8c8]";
          const emptyClasses = "text-[#5c4b2e] border-transparent hover:bg-[#fff7e8]/80 hover:border-[#dac7a0]/70 hover:text-[#3f3019] active:bg-[#f8ebd0]";

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
