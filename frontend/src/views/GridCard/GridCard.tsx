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
import { CELEBRATION_EMOJIS } from "@/constants/celebrationTypes";
import type { Address } from "@/types";
import type { WalletClient, PublicClient } from "viem";

interface GridCardProps {
  walletClient?: WalletClient;
  publicClient: PublicClient;
  chainId: number;
}

export function GridCard({ chainId }: GridCardProps) {
  const { contextProfile, isOwner, setView, setActiveCelebrationDate } =
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
            {contextProfile && (
              <p className="text-[10px] text-white/30 font-mono leading-tight">
                {contextProfile.slice(0, 6)}…{contextProfile.slice(-4)}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          {badges && badges.length > 0 && (
            <span className="badge bg-lukso-pink/20 text-lukso-pink">
              {badges.length} {badges.length === 1 ? "badge" : "badges"}
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
                  : `${(activeDrops ?? []).length} active drops!`}
              </p>
              <p className="text-xs text-lukso-purple/60">{t.gridViewDrops}</p>
            </div>
          </div>
        </button>
      )}

      {/* Today's celebrations banner */}
      {hasTodayCelebrations && (
        <button
          onClick={() => handleCelebrationClick(todayStr)}
          className="card bg-lukso-pink/10 border-lukso-pink/30 text-left hover:bg-lukso-pink/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex -space-x-1">
              {todayCelebrations.slice(0, 3).map((c) => (
                <span key={c.id} className="text-2xl">
                  {CELEBRATION_EMOJIS[c.type]}
                </span>
              ))}
            </div>
            <div>
              <p className="text-sm font-semibold text-lukso-pink">
                {todayCelebrations.length === 1
                  ? todayCelebrations[0].title
                  : `${todayCelebrations.length} celebrations today!`}
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
            <span className="text-3xl">
              {CELEBRATION_EMOJIS[nextCelebration.celebrations[0].type]}
            </span>
            <div>
              <p className="text-sm font-semibold">
                {nextCelebration.celebrations[0].title}
              </p>
              <p className="text-xs text-white/40">
                {format(parseISO(nextCelebration.date), "MMMM d")}
                {" · "}
                {differenceInDays(parseISO(nextCelebration.date), new Date())} days away
              </p>
            </div>
          </div>
        </button>
      )}

      {/* Empty state */}
      {!hasTodayCelebrations && !nextCelebration && (
        <div className="card flex flex-col items-center gap-2 py-6 text-center">
          <BalloonIcon size={40} color="#3A3B3E" className="animate-float-slow" />
          <p className="text-sm text-white/50">{t.gridNoCelebrations}</p>
          {isOwner && (
            <button onClick={() => setView("editor")} className="btn-primary mt-1 text-xs px-3 py-1">
              {t.gridEditProfile}
            </button>
          )}
        </div>
      )}

      {/* Debug overlay — remove after fixing isOwner */}
      {import.meta.env.DEV && (
        <div className="text-[10px] text-white/20 font-mono break-all border border-white/10 rounded p-2 space-y-0.5">
          <div>context: {contextProfile ?? "null"}</div>
          <div>isOwner: {String(isOwner)}</div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-2 mt-auto">
        <button onClick={() => setView("calendar")} className="btn-secondary text-xs py-2.5">
          📅 Calendar
        </button>
        <button onClick={handleDropsClick} className="btn-secondary text-xs py-2.5 flex items-center justify-center gap-1 hover:animate-pop">
          <BalloonIcon size={14} color="#8B5CF6" />
          Drops
        </button>
        {isOwner ? (
          <button onClick={() => setView("editor")} className="btn-secondary text-xs py-2.5">
            ✏️ Edit
          </button>
        ) : (
          <button onClick={() => setView("wishlist")} className="btn-secondary text-xs py-2.5">
            🛍 Wishlist
          </button>
        )}
      </div>
    </div>
  );
}
