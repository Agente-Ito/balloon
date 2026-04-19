import { useEffect, useState } from "react";
import { addMonths, subMonths, format } from "date-fns";
import { useAppStore } from "@/store/useAppStore";
import { useProfileData } from "@/hooks/useUniversalProfile";
import { useCalendar } from "@/hooks/useCalendar";
import { useSocialCalendar } from "@/hooks/useSocialCalendar";
import { useGridSize } from "@/lib/useGridSize";
import { CalendarGrid } from "./CalendarGrid";
import { DayPopover } from "./DayPopover";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Avatar } from "@/components/Avatar";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ViewToolbar } from "@/components/ViewToolbar";
import { SendGreetingModal } from "@/components/SendGreetingModal";
import { QuickGreetingModal } from "@/components/QuickGreetingModal";
import { useLSP3Name } from "@/hooks/useLSP3Name";
import { useT } from "@/hooks/useT";
import { CELEBRATION_COLORS } from "@/constants/celebrationTypes";
import { CelebrationType } from "@/types";
import type { CelebrationDay, Address } from "@/types";
import type { WalletClient, PublicClient } from "viem";

interface CalendarViewProps {
  walletClient?: WalletClient;
  publicClient: PublicClient;
  chainId: number;
}

function ProfileNameLine({ address, chainId }: { address: Address; chainId: number }) {
  const { data: profileName } = useLSP3Name(address, chainId);
  return <>{profileName ?? `${address.slice(0, 8)}…${address.slice(-6)}`}</>;
}

