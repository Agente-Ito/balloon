import { useEffect, useState } from "react";
import { addMonths, subMonths, format } from "date-fns";
import { es as esLocale } from "date-fns/locale";
import toast from "react-hot-toast";
import { useAppStore } from "@/store/useAppStore";
import { useProfileData } from "@/hooks/useUniversalProfile";
import { useReplaceEvents } from "@/hooks/useUniversalProfile";
import { useCalendar } from "@/hooks/useCalendar";
import { useSocialCalendar } from "@/hooks/useSocialCalendar";
import { useDrops } from "@/hooks/useDrops";
import { useGridSize } from "@/lib/useGridSize";
import { CalendarGrid } from "./CalendarGrid";
import { CalendarFrame } from "./CalendarFrame";
import { DayPopover } from "./DayPopover";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Avatar } from "@/components/Avatar";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ViewToolbar } from "@/components/ViewToolbar";
import { SendGreetingModal } from "@/components/SendGreetingModal";
import { QuickGreetingModal } from "@/components/QuickGreetingModal";
import { useLSP3Name } from "@/hooks/useLSP3Name";
import { useLocalReminders } from "@/hooks/useLocalReminders";
import { useWebPush } from "@/hooks/useWebPush";
import { useT } from "@/hooks/useT";
import { CelebrationType } from "@/types";
import type { CelebrationDay, Address } from "@/types";
import type { WalletClient, PublicClient } from "viem";

interface CalendarViewProps {
  walletClient?: WalletClient;
  publicClient: PublicClient;
  chainId: number;
}

interface OwnCalendarRow {
  id: string;
  rawDate: string;
  title: string;
  typeLabel: string;
  statusLabel: string;
  statusClassName: string;
  actionLabel: string;
  action: () => Promise<void> | void;
  secondaryActionLabel?: string;
  secondaryAction?: () => Promise<void> | void;
}

function ProfileNameLine({ address, chainId }: { address: Address; chainId: number }) {
  const { data: profileName } = useLSP3Name(address, chainId);
  return <>{profileName ?? `${address.slice(0, 8)}…${address.slice(-6)}`}</>;
}

