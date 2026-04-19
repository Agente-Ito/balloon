/**
 * GridCard — the compact view shown in the Universal Profile Grid.
 * Shows: next upcoming celebration, today's badge count, and CTAs.
 */
import { format, parseISO, differenceInDays } from "date-fns";
import { useAppStore } from "@/store/useAppStore";
import { useProfileData } from "@/hooks/useUniversalProfile";
import { useCalendar } from "@/hooks/useCalendar";
import { useBadges } from "@/hooks/useBadges";
import { useDrops } from "@/hooks/useDrops";
import { Avatar } from "@/components/Avatar";
import { NetworkBadge } from "@/components/NetworkBadge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { BalloonIcon } from "@/components/BalloonIcon";
import { BalloonLogo } from "@/components/BalloonLogo";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useT } from "@/hooks/useT";
import { CELEBRATION_COLORS } from "@/constants/celebrationTypes";
import type { Address } from "@/types";
import type { WalletClient, PublicClient } from "viem";

interface GridCardProps {
  walletClient?: WalletClient;
  publicClient: PublicClient;
  chainId: number;
}

export function GridCard({ chainId }: GridCardProps) {
  const { contextProfile, isOwner, setView, setActiveCelebrationDate, setEditorEntry } =
    useAppStore();
  const t = useT();
  const { data: profileData, isLoading } = useProfileData(contextProfile, chainId);
  const { data: badges } = useBadges(contextProfile, chainId);
  const { todayCelebrations, nextCelebration } = useCalendar({
    profileData,
    month: new Date(),
  });

  // Active drops from the context profile (visible to anyone visiting their grid)
  const today = new Date();
  const { data: activeDrops } = useDrops({
    host: contextProfile as Address | null,
    activeOnly: true,
    month: today.getMonth() + 1,
    day: today.getDate(),
    enabled: !!contextProfile,
  });

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const hasTodayCelebrations = todayCelebrations.length > 0;
  const hasActiveDrops = (activeDrops ?? []).length > 0;
  const hasBirthday = !!profileData?.birthday;
  const hasEvents = (profileData?.events.length ?? 0) > 0;
  const needsInitialSetup = isOwner && (!hasBirthday || !hasEvents);
  const reminderFrequency = profileData?.settings?.reminderFrequency ?? "monthly";
  const reminderWindowDays = reminderFrequency === "daily" ? 1 : reminderFrequency === "weekly" ? 7 : 30;
  const daysToNextCelebration = nextCelebration
    ? differenceInDays(parseISO(nextCelebration.date), new Date())
    : null;
  const showReminderCard =
    isOwner &&
    profileData?.settings?.notifyFollowers !== false &&
    !!nextCelebration &&
    nextCelebration.date !== todayStr &&
    daysToNextCelebration !== null &&
    daysToNextCelebration >= 0 &&
    daysToNextCelebration <= reminderWindowDays;

  const handleCelebrationClick = (date: string) => {
    setActiveCelebrationDate(date);
    setView("celebration");
  };

  const handleDropsClick = () => {
    setView("drops");
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 gap-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Avatar address={contextProfile} size={32} />
          <div className="flex flex-col gap-0.5">
            <BalloonLogo className="h-7 w-auto" />
            {/* Only show address if no LSP3 name available — very subtle */}
            {contextProfile && (
              <p className="text-[10px] text-white/20 font-mono leading-tight hidden sm:block [@media(max-height:620px)]:hidden">
                {contextProfile.slice(0, 6)}…{contextProfile.slice(-4)}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          {badges && badges.length > 0 && (
            <span className="badge bg-lukso-pink/20 text-lukso-pink">
              {badges.length} {badges.length === 1 ? t.gridBadge : t.gridBadges}
            </span>
          )}
          <NetworkBadge chainId={chainId} />
        </div>
      </div>

      {/* Active drops banner — shown to visitors when the host has a live drop today */}
      {hasActiveDrops && (
        <button
          onClick={handleDropsClick}
          className="card bg-lukso-purple/10 border-lukso-purple/30 text-left hover:bg-lukso-purple/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <BalloonIcon size={34} color="#8B5CF6" className="animate-float flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-lukso-purple">
                {(activeDrops ?? []).length === 1
                  ? (activeDrops ?? [])[0].name
                  : `${(activeDrops ?? []).length} ${t.gridActiveDropsMulti}`}
              </p>
              <p className="text-xs text-lukso-purple/60">{t.gridViewDrops}</p>
            </div>
          </div>
        </button>
      )}

      {/* Frequency-based reminder card for profile owner */}
      {showReminderCard && nextCelebration && daysToNextCelebration !== null && (
        <button
          onClick={() => handleCelebrationClick(nextCelebration.date)}
          className="card bg-white/5 border-white/15 text-left hover:bg-white/10 transition-colors"
        >
          <p className="text-xs text-white/40 uppercase tracking-wide font-medium mb-1">
            {t.gridReminderTitle}
          </p>
          <p className="text-sm font-semibold text-white/85 truncate">
            {nextCelebration.celebrations[0]?.title}
          </p>
          <p className="text-xs text-white/45 mt-1">
            {t.gridReminderSub} {reminderFrequency === "monthly"
              ? t.settingsReminderMonthly
              : reminderFrequency === "weekly"
                ? t.settingsReminderWeekly
                : t.settingsReminderDaily}
            {" · "}
            {t.gridReminderDueIn} {daysToNextCelebration} {t.gridDaysAway}
          </p>
        </button>
      )}

      {/* Today's celebrations banner */}
      {hasTodayCelebrations && (
        <button
          onClick={() => handleCelebrationClick(todayStr)}
          className="card bg-lukso-pink/10 border-lukso-pink/30 text-left hover:bg-lukso-pink/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex -space-x-1.5">
              {todayCelebrations.slice(0, 3).map((c) => (
                <span
                  key={c.id}
                  className={`w-3 h-3 rounded-full border-2 border-lukso-bg ${CELEBRATION_COLORS[c.type]}`}
                />
              ))}
            </div>
            <div>
              <p className="text-sm font-semibold text-lukso-pink">
                {todayCelebrations.length === 1
                  ? todayCelebrations[0].title
                  : `${todayCelebrations.length} ${t.gridCelebrationsToday}`}
              </p>
              <p className="text-xs text-lukso-pink/60">{t.calendarCelebrate}</p>
            </div>
          </div>
        </button>
      )}

      {/* Next celebration */}
      {nextCelebration && nextCelebration.date !== todayStr && (
        <button
          onClick={() => handleCelebrationClick(nextCelebration.date)}
          className="card text-left hover:border-lukso-border/80 transition-colors"
        >
          <p className="text-xs text-white/40 mb-1 uppercase tracking-wide font-medium">
            {t.gridUpcoming}
          </p>
          <div className="flex items-center gap-3">
            <span className={`w-4 h-4 rounded-full flex-shrink-0 ${CELEBRATION_COLORS[nextCelebration.celebrations[0].type]}`} />
            <div>
              <p className="text-sm font-semibold">
                {nextCelebration.celebrations[0].title}
              </p>
              <p className="text-xs text-white/40">
                {format(parseISO(nextCelebration.date), "MMMM d")}
                {" · "}
                {differenceInDays(parseISO(nextCelebration.date), new Date())} {t.gridDaysAway}
              </p>
            </div>
          </div>
        </button>
      )}

      {/* Empty state */}
      {!hasTodayCelebrations && !nextCelebration && (
        <div className="card flex flex-col items-center gap-3 py-8 text-center">
          <BalloonIcon size={48} color="#8B5CF6" className="animate-float-slow opacity-60" />
          <div>
            <p className="text-sm font-semibold text-white/70">{t.gridNoCelebrations}</p>
            <p className="text-xs text-white/30 mt-1">{t.gridNoCelebrationsSub}</p>
          </div>
          {isOwner && (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditorEntry("dates", "main");
                  setView("editor");
                }}
                className="btn-primary text-xs px-4 py-1.5"
              >
                {needsInitialSetup ? t.gridStartSetup : t.gridEditProfile}
              </button>
              {needsInitialSetup && (
                <button
                  onClick={() => {
                    setEditorEntry("dates", "addEvent");
                    setView("editor");
                  }}
                  className="btn-ghost text-xs px-4 py-1.5 border border-lukso-border"
                >
                  {t.gridAddReminder}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Debug overlay — dev only, never renders in prod */}
      {import.meta.env.DEV && import.meta.env.VITE_DEBUG_GRID === "1" && (
        <div className="text-[10px] text-white/20 font-mono break-all border border-white/10 rounded p-2 space-y-0.5">
          <div>context: {contextProfile ?? "null"}</div>
          <div>isOwner: {String(isOwner)}</div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-2 mt-auto">
        <button onClick={() => setView("calendar")} className="btn-secondary text-xs py-2.5">
          {t.gridCalendar}
        </button>
        <button onClick={handleDropsClick} className="btn-secondary text-xs py-2.5 flex items-center justify-center gap-1 hover:animate-pop">
          <BalloonIcon size={14} color="#8B5CF6" />
          {t.gridDropsBtn}
        </button>
        {isOwner ? (
          <button onClick={() => setView("editor")} className="btn-secondary text-xs py-2.5">
            {t.gridEdit}
          </button>
        ) : (
          <button onClick={() => setView("wishlist")} className="btn-secondary text-xs py-2.5">
            {t.gridWishlistBtn}
          </button>
        )}
      </div>
    </div>
  );
}
