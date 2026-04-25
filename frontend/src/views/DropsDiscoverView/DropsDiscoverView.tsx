import { useState, useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useDrops } from "@/hooks/useDrops";
import { useDropEligibility } from "@/hooks/useDropEligibility";
import { useClaimDrop } from "@/hooks/useClaimDrop";
import { useSocialCalendar } from "@/hooks/useSocialCalendar";
import { useSocialContacts } from "@/hooks/useSocialContacts";
import { useAllSeries } from "@/hooks/useSeries";
import { useFestivities } from "@/hooks/useFestivities";
import { useProfileData } from "@/hooks/useUniversalProfile";
import { useUPCreationDate } from "@/hooks/useUPCreationDate";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ViewToolbar } from "@/components/ViewToolbar";
import { Avatar } from "@/components/Avatar";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useT } from "@/hooks/useT";
import { useLSP3Name } from "@/hooks/useLSP3Name";
import { getLocalizedDropEligibilityReason } from "@/lib/dropEligibilityReason";
import { getMonthNames } from "@/lib/monthNames";
import { BulkGreetingModal } from "./BulkGreetingModal";
import type { IndexedDrop, Address, SocialProfile } from "@/types";
import type { WalletClient } from "viem";

interface DropsDiscoverViewProps {
  walletClient?: WalletClient;
  chainId: number;
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function nextOccurrenceOfMMDD(month: number, day: number, todayStart: Date): Date {
  const thisYear = new Date(todayStart.getFullYear(), month - 1, day);
  if (thisYear >= todayStart) return thisYear;
  return new Date(todayStart.getFullYear() + 1, month - 1, day);
}

function daysUntil(d: Date, todayStart: Date): number {
  return Math.round((d.getTime() - todayStart.getTime()) / 86400000);
}

function parseBirthdayMMDD(birthday: string): { month: number; day: number } | null {
  if (birthday.startsWith("--")) {
    const month = parseInt(birthday.slice(2, 4), 10);
    const day = parseInt(birthday.slice(5, 7), 10);
    if (isNaN(month) || isNaN(day)) return null;
    return { month, day };
  }
  const parts = birthday.split("-");
  if (parts.length < 3) return null;
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (isNaN(month) || isNaN(day)) return null;
  return { month, day };
}

function getLocalizedFestivityName(name: string, t: ReturnType<typeof useT>): string {
  const map: Record<string, string> = {
    "New Year":          t.holidayNewYear,
    "Happy New Year":    t.holidayNewYear,
    "Valentine's Day":   t.holidayValentines,
    "Easter":            t.holidayEaster,
    "Happy Easter":      t.holidayEaster,
    "Halloween":         t.holidayHalloween,
    "Happy Halloween":   t.holidayHalloween,
    "Christmas":         t.holidayChristmas,
    "Merry Christmas":   t.holidayChristmas,
    "New Year's Eve":    t.holidayNewYearEve,
    "Diwali":            t.holidayDiwali,
    "Happy Diwali":      t.holidayDiwali,
    "Hanukkah":          t.holidayHanukkah,
    "Happy Hanukkah":    t.holidayHanukkah,
  };
  return map[name] ?? name;
}

// ── DropCard ──────────────────────────────────────────────────────────────────

function DropCard({
  drop,
  viewer,
  walletClient,
  chainId,
  relationLabel,
}: {
  drop: IndexedDrop;
  viewer: Address | null;
  walletClient?: WalletClient;
  chainId: number;
  relationLabel?: string;
}) {
  const t = useT();
  const { data: hostName } = useLSP3Name(drop.host as Address, chainId);
  const { data: eligibility, isLoading: eligLoading } = useDropEligibility(drop.dropId, viewer, chainId);
  const claimMutation = useClaimDrop(walletClient ?? null, chainId);
  const isMyDrop = !!viewer && viewer.toLowerCase() === drop.host.toLowerCase();

  const handleClaim = async () => {
    if (!viewer) return;
    await claimMutation.mutateAsync({ dropId: drop.dropId, claimer: viewer });
  };

  const handleDetails = () => {
    useAppStore.getState().setActiveDropId(drop.dropId);
    useAppStore.getState().setView("drop-detail");
  };

  const supplyLabel =
    drop.maxSupply != null
      ? `${drop.claimed} / ${drop.maxSupply} ${t.dropsClaimed}`
      : `${drop.claimed} ${t.dropsClaimed}`;

  const dateLabel = `${String(drop.month).padStart(2, "0")}-${String(drop.day).padStart(2, "0")}`;

  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-center gap-3">
        {drop.imageIPFS ? (
          <img
            src={
              drop.imageIPFS.startsWith("data:")
                ? drop.imageIPFS
                : `https://gateway.pinata.cloud/ipfs/${drop.imageIPFS}`
            }
            alt={drop.name}
            className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-lukso-pink/20 flex items-center justify-center flex-shrink-0">
            <span className="w-6 h-6 rounded-full bg-lukso-pink/40" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{drop.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <Avatar address={drop.host} size={20} chainId={chainId} className="ring-1 ring-white/20" />
            <span className="text-xs text-lukso-purple/90 truncate font-medium">
              {hostName ?? `${drop.host.slice(0, 6)}…${drop.host.slice(-4)}`}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-xs text-white/30">{dateLabel}</span>
          {isMyDrop && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-lukso-pink/20 text-lukso-pink">
              {t.dropMineBadge}
            </span>
          )}
          {relationLabel && !isMyDrop && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-lukso-purple/15 text-lukso-purple/80">
              {relationLabel}
            </span>
          )}
        </div>
      </div>

      <div className="hidden sm:flex [@media(max-height:620px)]:hidden items-center gap-3 text-xs text-white/40">
        <span>{supplyLabel}</span>
        {drop.requireFollow && <span>· {t.dropFollowRequired}</span>}
        {drop.minFollowers > 0 && (
          <span>· {drop.minFollowers}+ {t.dropFollowerReq}</span>
        )}
        {drop.requiredLSP7.length > 0 && <span>· LSP7 gate</span>}
        {drop.requiredLSP8.length > 0 && <span>· LSP8 gate</span>}
      </div>

      <div className="flex items-center gap-2">
        <button onClick={handleDetails} className="btn-ghost text-xs flex-1">
          {t.dropDetails}
        </button>

        {viewer &&
          (eligLoading ? (
            <div className="flex-1 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : eligibility?.ok ? (
            <button
              onClick={handleClaim}
              disabled={claimMutation.isPending}
              className="btn-primary text-xs flex-1"
            >
              {claimMutation.isPending ? t.dropClaiming : t.dropClaimBadge}
            </button>
          ) : (
            <span className="text-xs text-white/30 flex-1 text-center truncate px-2">
              {getLocalizedDropEligibilityReason(eligibility?.reason, t)}
            </span>
          ))}
      </div>

      {claimMutation.isSuccess && (
        <p className="text-xs text-amber-300 text-center">{t.dropClaimedOk}</p>
      )}
      {claimMutation.isError && (
        <p className="text-xs text-red-400 text-center">
          {claimMutation.error instanceof Error ? claimMutation.error.message : t.dropClaimFailed}
        </p>
      )}
    </div>
  );
}

// ── UpcomingSection ───────────────────────────────────────────────────────────

interface UpcomingItem {
  key: string;
  label: string;
  dateStr: string;
  daysAway: number;
  color: string;
}

function UpcomingSection({ address, chainId }: { address: Address; chainId: number }) {
  const t = useT();
  const monthNames = useMemo(() => getMonthNames(t), [t]);
  const [collapsed, setCollapsed] = useState(false);
  const { data: profileData } = useProfileData(address, chainId);
  const { data: createdAt } = useUPCreationDate(address, chainId);

  const items = useMemo((): UpcomingItem[] => {
    const today = startOfDay(new Date());
    const result: UpcomingItem[] = [];

    // Birthday
    if (profileData?.birthday) {
      const parsed = parseBirthdayMMDD(profileData.birthday);
      if (parsed) {
        const next = nextOccurrenceOfMMDD(parsed.month, parsed.day, today);
        result.push({
          key: "birthday",
          label: t.dropsBirthdayLabel,
          dateStr: `${next.getDate()} ${monthNames[next.getMonth()]}`,
          daysAway: daysUntil(next, today),
          color: "#E84393",
        });
      }
    }

    // UP Anniversary — only show if at least 1 year old
    const upCreated =
      createdAt ??
      (profileData?.profileCreatedAt ? new Date(profileData.profileCreatedAt * 1000) : null);
    if (upCreated) {
      const next = nextOccurrenceOfMMDD(upCreated.getMonth() + 1, upCreated.getDate(), today);
      if (next.getFullYear() > upCreated.getFullYear()) {
        result.push({
          key: "up-anniv",
          label: t.dropsUPAnnivLabel,
          dateStr: `${next.getDate()} ${monthNames[next.getMonth()]}`,
          daysAway: daysUntil(next, today),
          color: "#6A1B9A",
        });
      }
    }

    // Custom events (up to 2 more)
    if (profileData?.events) {
      for (const ev of profileData.events) {
        if (result.length >= 4) break;
        let next: Date | null = null;
        const parts = ev.date.split("-");

        if (ev.recurring) {
          const month = parts.length === 3 ? parseInt(parts[1], 10) : parseInt(parts[0], 10);
          const day = parts.length === 3 ? parseInt(parts[2], 10) : parseInt(parts[1], 10);
          if (!isNaN(month) && !isNaN(day)) {
            next = nextOccurrenceOfMMDD(month, day, today);
          }
        } else if (parts.length === 3) {
          const evDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          if (daysUntil(evDate, today) >= 0) next = evDate;
        }

        if (next) {
          result.push({
            key: ev.id,
            label: ev.title,
            dateStr: `${next.getDate()} ${monthNames[next.getMonth()]}`,
            daysAway: daysUntil(next, today),
            color: "#C8932A",
          });
        }
      }
    }

    return result.sort((a, b) => a.daysAway - b.daysAway).slice(0, 4);
  }, [profileData, createdAt, monthNames, t]);

  if (items.length === 0) return null;

  function daysLabel(n: number): string {
    if (n === 0) return t.quickCreateEventToday;
    if (n === 1) return t.dropsTomorrowLabel;
    return t.dropsInDays.replace("{n}", String(n));
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="title-premium text-xs uppercase">{t.dropsMyUpcoming}</h2>
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="text-xs text-white/30 hover:text-white/50 transition-colors px-1 leading-none"
          aria-expanded={!collapsed}
        >
          {collapsed ? "+" : "−"}
        </button>
      </div>
      {!collapsed && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {items.map((item) => (
            <div
              key={item.key}
              className="flex-shrink-0 rounded-xl p-3 flex flex-col gap-1 min-w-[112px] max-w-[148px]"
              style={{
                background: "rgba(245,240,225,0.55)",
                border: `1px solid ${item.color}28`,
              }}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-sm flex-shrink-0"
                  style={{ background: item.color, opacity: 0.8 }}
                />
                <span
                  className="text-[10px] font-semibold uppercase tracking-wide truncate"
                  style={{ color: item.color }}
                >
                  {item.label}
                </span>
              </div>
              <p className="text-[12px] font-semibold" style={{ color: "#3d2c1e" }}>
                {item.dateStr}
              </p>
              <p className="text-[10px]" style={{ color: "#7a5c2e" }}>
                {daysLabel(item.daysAway)}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ── GlobalSection ─────────────────────────────────────────────────────────────

function GlobalSection({
  allDrops,
  viewer,
  walletClient,
  chainId,
  onGreetNetwork,
}: {
  allDrops: IndexedDrop[];
  viewer: Address | null;
  walletClient?: WalletClient;
  chainId: number;
  onGreetNetwork: () => void;
}) {
  const t = useT();
  const monthNames = useMemo(() => getMonthNames(t), [t]);
  const { data: festivities = [], isLoading } = useFestivities(chainId);

  // Show next 3 upcoming festivities regardless of month
  const upcomingFests = useMemo(() => {
    const today = startOfDay(new Date());
    return festivities
      .map((f) => ({
        ...f,
        nextDate: nextOccurrenceOfMMDD(f.month, f.day, today),
        daysAway: daysUntil(nextOccurrenceOfMMDD(f.month, f.day, today), today),
      }))
      .sort((a, b) => a.daysAway - b.daysAway)
      .slice(0, 3);
  }, [festivities]);

  if (isLoading) {
    return (
      <section>
        <h2 className="title-premium text-xs uppercase mb-3">{t.dropsGlobal}</h2>
        <div className="flex justify-center py-4">
          <LoadingSpinner />
        </div>
      </section>
    );
  }

  if (upcomingFests.length === 0) return null;

  return (
    <section>
      <h2 className="title-premium text-xs uppercase mb-3">{t.dropsGlobal}</h2>
      <div className="flex flex-col gap-3">
        {upcomingFests.map((fest) => {
          const matchingDrops = allDrops.filter(
            (d) =>
              d.month === fest.month &&
              d.day === fest.day &&
              d.celebrationType === "global_holiday"
          );
          const isToday = fest.daysAway === 0;

          if (matchingDrops.length > 0) {
            return matchingDrops.map((drop) => (
              <DropCard
                key={drop.dropId}
                drop={drop}
                viewer={viewer}
                walletClient={walletClient}
                chainId={chainId}
                relationLabel={t.dropRelGlobal}
              />
            ));
          }

          return (
            <div
              key={`${fest.month}-${fest.day}`}
              className="rounded-2xl p-4 flex items-center gap-4"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{getLocalizedFestivityName(fest.name, t)}</p>
                <p className="text-xs text-white/35 mt-0.5">
                  {fest.nextDate.getDate()} {monthNames[fest.nextDate.getMonth()]}
                  {isToday && (
                    <span className="ml-1 text-amber-400 font-medium"> · {t.quickCreateEventToday}</span>
                  )}
                  {!isToday && fest.daysAway <= 14 && (
                    <span className="ml-1 text-amber-400/70"> · {fest.daysAway}d</span>
                  )}
                </p>
                <p className="text-xs text-white/25 mt-1">{t.dropsGlobalNoInsignia}</p>
              </div>
              {viewer && (
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button onClick={onGreetNetwork} className="btn-ghost text-[11px] py-1 px-2.5">
                    {t.dropsGlobalGreetCta}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── SocialBirthdayChip ────────────────────────────────────────────────────────

function SocialBirthdayChip({
  profile,
  chainId,
  daysAway,
  dateStr,
  todayLabel,
  tomorrowLabel,
}: {
  profile: SocialProfile;
  chainId: number;
  daysAway: number;
  dateStr: string;
  todayLabel: string;
  tomorrowLabel: string;
}) {
  const { data: name } = useLSP3Name(profile.address, chainId);
  const displayName = name ?? `${profile.address.slice(0, 6)}…${profile.address.slice(-4)}`;
  const dayLabel =
    daysAway === 0 ? todayLabel : daysAway === 1 ? tomorrowLabel : `${daysAway}d`;

  return (
    <div
      className="flex-shrink-0 flex flex-col gap-0.5 rounded-xl px-3 py-2 min-w-[120px] max-w-[148px]"
      style={{
        background: "rgba(245,240,225,0.55)",
        border: "1px solid rgba(232,67,147,0.18)",
      }}
    >
      <span className="text-[11px] font-medium truncate" style={{ color: "#4a3728" }}>
        {displayName}
      </span>
      <span className="text-[10px]" style={{ color: "#5c3d1e" }}>
        {dateStr}
      </span>
      <span className="text-[10px]" style={{ color: "#E84393CC" }}>
        {dayLabel}
      </span>
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────

export function DropsDiscoverView({ walletClient, chainId }: DropsDiscoverViewProps) {
  const { connectedAccount, setView, setActiveSeriesId, goBack } =
    useAppStore();
  const t = useT();
  const monthNames = useMemo(() => getMonthNames(t), [t]);

  const { data: socialData, isLoading: socialLoading } = useSocialCalendar(connectedAccount);
  const { data: contacts = [] } = useSocialContacts(connectedAccount);
  const { data: allSeries } = useAllSeries();
  const openSeries = (allSeries ?? []).filter((s) => s.submissionOpen);

  const followingAddresses = socialData?.drops.map((d) => d.host) ?? [];

  const { data: socialDrops, isLoading: socialDropsLoading } = useDrops({
    following:
      followingAddresses.length > 0
        ? ([...new Set(followingAddresses)] as Address[])
        : undefined,
    activeOnly: true,
    enabled: !socialLoading,
  });

  const { data: allDrops, isLoading: allDropsLoading } = useDrops({ activeOnly: true });

  const contactMap = useMemo(() => {
    const m = new Map<string, "following" | "followers" | "both">();
    for (const c of contacts) m.set(c.address.toLowerCase(), c.source);
    return m;
  }, [contacts]);

  const socialDropIds = new Set((socialDrops ?? []).map((d) => d.dropId));

  // Community drops = active drops not from following and not own
  const communityDrops = (allDrops ?? []).filter(
    (d) =>
      !socialDropIds.has(d.dropId) &&
      d.host.toLowerCase() !== connectedAccount?.toLowerCase()
  );

  const isLoading = socialLoading || socialDropsLoading;
  const [showBulkGreet, setShowBulkGreet] = useState(false);

  function getRelationLabel(hostAddress: string) {
    const src = contactMap.get(hostAddress.toLowerCase());
    if (!src) return undefined;
    if (src === "both") return t.dropRelMutual;
    if (src === "following") return t.dropRelFollowing;
    return t.dropRelFollower;
  }

  // Upcoming birthdays from followed profiles (birthdayMonth > 0 = publicly shared)
  const socialBirthdays = useMemo(() => {
    const today = startOfDay(new Date());
    return (socialData?.profiles ?? [])
      .filter((p) => p.birthdayMonth > 0 && p.birthdayDay > 0)
      .map((p) => {
        const next = nextOccurrenceOfMMDD(p.birthdayMonth, p.birthdayDay, today);
        return {
          profile: p,
          next,
          daysAway: daysUntil(next, today),
          dateStr: `${next.getDate()} ${monthNames[next.getMonth()]}`,
        };
      })
      .sort((a, b) => a.daysAway - b.daysAway)
      .slice(0, 5);
  }, [socialData, monthNames]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <ViewToolbar
        onBack={() => goBack("grid")}
        backLabel={t.navHome}
        right={
          <div className="flex items-center gap-1 sm:gap-2 min-w-0">
            <div
              className="flex gap-0.5 rounded-lg p-0.5 min-w-0"
              style={{ background: "rgba(106,27,154,0.07)" }}
            >
              <button
                className="title-premium text-[11px] sm:text-xs px-2 sm:px-3 py-1 rounded-md"
                style={{ background: "rgba(106,27,154,0.15)", color: "#6A1B9A" }}
              >
                {t.dropsManageTabExplore}
              </button>
              {connectedAccount && (
                <button
                  onClick={() => setView("drops-manage")}
                  className="title-premium text-[11px] sm:text-xs px-2 sm:px-3 py-1 rounded-md transition-colors"
                  style={{ color: "#8B7D7D" }}
                >
                  {t.dropsManageTabManage}
                </button>
              )}
              <button
                onClick={() => {
                  if (openSeries.length > 0) {
                    setActiveSeriesId(openSeries[0].id);
                    setView("series");
                  }
                }}
                className="title-premium text-[11px] sm:text-xs px-2 sm:px-3 py-1 rounded-md transition-colors relative"
                style={{
                  color: openSeries.length > 0 ? "#c99a2e" : "#C0A870",
                  opacity: openSeries.length > 0 ? 1 : 0.55,
                }}
              >
                {t.dropsManageTabSeries}
                {openSeries.length > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full"
                    style={{ background: "#c99a2e" }}
                  />
                )}
              </button>
            </div>
            <LanguageToggle />
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-6">

        {/* ── Tus próximas celebraciones ──────────────────────────────────── */}
        {connectedAccount && (
          <UpcomingSection address={connectedAccount} chainId={chainId} />
        )}

        {/* ── Celebraciones globales ──────────────────────────────────────── */}
        <GlobalSection
          allDrops={allDrops ?? []}
          viewer={connectedAccount}
          walletClient={walletClient}
          chainId={chainId}
          onGreetNetwork={() => setShowBulkGreet(true)}
        />

        {/* ── De quienes sigues ────────────────────────────────────────────── */}
        {connectedAccount && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="title-premium text-xs uppercase">{t.dropsFromFollows}</h2>
              {contacts.length > 0 && walletClient && (
                <button
                  onClick={() => setShowBulkGreet(true)}
                  className="text-[11px] text-lukso-purple/70 hover:text-lukso-purple transition-colors"
                >
                  {t.dropsGlobalGreetCta}
                </button>
              )}
            </div>

            {/* Upcoming birthdays from followed profiles */}
            {socialBirthdays.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
                {socialBirthdays.map(({ profile, daysAway, dateStr }) => (
                  <SocialBirthdayChip
                    key={profile.address}
                    profile={profile}
                    chainId={chainId}
                    daysAway={daysAway}
                    dateStr={dateStr}
                    todayLabel={t.quickCreateEventToday}
                    tomorrowLabel={t.dropsTomorrowLabel}
                  />
                ))}
              </div>
            )}

            {isLoading ? (
              <div className="flex justify-center py-6">
                <LoadingSpinner />
              </div>
            ) : (socialDrops ?? []).length === 0 ? (
              <p className="text-xs text-white/30 text-center py-4">{t.dropsFromFollowsEmpty}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(socialDrops ?? []).map((drop) => (
                  <DropCard
                    key={drop.dropId}
                    drop={drop}
                    viewer={connectedAccount}
                    walletClient={walletClient}
                    chainId={chainId}
                    relationLabel={getRelationLabel(drop.host)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Descubrir ────────────────────────────────────────────────────── */}
        <section>
          <h2 className="title-premium text-xs uppercase mb-3">{t.dropsDiscover}</h2>
          {allDropsLoading ? (
            <div className="flex justify-center py-6">
              <LoadingSpinner />
            </div>
          ) : communityDrops.length === 0 ? (
            <p className="text-xs text-white/30 text-center py-4">{t.dropsDiscoverEmpty}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {communityDrops.map((drop) => (
                <DropCard
                  key={drop.dropId}
                  drop={drop}
                  viewer={connectedAccount}
                  walletClient={walletClient}
                  chainId={chainId}
                  relationLabel={t.dropRelCommunity}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Convocatoria ──────────────────────────────────────────────────── */}
        {openSeries.length > 0 && (
          <section>
            <h2 className="title-premium text-xs uppercase mb-3">{t.communityBadgeArtTitle}</h2>
            <div
              className="rounded-2xl p-4 flex flex-col gap-3"
              style={{
                background: "rgba(201,154,46,0.07)",
                border: "1px solid rgba(201,154,46,0.22)",
              }}
            >
              <p className="text-xs" style={{ color: "#7a5c2e" }}>
                {t.communityBadgeArtSub}
              </p>
              <div className="flex flex-col gap-2">
                {openSeries.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setActiveSeriesId(s.id);
                      setView("series");
                    }}
                    className="card w-full text-left flex items-center gap-3 transition-shadow hover:shadow-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium truncate">{s.name}</p>
                        <span
                          className="text-[9px] font-bold tracking-wide px-1.5 py-0.5 rounded-full shrink-0"
                          style={{
                            background: "rgba(201,154,46,0.20)",
                            color: "#b08830",
                            border: "1px solid rgba(201,154,46,0.40)",
                          }}
                        >
                          {t.seriesOpenPill}
                        </span>
                      </div>
                      <p className="text-xs text-white/40">
                        {monthNames[(s.month ?? 1) - 1]} {s.day} · {t.seriesVoteLabel}
                      </p>
                    </div>
                    <span className="text-white/30 shrink-0">›</span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

      </div>

      {showBulkGreet && connectedAccount && walletClient && (
        <BulkGreetingModal
          onClose={() => setShowBulkGreet(false)}
          senderAddress={connectedAccount}
          walletClient={walletClient}
          chainId={chainId}
        />
      )}
    </div>
  );
}