export function CalendarView({ chainId, walletClient }: CalendarViewProps) {
  const INDEXER_URL = (import.meta.env.VITE_INDEXER_URL as string | undefined)?.replace(/\/$/, "") ?? "http://localhost:3001/api";
  const {
    contextProfile,
    connectedAccount,
    setView,
    setActiveDropId,
    triggerBurst,
    goBack,
    setEditorEntry,
    setPendingEventDraft,
    lang,
  } = useAppStore();
  const t = useT();
  const [month, setMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<CelebrationDay | null>(null);
  const [quickGreetingRecipient, setQuickGreetingRecipient] = useState<Address | null>(null);
  const [onchainGreetingRecipient, setOnchainGreetingRecipient] = useState<Address | null>(null);
  const isLargeGrid = useGridSize();
  const [showFriends, setShowFriends] = useState(false);
  const [showSocialDrops, setShowSocialDrops] = useState(false);
  const [showCalendarExtras, setShowCalendarExtras] = useState(false);
  const [showOnlyActiveReminders, setShowOnlyActiveReminders] = useState(() => {
    try {
      return localStorage.getItem("celebrations:calendar:only-active-reminders") === "1";
    } catch {
      return false;
    }
  });

  const { data: profileData, isLoading } = useProfileData(contextProfile, chainId);
  const isOwner = contextProfile?.toLowerCase() === connectedAccount?.toLowerCase();
  const { reminders: localReminders, deleteReminder: deleteLocalReminder } = useLocalReminders(
    isOwner ? (contextProfile as Address | null) : null
  );
  const mergedProfileData = isOwner && profileData
    ? { ...profileData, events: [...profileData.events, ...localReminders] }
    : profileData;
  useWebPush(isOwner ? (contextProfile as Address | null) : null, true);
  const { celebrationDays, todayCelebrations } = useCalendar({ profileData: mergedProfileData, month });
  const replaceEventsMutation = useReplaceEvents({
    walletClient: walletClient as WalletClient,
    upAddress: contextProfile as Address,
    chainId,
  });
  const { data: ownDrops } = useDrops({
    host: contextProfile as Address | null,
    enabled: !!contextProfile && isOwner,
  });

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

  useEffect(() => {
    if (!contextProfile) {
      setShowCalendarExtras(false);
      return;
    }

    try {
      const key = `celebrations:calendar:show-extras:${contextProfile.toLowerCase()}`;
      setShowCalendarExtras(localStorage.getItem(key) === "1");
    } catch {
      // ignore persistence errors and keep default
      setShowCalendarExtras(false);
    }
  }, [contextProfile]);

  useEffect(() => {
    if (!contextProfile) return;
    try {
      const key = `celebrations:calendar:show-extras:${contextProfile.toLowerCase()}`;
      localStorage.setItem(key, showCalendarExtras ? "1" : "0");
    } catch {
      // ignore persistence errors (private mode, disabled storage)
    }
  }, [contextProfile, showCalendarExtras]);

  const socialProfilesForMonthRaw = ((socialData?.profiles ?? [])
    .filter((p) => p.birthdayMonth === month.getMonth() + 1)
    .sort((a, b) => {
      const dueA = a.reminderDueSoon ? 1 : 0;
      const dueB = b.reminderDueSoon ? 1 : 0;
      if (dueA !== dueB) return dueB - dueA;
      return a.birthdayDay - b.birthdayDay;
    }));

  const activeReminderCount = socialProfilesForMonthRaw.filter((p) => p.reminderDueSoon).length;

  const socialProfilesForMonth = socialProfilesForMonthRaw
    .filter((p) => (showOnlyActiveReminders ? !!p.reminderDueSoon : true));

  const hasExtraSections = isOwner || socialProfilesForMonthRaw.length > 0 || (socialData?.drops ?? []).length > 0;
  const [showCalendarTitleImage, setShowCalendarTitleImage] = useState(true);

  useEffect(() => {
    if (!isOwner || !contextProfile) return;

    const ownDueToday = todayCelebrations
      .filter((c) => !c.profileAddress && c.type === CelebrationType.CustomEvent)
      .sort((a, b) => a.id.localeCompare(b.id));

    if (ownDueToday.length === 0) return;

    const todayKey = format(new Date(), "yyyy-MM-dd");
    const signature = ownDueToday.map((c) => c.id).join(",");
    const storageKey = `celebrations:reminder-toast:${contextProfile.toLowerCase()}:${todayKey}`;

    try {
      if (localStorage.getItem(storageKey) === signature) return;
      localStorage.setItem(storageKey, signature);
    } catch {
      // If storage is unavailable (private mode), still show notification once per render.
    }

    const firstTitle = ownDueToday[0]?.title ?? (lang === "es" ? "Recordatorio" : "Reminder");
    const extra = ownDueToday.length - 1;
    const body = extra > 0
      ? (lang === "es"
          ? `${firstTitle} y ${extra} más para hoy`
          : `${firstTitle} and ${extra} more for today`)
      : firstTitle;

    toast.success(body, { duration: 6000 });
    triggerBurst("celebration", "mixed");

    void fetch(`${INDEXER_URL}/push/reminder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profileAddress: contextProfile,
        title: lang === "es" ? "Recordatorio de celebración" : "Celebration reminder",
        body,
        tag: `celebrations-reminder-${todayKey}`,
        url: "/",
      }),
    }).catch(() => {
      // Ignore server push errors and keep local notification flow.
    });

    if (typeof window !== "undefined" && "Notification" in window) {
      const title = lang === "es" ? "Recordatorio de celebración" : "Celebration reminder";
      const showBrowserNotification = () => {
        try {
          new Notification(title, {
            body,
            icon: "/favicon.svg",
            tag: `celebrations-reminder-${todayKey}`,
          });
        } catch {
          // Ignore browser notification failures in embedded/webview contexts.
        }
      };

      if (Notification.permission === "granted") {
        showBrowserNotification();
      } else if (Notification.permission === "default") {
        void Notification.requestPermission().then((permission) => {
          if (permission === "granted") showBrowserNotification();
        }).catch(() => {
          // Permission prompt may be unavailable in some environments.
        });
      }
    }
  }, [INDEXER_URL, contextProfile, isOwner, lang, todayCelebrations, triggerBurst]);

  const activeFilterLabel = isLargeGrid
    ? t.calendarFilterActiveReminders
    : t.calendarFilterActiveShort;

  const formatRowDate = (rawDate: string) => {
    const locale = lang === "es" ? esLocale : undefined;
    const yearPattern = isLargeGrid ? "yyyy" : "yy";

    if (/^\d{2}-\d{2}$/.test(rawDate)) {
      const [mm, dd] = rawDate.split("-").map(Number);
      const pseudo = new Date(Date.UTC(2000, mm - 1, dd));
      return format(pseudo, "d MMM", { locale });
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
      const [yyyy, mm, dd] = rawDate.split("-").map(Number);
      const parsed = new Date(Date.UTC(yyyy, mm - 1, dd));
      return format(parsed, `d MMM ${yearPattern}`, { locale });
    }

    return rawDate;
  };

  const parseRawDate = (rawDate: string): Date | null => {
    if (/^\d{2}-\d{2}$/.test(rawDate)) {
      const [mm, dd] = rawDate.split("-").map(Number);
      const now = new Date();
      const currentYear = now.getUTCFullYear();
      const todayUTC = new Date(Date.UTC(currentYear, now.getUTCMonth(), now.getUTCDate()));
      const thisYearOccurrence = new Date(Date.UTC(currentYear, mm - 1, dd));
      const targetYear = thisYearOccurrence.getTime() < todayUTC.getTime() ? currentYear + 1 : currentYear;
      return new Date(Date.UTC(targetYear, mm - 1, dd));
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
      const [yyyy, mm, dd] = rawDate.split("-").map(Number);
      return new Date(Date.UTC(yyyy, mm - 1, dd));
    }
    return null;
  };

  const getRowStatusMeta = (rawDate: string) => {
    const parsed = parseRawDate(rawDate);
    if (!parsed) {
      return {
        label: t.myCalendarStatusUpcoming,
        className: "bg-white/10 text-white/70 border-white/15",
      };
    }

    const today = new Date();
    const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const targetUTC = new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));

    if (targetUTC.getTime() === todayUTC.getTime()) {
      return {
        label: t.myCalendarStatusToday,
        className: "bg-lukso-pink/15 text-lukso-pink border-lukso-pink/30",
      };
    }

    if (targetUTC.getTime() > todayUTC.getTime()) {
      return {
        label: t.myCalendarStatusUpcoming,
        className: "bg-lukso-purple/15 text-lukso-purple border-lukso-purple/30",
      };
    }

    return {
      label: t.myCalendarStatusPast,
      className: "bg-white/10 text-white/55 border-white/15",
    };
  };

  const ownCalendarRows: OwnCalendarRow[] = isOwner
    ? [
        ...localReminders.map((event) => ({
          ...(() => {
            const status = getRowStatusMeta(event.date);
            return {
              statusLabel: status.label,
              statusClassName: status.className,
            };
          })(),
          id: `local-event:${event.id}`,
          rawDate: event.date,
          title: event.title,
          typeLabel: t.myCalendarTypeReminder,
          actionLabel: t.rowEdit,
          action: async () => {
            setPendingEventDraft(event);
            setEditorEntry("dates", "quickCreate");
            setView("editor");
          },
          secondaryActionLabel: t.rowDelete,
          secondaryAction: async () => {
            if (!window.confirm(t.myCalendarDeleteConfirm)) return;
            deleteLocalReminder(event.id);
            toast.success(t.toastEventDeleted);
          },
        })),
        ...(profileData?.events ?? []).map((event) => ({
          ...(() => {
            const status = getRowStatusMeta(event.date);
            return {
              statusLabel: status.label,
              statusClassName: status.className,
            };
          })(),
          id: `event:${event.id}`,
          rawDate: event.date,
          title: event.title,
          typeLabel: t.myCalendarTypeReminder,
          actionLabel: t.rowEdit,
          action: async () => {
            setPendingEventDraft(event);
            setEditorEntry("dates", "quickCreate");
            setView("editor");
          },
          secondaryActionLabel: t.rowDelete,
          secondaryAction: async () => {
            if (!window.confirm(t.myCalendarDeleteConfirm)) return;
            if (!walletClient) {
              toast.error(t.toastNoWallet);
              return;
            }
            try {
              const nextEvents = (profileData?.events ?? []).filter((e) => e.id !== event.id);
              await replaceEventsMutation.mutateAsync(nextEvents);
              toast.success(t.toastEventDeleted);
            } catch (err) {
              console.error("[calendar-delete-event]", err);
              toast.error(t.toastFailedDeleteEvent);
            }
          },
        })),
        ...((ownDrops ?? []).map((drop) => {
          const yyyy = drop.year > 0 ? drop.year : new Date().getFullYear();
          const mm = String(drop.month).padStart(2, "0");
          const dd = String(drop.day).padStart(2, "0");
          return {
            ...(() => {
              const status = getRowStatusMeta(`${yyyy}-${mm}-${dd}`);
              return {
                statusLabel: status.label,
                statusClassName: status.className,
              };
            })(),
            id: `drop:${drop.dropId}`,
            rawDate: `${yyyy}-${mm}-${dd}`,
            title: drop.name,
            typeLabel: t.myCalendarTypeDrop,
            actionLabel: t.rowEdit,
            action: async () => {
              setView("drops-manage");
            },
          };
        })),
      ].sort((a, b) => a.rawDate.localeCompare(b.rawDate))
    : [];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <ViewToolbar
        onBack={() => goBack("grid")}
        backLabel={t.navHome}
        title={showCalendarTitleImage ? (
          <img
            src="/calendar-title.png"
            alt={t.calendarTitle}
            className="h-9 sm:h-10 w-auto mx-auto"
            onError={() => setShowCalendarTitleImage(false)}
          />
        ) : t.calendarTitle}
        right={<LanguageToggle />}
      />

      {/* Decorative frame container with month navigation */}
      <CalendarFrame isLoading={isLoading}>
        {/* Month navigation - inside frame at top */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setMonth((m) => subMonths(m, 1))}
            className="w-8 h-8 rounded-full bg-[#fff4da]/70 border border-[#dbc49a] hover:bg-[#ffeec7] text-[#5a3d0a] flex items-center justify-center text-sm transition-colors"
          >
            ‹
          </button>
          <span className="font-semibold text-[#4a3510]">{format(month, "MMMM yyyy")}</span>
          <button
            onClick={() => setMonth((m) => addMonths(m, 1))}
            className="w-8 h-8 rounded-full bg-[#fff4da]/70 border border-[#dbc49a] hover:bg-[#ffeec7] text-[#5a3d0a] flex items-center justify-center text-sm transition-colors"
          >
            ›
          </button>
        </div>

        {/* Calendar body content - scrollable within frame */}
        <div className="flex-1 overflow-y-auto pr-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <LoadingSpinner />
          </div>
        ) : (
          <CalendarGrid
            month={month}
            celebrationDays={celebrationDays}
            onDayClick={handleDayClick}
            selectedDate={selectedDay?.date ?? null}
          />
        )}

        {hasExtraSections && (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => setShowCalendarExtras((v) => !v)}
              className="btn-ghost text-xs py-1.5 px-3 border border-lukso-border"
            >
              {showCalendarExtras ? t.uiDismiss : t.uiShowDetails}
            </button>
          </div>
        )}

        {showCalendarExtras && isOwner && (
          <div className="mt-4">
            <p className="title-premium text-xs uppercase mb-2">
              {t.myCalendarTitle}
            </p>
            {ownCalendarRows.length === 0 ? (
              <div className="card text-center py-4 text-sm text-[#7b6950]">
                {t.myCalendarEmpty}
              </div>
            ) : (
              <div className="space-y-2">
                {ownCalendarRows.map((row) => (
                  <div key={row.id} className="card flex items-center gap-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-[#7b6950] whitespace-nowrap">{formatRowDate(row.rawDate)}</p>
                      <p className="text-sm font-medium truncate">{row.title}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#fff5dc] border border-[#d7bf90] text-[#6b4a12]">
                      {row.typeLabel}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${row.statusClassName}`}>
                      {row.statusLabel}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          void row.action();
                        }}
                        className="btn-ghost text-xs py-1.5 px-2.5 border border-lukso-border"
                      >
                        {row.actionLabel}
                      </button>
                      {row.secondaryAction && (
                        <button
                          type="button"
                          onClick={() => {
                            void row.secondaryAction?.();
                          }}
                          className="text-xs py-1.5 px-2 text-[#7d6a4d] hover:text-[#4e3810]"
                        >
                          {row.secondaryActionLabel}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Social section: friends' birthdays this month — collapsed by default */}
        {showCalendarExtras && socialProfilesForMonthRaw.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between gap-2 py-1 mb-2">
              <button
                onClick={() => setShowFriends((v) => !v)}
                className="flex items-center gap-2 min-w-0 group"
              >
                <p className={`title-premium text-xs uppercase truncate ${
                  isLargeGrid ? "text-[#7b6950]" : "text-[#6f5c3f]"
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
                          ? "bg-[#fff6e4]/80 border-[#d9c49b] text-[#7b6950] hover:text-[#4f3a1d]"
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
                  <p className="text-xs text-[#7b6950] px-1 py-2">
                    {t.calendarNoActiveReminders}
                  </p>
                ) : socialProfilesForMonth.map((p) => (
                    <div key={p.address} className="card flex items-center gap-3">
                      <Avatar address={p.address as Address} size={28} />
                      <div className="flex-1">
                        <p className="text-xs text-white/60">
                          <ProfileNameLine address={p.address as Address} chainId={chainId} />
                        </p>
                        <p className="text-xs text-[#7b6950]">
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
        {showCalendarExtras && (socialData?.drops ?? []).length > 0 && (
          <div className="mt-4 pb-4">
            <button
              onClick={() => setShowSocialDrops((v) => !v)}
              className="flex items-center justify-between w-full py-1 mb-2 group"
            >
              <p className="title-premium text-xs uppercase">
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
                      <p className="text-xs text-[#7b6950]">
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
      </CalendarFrame>

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
