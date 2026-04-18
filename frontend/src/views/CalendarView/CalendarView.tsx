import { useState } from "react";
import { addMonths, subMonths, format } from "date-fns";
import { useAppStore } from "@/store/useAppStore";
import { useProfileData } from "@/hooks/useUniversalProfile";
import { useCalendar } from "@/hooks/useCalendar";
import { useSocialCalendar } from "@/hooks/useSocialCalendar";
import { CalendarGrid } from "./CalendarGrid";
import { DayPopover } from "./DayPopover";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Avatar } from "@/components/Avatar";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useT } from "@/hooks/useT";
import { CELEBRATION_COLORS } from "@/constants/celebrationTypes";
import type { CelebrationDay, Address } from "@/types";
import type { WalletClient, PublicClient } from "viem";

interface CalendarViewProps {
  walletClient?: WalletClient;
  publicClient: PublicClient;
  chainId: number;
}

export function CalendarView({ chainId }: CalendarViewProps) {
  const { contextProfile, connectedAccount, setView } = useAppStore();
  const t = useT();
  const [month, setMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<CelebrationDay | null>(null);

  const { data: profileData, isLoading } = useProfileData(contextProfile, chainId);
  const { celebrationDays } = useCalendar({ profileData, month });

  // Social calendar: birthdays and drops from followed profiles
  const { data: socialData } = useSocialCalendar(
    connectedAccount,
    month.getMonth() + 1
  );

  const handleDayClick = (dateStr: string) => {
    // Always open the popover — create an empty day if nothing is scheduled
    const day = celebrationDays.find((d) => d.date === dateStr)
      ?? { date: dateStr, celebrations: [] };
    setSelectedDay(day);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={() => setView("grid")} className="text-white/40 hover:text-white text-sm flex items-center gap-1">
          {t.back}
        </button>
        <span className="text-sm font-semibold">{t.calendarTitle}</span>
        <LanguageToggle />
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between px-4 py-2">
        <button
          onClick={() => setMonth((m) => subMonths(m, 1))}
          className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-sm transition-colors"
        >
          ‹
        </button>
        <span className="font-semibold">{format(month, "MMMM yyyy")}</span>
        <button
          onClick={() => setMonth((m) => addMonths(m, 1))}
          className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-sm transition-colors"
        >
          ›
        </button>
      </div>

      {/* Calendar body */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <LoadingSpinner />
          </div>
        ) : (
          <CalendarGrid
            month={month}
            celebrationDays={celebrationDays}
            onDayClick={handleDayClick}
          />
        )}

        {/* This month's celebrations list */}
        {celebrationDays.length > 0 && (
          <div className="mt-6">
            <p className="text-xs text-white/40 uppercase tracking-wide font-medium mb-2">
              {t.calendarThisMonth}
            </p>
            <div className="space-y-2">
              {celebrationDays
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((day) => (
                  <button
                    key={day.date}
                    onClick={() => setSelectedDay(day)}
                    className="card w-full text-left hover:border-lukso-border/80 transition-colors flex items-center gap-3"
                  >
                    <div className="flex -space-x-1.5">
                      {day.celebrations.slice(0, 2).map((c, i) => (
                        <span
                          key={i}
                          className={`w-3 h-3 rounded-full border-2 border-lukso-bg ${CELEBRATION_COLORS[c.type]}`}
                        />
                      ))}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {day.celebrations.length === 1
                          ? day.celebrations[0].title
                          : `${day.celebrations.length} ${t.calendarCelebrations}`}
                      </p>
                      <p className="text-xs text-white/40">{format(new Date(day.date), "MMMM d")}</p>
                    </div>
                    <span className="text-white/20 text-sm">›</span>
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Social section: friends' birthdays this month */}
      {(socialData?.profiles ?? []).length > 0 && (
        <div className="mt-6 px-4">
          <p className="text-xs text-white/40 uppercase tracking-wide font-medium mb-2">
            {t.calendarFriends}
          </p>
          <div className="space-y-2">
            {socialData!.profiles
              .filter((p) => p.birthdayMonth === month.getMonth() + 1)
              .sort((a, b) => a.birthdayDay - b.birthdayDay)
              .map((p) => (
                <div key={p.address} className="card flex items-center gap-3">
                  <Avatar address={p.address as Address} size={28} />
                  <div className="flex-1">
                    <p className="text-xs font-mono text-white/60">
                      {p.address.slice(0, 8)}…{p.address.slice(-6)}
                    </p>
                    <p className="text-xs text-white/40">
                      {t.calendarBirthday} — {format(new Date(2000, p.birthdayMonth - 1, p.birthdayDay), "MMMM d")}
                    </p>
                  </div>
                  <span className={`w-3 h-3 rounded-full bg-pink-500 flex-shrink-0`} />
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Active drops from followed profiles this month */}
      {(socialData?.drops ?? []).length > 0 && (
        <div className="mt-4 px-4 pb-4">
          <p className="text-xs text-white/40 uppercase tracking-wide font-medium mb-2">
            {t.calendarActiveDrops}
          </p>
          <div className="space-y-2">
            {socialData!.drops.map((drop) => (
              <button
                key={drop.dropId}
                onClick={() => {
                  localStorage.setItem("activeDropId", drop.dropId);
                  setView("drop-detail");
                }}
                className="card w-full text-left flex items-center gap-3 hover:border-lukso-border/80 transition-colors"
              >
                <span className="w-3 h-3 rounded-full bg-lukso-purple flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{drop.name}</p>
                  <p className="text-xs text-white/40">
                    {drop.claimed} {t.calendarClaimed}
                    {drop.maxSupply != null ? ` / ${drop.maxSupply}` : ""}
                  </p>
                </div>
                <span className="text-white/20 text-sm">›</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Day popover */}
      {selectedDay && (
        <DayPopover
          day={selectedDay}
          onClose={() => setSelectedDay(null)}
          isOwner={contextProfile?.toLowerCase() === connectedAccount?.toLowerCase()}
        />
      )}
    </div>
  );
}