export function CalendarView({ chainId, walletClient }: CalendarViewProps) {
  const { contextProfile, connectedAccount, setView, setActiveDropId, goBack } = useAppStore();
  const t = useT();
  const [month, setMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<CelebrationDay | null>(null);
  const [quickGreetingRecipient, setQuickGreetingRecipient] = useState<Address | null>(null);
  const [onchainGreetingRecipient, setOnchainGreetingRecipient] = useState<Address | null>(null);
  const isLargeGrid = useGridSize();
  // Progressive disclosure: start expanded on large tiles, collapsed on small
  const [showMonthList, setShowMonthList] = useState(() => isLargeGrid);
  const [showFriends, setShowFriends] = useState(() => isLargeGrid);
  const [showSocialDrops, setShowSocialDrops] = useState(() => isLargeGrid);
  const [showOnlyActiveReminders, setShowOnlyActiveReminders] = useState(() => {
    try {
      return localStorage.getItem("celebrations:calendar:only-active-reminders") === "1";
    } catch {
      return false;
    }
  });

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

  const reminderLabel = (frequency?: "monthly" | "weekly" | "daily") => {
    if (frequency === "daily") return t.calendarReminderToday;
    if (frequency === "weekly") return t.calendarReminderWeek;
    return t.calendarReminderMonth;
  };

  useEffect(() => {
    try {
      localStorage.setItem(
        "celebrations:calendar:only-active-reminders",
        showOnlyActiveReminders ? "1" : "0"
      );
    } catch {
      // ignore persistence errors (private mode, disabled storage)
    }
  }, [showOnlyActiveReminders]);

  const socialProfilesForMonthRaw = ((socialData?.profiles ?? [])
    .filter((p) => p.birthdayMonth === month.getMonth() + 1)
    .sort((a, b) => {
      const dueA = a.reminderDueSoon ? 1 : 0;
      const dueB = b.reminderDueSoon ? 1 : 0;
      if (dueA !== dueB) return dueB - dueA;
      return a.birthdayDay - b.birthdayDay;
    }));

  const activeReminderCount = socialProfilesForMonthRaw.filter((p) => p.reminderDueSoon).length;
  const socialDropsCount = (socialData?.drops ?? []).length;
  const hasCommunityActivity = socialProfilesForMonthRaw.length > 0 || socialDropsCount > 0;
  const communityScore = socialProfilesForMonthRaw.length + socialDropsCount + activeReminderCount;
  const communityMomentum: "high" | "medium" | "starting" =
    communityScore >= 8 ? "high" : communityScore >= 3 ? "medium" : "starting";
  const socialProfilesPreview = socialProfilesForMonthRaw.slice(0, 3);
  const socialDropsPreview = (socialData?.drops ?? [])
    .slice()
    .sort((a, b) => b.claimed - a.claimed)
    .slice(0, 2);

  const socialProfilesForMonth = socialProfilesForMonthRaw
    .filter((p) => (showOnlyActiveReminders ? !!p.reminderDueSoon : true));

  const activeFilterLabel = isLargeGrid
    ? t.calendarFilterActiveReminders
    : t.calendarFilterActiveShort;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <ViewToolbar
        onBack={() => goBack("grid")}
        backLabel={t.navHome}
        title={t.calendarTitle}
        right={<LanguageToggle />}
      />

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

        {/* Community pulse: reinforces that this app is social, not single-player */}
        <div className="mt-4 card border-lukso-purple/25 bg-lukso-purple/10">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-wide text-lukso-purple/70 font-medium">
              {t.calendarCommunityTitle}
            </p>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
              communityMomentum === "high"
                ? "bg-green-500/15 text-green-300 border-green-400/30"
                : communityMomentum === "medium"
                  ? "bg-yellow-500/15 text-yellow-300 border-yellow-400/30"
                  : "bg-white/10 text-white/70 border-white/20"
            }`}>
              {communityMomentum === "high"
                ? t.calendarCommunityMomentumHigh
                : communityMomentum === "medium"
                  ? t.calendarCommunityMomentumMedium
                  : t.calendarCommunityMomentumStarting}
            </span>
          </div>
          <p className="text-[11px] text-white/50 mt-1">
            {communityMomentum === "high"
              ? t.calendarCommunityMomentumHighSub
              : communityMomentum === "medium"
                ? t.calendarCommunityMomentumMediumSub
                : t.calendarCommunityMomentumStartingSub}
          </p>
          {hasCommunityActivity ? (
            <>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                  <p className="text-base font-semibold">{socialProfilesForMonthRaw.length}</p>
                  <p className="text-[11px] text-white/50">{t.calendarCommunityBirthdays}</p>
                </div>
                <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                  <p className="text-base font-semibold">{socialDropsCount}</p>
                  <p className="text-[11px] text-white/50">{t.calendarCommunityDrops}</p>
                </div>
              </div>

              {socialProfilesPreview.length > 0 && (
                <div className="mt-3">
                  <p className="text-[11px] text-white/45 mb-1">{t.calendarCommunityPeopleNow}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {socialProfilesPreview.map((p) => (
                      <div key={p.address} className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-2 py-1">
                        <Avatar address={p.address as Address} size={18} />
                        <span className="text-[11px] text-white/70">
                          <ProfileNameLine address={p.address as Address} chainId={chainId} />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {socialDropsPreview.length > 0 && (
                <div className="mt-3">
                  <p className="text-[11px] text-white/45 mb-1">{t.calendarCommunityRecentDrops}</p>
                  <div className="space-y-1.5">
                    {socialDropsPreview.map((drop) => (
                      <button
                        key={drop.dropId}
                        type="button"
                        onClick={() => {
                          setActiveDropId(drop.dropId);
                          setView("drop-detail");
                        }}
                        className="w-full text-left rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 hover:border-lukso-border/80 transition-colors"
                      >
                        <p className="text-xs text-white/80 truncate">{drop.name}</p>
                        <p className="text-[11px] text-white/45">{drop.claimed} {t.calendarClaimed}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setView("drops")}
                  className="btn-ghost text-xs py-1.5 px-3 border border-lukso-border"
                >
                  {t.calendarCommunityOpenDrops}
                </button>
                {socialProfilesForMonthRaw.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowFriends(true)}
                    className="btn-secondary text-xs py-1.5 px-3"
                  >
                    {t.calendarCommunityOpenBirthdays}
                  </button>
                )}
              </div>
            </>
          ) : (
            <p className="text-xs text-white/50 mt-2">{t.calendarCommunityEmpty}</p>
          )}
        </div>

        {/* This month's celebrations list — collapsed by default */}
        {celebrationDays.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setShowMonthList((v) => !v)}
              className="flex items-center justify-between w-full py-1 mb-2 group"
            >
              <p className="text-xs text-white/40 uppercase tracking-wide font-medium">
                {t.calendarThisMonth} ({celebrationDays.length})
              </p>
              <span className="text-white/25 text-xs group-hover:text-white/60 transition-colors">
                {showMonthList ? "▲" : "▼"}
              </span>
            </button>
            {showMonthList && (
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
            )}
          </div>
        )}

        {/* Social section: friends' birthdays this month — collapsed by default */}
        {socialProfilesForMonthRaw.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between gap-2 py-1 mb-2">
              <button
                onClick={() => setShowFriends((v) => !v)}
                className="flex items-center gap-2 min-w-0 group"
              >
                <p className={`text-xs uppercase tracking-wide font-medium truncate ${
                  isLargeGrid ? "text-white/40" : "text-white/60"
                }`}>
                  {t.calendarFriends} ({socialProfilesForMonthRaw.length})
                </p>
                <span className={`text-xs group-hover:text-white/80 transition-colors flex-shrink-0 ${
                  isLargeGrid ? "text-white/30" : "text-white/60"
                }`}>
                  {showFriends ? "▲" : "▼"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowOnlyActiveReminders((v) => !v)}
                className={`text-[10px] sm:text-[11px] px-2 py-1 rounded-full border transition-colors max-w-full flex-shrink-0 font-medium ${
                  showOnlyActiveReminders
                    ? "bg-lukso-purple/25 border-lukso-purple/50 text-lukso-purple"
                    : isLargeGrid
                      ? "bg-white/5 border-white/10 text-white/45 hover:text-white/70"
                      : "bg-white/10 border-white/25 text-white/75 hover:text-white"
                }`}
              >
                {activeFilterLabel}
                {activeReminderCount > 0 ? ` (${activeReminderCount} ${t.calendarActiveLabel})` : ""}
              </button>
            </div>

            {showFriends && (
              <div className="space-y-2">
                {socialProfilesForMonth.length === 0 && showOnlyActiveReminders ? (
                  <p className="text-xs text-white/45 px-1 py-2">
                    {t.calendarNoActiveReminders}
                  </p>
                ) : socialProfilesForMonth.map((p) => (
                    <div key={p.address} className="card flex items-center gap-3">
                      <Avatar address={p.address as Address} size={28} />
                      <div className="flex-1">
                        <p className="text-xs text-white/60">
                          <ProfileNameLine address={p.address as Address} chainId={chainId} />
                        </p>
                        <p className="text-xs text-white/40">
                          {t.calendarBirthday} — {format(new Date(2000, p.birthdayMonth - 1, p.birthdayDay), "MMMM d")}
                        </p>
                        {p.reminderDueSoon && p.notifyFollowers !== false && (
                          <span className="inline-flex mt-1 text-[10px] px-2 py-0.5 rounded-full bg-lukso-purple/20 text-lukso-purple">
                            {reminderLabel(p.reminderFrequency)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setQuickGreetingRecipient(p.address as Address)}
                          className="text-[11px] px-2 py-1 rounded-full border bg-white/5 border-white/10 text-white/70 hover:text-white"
                        >
                          {t.quickGreetingSend}
                        </button>
                        <span className="w-3 h-3 rounded-full bg-pink-500 flex-shrink-0" />
                      </div>
                    </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Active drops from followed profiles this month — collapsed by default */}
        {(socialData?.drops ?? []).length > 0 && (
          <div className="mt-4 pb-4">
            <button
              onClick={() => setShowSocialDrops((v) => !v)}
              className="flex items-center justify-between w-full py-1 mb-2 group"
            >
              <p className="text-xs text-white/40 uppercase tracking-wide font-medium">
                {t.calendarActiveDrops} ({socialData!.drops.length})
              </p>
              <span className="text-white/25 text-xs group-hover:text-white/60 transition-colors">
                {showSocialDrops ? "▲" : "▼"}
              </span>
            </button>
            {showSocialDrops && (
              <div className="space-y-2">
                {socialData!.drops.map((drop) => (
                  <button
                    key={drop.dropId}
                    onClick={() => {
                      setActiveDropId(drop.dropId);
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
            )}
          </div>
        )}
      </div>

      {/* Day popover */}
      {selectedDay && (
        <DayPopover
          day={selectedDay}
          onClose={() => setSelectedDay(null)}
          chainId={chainId}
          isOwner={contextProfile?.toLowerCase() === connectedAccount?.toLowerCase()}
        />
      )}

      {quickGreetingRecipient && connectedAccount && (
        <QuickGreetingModal
          onClose={() => setQuickGreetingRecipient(null)}
          recipientAddress={quickGreetingRecipient}
          senderAddress={connectedAccount}
          chainId={chainId}
          onOpenOnchain={() => {
            setQuickGreetingRecipient(null);
            setOnchainGreetingRecipient(quickGreetingRecipient);
          }}
        />
      )}

      {onchainGreetingRecipient && connectedAccount && (
        <SendGreetingModal
          onClose={() => setOnchainGreetingRecipient(null)}
          recipientAddress={onchainGreetingRecipient}
          senderAddress={connectedAccount}
          celebrationType={CelebrationType.Birthday}
          walletClient={walletClient ?? null}
          chainId={chainId}
        />
      )}
    </div>
  );
}
