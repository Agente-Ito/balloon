import { useState } from "react";
import toast from "react-hot-toast";
import { useT } from "@/hooks/useT";
import { useAppStore } from "@/store/useAppStore";
import { useProfileData, useSetBirthday, useAddEvent, useAddWishlistItem } from "@/hooks/useUniversalProfile";
import { EventForm } from "./EventForm";
import { WishlistForm } from "./WishlistForm";
import { SettingsForm } from "./SettingsForm";
import { DropForm } from "./DropForm";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { CELEBRATION_EMOJIS } from "@/constants/celebrationTypes";
import { useCreateDrop, type CreateDropParams } from "@/hooks/useCreateDrop";
import { useDrops } from "@/hooks/useDrops";
import { useUPCreationDate } from "@/hooks/useUPCreationDate";
import { computeAnniversary } from "@/lib/upCreationDate";
import { anniversarySVGToFile } from "@/lib/anniversaryBadge";
import type { Celebration, WishlistItem, Address } from "@/types";
import { CelebrationType } from "@/types";
import type { WalletClient, PublicClient } from "viem";
import { format, fromUnixTime } from "date-fns";

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

interface EditorProps {
  walletClient?: WalletClient;
  publicClient: PublicClient;
  chainId: number;
}

type EditorTab = "dates" | "wishlist" | "settings" | "drops";
type SubView = "main" | "addEvent" | "addWishlist" | "addDrop";

export function Editor({ walletClient, chainId }: EditorProps) {
  const { contextProfile, setView, pendingDropDate, setPendingDropDate } = useAppStore();
  const t = useT();
  const [activeTab, setActiveTab] = useState<EditorTab>("dates");

  // If coming from the calendar "Create drop for this day" action,
  // open the drop form immediately and consume the pending date.
  const [subView, setSubView] = useState<SubView>(() =>
    pendingDropDate ? "addDrop" : "main"
  );

  const { data: profileData, isLoading } = useProfileData(contextProfile, chainId);

  const { mutateAsync: setBirthday, isPending: isSavingBirthday } = useSetBirthday({
    walletClient: walletClient!,
    upAddress: contextProfile as Address,
  });

  const { mutateAsync: addEvent } = useAddEvent({
    walletClient: walletClient!,
    upAddress: contextProfile as Address,
    chainId,
  });

  const { mutateAsync: addWishlistItem } = useAddWishlistItem({
    walletClient: walletClient!,
    upAddress: contextProfile as Address,
    chainId,
  });

  const createDropMutation = useCreateDrop(walletClient ?? null, chainId);
  const { data: myDrops } = useDrops({ host: contextProfile as Address | null, enabled: activeTab === "drops" });

  // UP creation date → anniversary hint
  const { data: upCreationDate } = useUPCreationDate(contextProfile as Address | null, chainId);
  const anniversaryInfo = upCreationDate ? computeAnniversary(upCreationDate) : null;

  // After saving an event, offer to create a drop from it
  const [pendingDropFromEvent, setPendingDropFromEvent] = useState<Celebration | null>(null);

  const [birthdayMonth, setBirthdayMonth] = useState("");
  const [birthdayDay, setBirthdayDay] = useState("");
  const [birthdayYear, setBirthdayYear] = useState("");

  // Populate fields when profileData loads
  const currentBirthday = profileData?.birthday ?? "";
  const birthdayDisplay = (() => {
    if (!currentBirthday) return "Not set";
    if (currentBirthday.startsWith("--")) {
      const [, mm, dd] = currentBirthday.split("-");
      return `${MONTH_NAMES[parseInt(mm) - 1]} ${dd}`;
    }
    const [yyyy, mm, dd] = currentBirthday.split("-");
    return `${MONTH_NAMES[parseInt(mm) - 1]} ${dd}, ${yyyy}`;
  })();

  const handleSaveBirthday = async () => {
    if (!birthdayMonth || !birthdayDay) return;
    if (!walletClient) {
      toast.error(t.toastNoWallet);
      return;
    }
    // Store as --MM-DD (year omitted) or YYYY-MM-DD if year provided
    const mm = birthdayMonth.padStart(2, "0");
    const dd = birthdayDay.padStart(2, "0");
    const value = birthdayYear ? `${birthdayYear}-${mm}-${dd}` : `--${mm}-${dd}`;
    try {
      await setBirthday(value);
      toast.success(t.toastBirthdaySaved);
    } catch (err) {
      console.error("[handleSaveBirthday]", err);
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg.slice(0, 100) || "Failed to save birthday");
    }
  };

  const handleAddEvent = async (event: Celebration) => {
    if (!walletClient) {
      toast.error(t.toastNoWallet);
      return;
    }
    try {
      await addEvent(event);
      toast.success(t.toastEventAdded);
      // Offer to create a drop for this event
      setPendingDropFromEvent(event);
      setSubView("main");
      setActiveTab("dates");
    } catch (err) {
      console.error("[handleAddEvent] failed:", err);
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg.slice(0, 120) || "Failed to add event");
    }
  };

  const handleAddWishlistItem = async (item: WishlistItem) => {
    if (!walletClient) {
      toast.error(t.toastNoWallet);
      return;
    }
    try {
      await addWishlistItem(item);
      toast.success(t.toastWishlistAdded);
      setSubView("main");
    } catch (err) {
      console.error("[handleAddWishlistItem] failed:", err);
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg.slice(0, 80) || "Failed to add item");
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (subView === "addEvent") {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-lukso-border">
          <button onClick={() => setSubView("main")} className="text-white/40 hover:text-white text-sm">
            {t.back}
          </button>
          <span className="font-semibold">{t.subAddEvent}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <EventForm onSave={handleAddEvent} onCancel={() => setSubView("main")} />
        </div>
      </div>
    );
  }

  if (subView === "addWishlist") {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-lukso-border">
          <button onClick={() => setSubView("main")} className="text-white/40 hover:text-white text-sm">
            {t.back}
          </button>
          <span className="font-semibold">{t.subAddWishlist}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <WishlistForm onSave={handleAddWishlistItem} onCancel={() => setSubView("main")} />
        </div>
      </div>
    );
  }

  if (subView === "addDrop") {
    // Build pre-fill priority: event→drop > calendar date > anniversary > blank
    const prefill = (() => {
      if (pendingDropFromEvent) {
        const [yy, mm, dd] = pendingDropFromEvent.date.split("-");
        return {
          name: pendingDropFromEvent.title,
          description: pendingDropFromEvent.description,
          celebrationType: pendingDropFromEvent.type,
          month: Number(mm),
          day: Number(dd),
          year: Number(yy) || new Date().getFullYear(),
        };
      }
      if (pendingDropDate) {
        const [yy, mm, dd] = pendingDropDate.split("-");
        return {
          month: Number(mm),
          day: Number(dd),
          year: Number(yy) || new Date().getFullYear(),
        };
      }
      if (anniversaryInfo) {
        const d = anniversaryInfo.nextDate;
        return {
          name: `My UP ${anniversaryInfo.upcomingYears}-Year Anniversary`,
          description: `I'm celebrating ${anniversaryInfo.upcomingYears} year${anniversaryInfo.upcomingYears !== 1 ? "s" : ""} on LUKSO! Claim this badge to celebrate with me.`,
          celebrationType: CelebrationType.UPAnniversary,
          month: d.getMonth() + 1,
          day: d.getDate(),
          year: d.getFullYear(),
          imageFile: anniversarySVGToFile(anniversaryInfo.upcomingYears),
        };
      }
      return undefined;
    })();

    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-lukso-border">
          <button
            onClick={() => {
              setSubView("main");
              setPendingDropFromEvent(null);
              setPendingDropDate(null);
            }}
            className="text-white/40 hover:text-white text-sm"
          >
            {pendingDropDate ? `← ${t.calendarTitle}` : t.back}
          </button>
          <span className="font-semibold">
            {pendingDropDate
              ? `${t.dropForEvent} ${format(new Date(pendingDropDate), "MMM d")}`
              : prefill?.name
                ? `${t.dropForEvent} "${prefill.name}"`
                : t.subAddDrop}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <DropForm
            host={contextProfile as Address}
            isSaving={createDropMutation.isPending}
            prefill={prefill}
            onCancel={() => {
              setSubView("main");
              setPendingDropFromEvent(null);
              setPendingDropDate(null);
            }}
            onSave={async (params: CreateDropParams) => {
              try {
                await createDropMutation.mutateAsync(params);
                toast.success(t.toastDropCreated);
                setSubView("main");
                setPendingDropFromEvent(null);
                setPendingDropDate(null);
              } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                toast.error(msg.slice(0, 120) || "Failed to create drop");
              }
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={() => setView("grid")} className="text-white/40 hover:text-white text-sm">
          {t.back}
        </button>
        <span className="font-semibold">{t.editorTitle}</span>
        <div className="w-12" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 mb-3">
        {(["dates", "drops", "wishlist", "settings"] as EditorTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors ${
              activeTab === tab ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
            }`}
          >
            {tab === "dates" ? t.tabDates : tab === "drops" ? t.tabDrops : tab === "wishlist" ? t.tabWishlist : t.tabSettings}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        {activeTab === "dates" && (
          <>
            {/* Post-event drop prompt */}
            {pendingDropFromEvent && (
              <div className="card bg-lukso-purple/10 border-lukso-purple/30 animate-bounce-in">
                <p className="text-sm font-semibold text-lukso-purple mb-1">
                  {t.dropPromptTitle}
                </p>
                <p className="text-xs text-lukso-purple/60 mb-3">
                  {t.dropPromptSub} <span className="text-lukso-purple/80 font-medium">{pendingDropFromEvent.title}</span>
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPendingDropFromEvent(null)}
                    className="btn-ghost flex-1 text-xs py-1.5 border border-lukso-border"
                  >
                    {t.skip}
                  </button>
                  <button
                    onClick={() => setSubView("addDrop")}
                    className="btn-primary flex-1 text-xs py-1.5"
                  >
                    {t.dropPromptCreate}
                  </button>
                </div>
              </div>
            )}

            {/* UP Anniversary hint */}
            {anniversaryInfo && !pendingDropFromEvent && (
              <div className={`card border animate-bounce-in ${
                anniversaryInfo.isToday
                  ? "bg-lukso-purple/20 border-lukso-purple/50"
                  : "bg-white/5 border-lukso-border"
              }`}>
                {anniversaryInfo.isToday ? (
                  <>
                    <p className="text-sm font-semibold text-lukso-purple mb-1">
                      {t.anniversaryToday}
                    </p>
                    <p className="text-xs text-white/50 mb-3">
                      {t.anniversaryTodaySub} <strong className="text-white">{anniversaryInfo.upcomingYears} {anniversaryInfo.upcomingYears !== 1 ? t.anniversaryTodayUnit2 : t.anniversaryTodayUnit}</strong>
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold mb-1">
                      {t.anniversaryUpcoming}
                    </p>
                    <p className="text-xs text-white/50 mb-3">
                      {t.anniversaryUpcomingSub} <strong className="text-white">{anniversaryInfo.upcomingYears}</strong> {t.anniversaryUpcomingOn}{" "}
                      <strong className="text-white">
                        {format(anniversaryInfo.nextDate, "MMMM d, yyyy")}
                      </strong>
                    </p>
                  </>
                )}
                <button
                  onClick={() => { setPendingDropFromEvent(null); setSubView("addDrop"); }}
                  className="btn-primary w-full text-xs py-1.5"
                >
                  {anniversaryInfo.isToday ? t.anniversaryTodayCta : t.anniversaryUpcomingCta}
                </button>
              </div>
            )}

            {/* Birthday */}
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wide font-medium mb-2">
                {t.birthday}
              </p>
              <div className="card">
                <p className="text-xs text-white/50 mb-3">
                  {t.birthdayCurrent} <span className="text-white">{birthdayDisplay}</span>
                </p>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div>
                    <label className="block text-[10px] text-white/40 mb-1">{t.birthdayMonth}</label>
                    <select
                      value={birthdayMonth}
                      onChange={(e) => setBirthdayMonth(e.target.value)}
                      className="input text-sm py-1.5"
                    >
                      <option value="">—</option>
                      {MONTH_NAMES.map((m, i) => (
                        <option key={m} value={String(i + 1)}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-white/40 mb-1">{t.birthdayDay}</label>
                    <select
                      value={birthdayDay}
                      onChange={(e) => setBirthdayDay(e.target.value)}
                      className="input text-sm py-1.5"
                    >
                      <option value="">—</option>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={String(d)}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-white/40 mb-1">{t.birthdayYear} <span className="text-white/25">{t.birthdayYearOpt}</span></label>
                    <input
                      type="number"
                      value={birthdayYear}
                      onChange={(e) => setBirthdayYear(e.target.value)}
                      placeholder="e.g. 1990"
                      min={1900}
                      max={new Date().getFullYear()}
                      className="input text-sm py-1.5"
                    />
                  </div>
                </div>
                <button
                  onClick={handleSaveBirthday}
                  disabled={isSavingBirthday || !birthdayMonth || !birthdayDay}
                  className="btn-primary w-full flex items-center justify-center gap-1"
                >
                  {isSavingBirthday ? <LoadingSpinner size="sm" /> : t.birthdaySave}
                </button>
              </div>
            </div>

            {/* Custom events */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-white/40 uppercase tracking-wide font-medium">
                  {t.eventsTitle}
                </p>
                <button
                  onClick={() => setSubView("addEvent")}
                  className="text-xs text-lukso-purple hover:text-lukso-purple/80"
                >
                  {t.add}
                </button>
              </div>

              {profileData?.events.length === 0 ? (
                <div className="card text-center py-4">
                  <p className="text-sm text-white/30">{t.eventsEmpty}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {profileData?.events.map((event) => (
                    <div key={event.id} className="card flex items-center gap-3">
                      <span className="text-xl">{CELEBRATION_EMOJIS[event.type]}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{event.title}</p>
                        <p className="text-xs text-white/40">
                          {event.date} · {event.recurring ? t.eventsRecurring : t.eventsOneTime}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "wishlist" && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-white/40 uppercase tracking-wide font-medium">
                {t.wishlistTitle}
              </p>
              <button
                onClick={() => setSubView("addWishlist")}
                className="text-xs text-lukso-purple hover:text-lukso-purple/80"
              >
                {t.add}
              </button>
            </div>

            {profileData?.wishlist.length === 0 ? (
              <div className="card text-center py-6">
                <p className="text-2xl mb-2">📭</p>
                <p className="text-sm text-white/30">{t.wishlistEmpty}</p>
                <button
                  onClick={() => setSubView("addWishlist")}
                  className="btn-secondary mt-3 text-xs px-3 py-1"
                >
                  {t.wishlistAdd}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {profileData?.wishlist.map((item) => (
                  <div key={item.id} className="card flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-lg">
                      🎁
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-white/40 capitalize">{item.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "drops" && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-white/40 uppercase tracking-wide font-medium">
                {t.dropsTitle}
              </p>
              <button
                onClick={() => setSubView("addDrop")}
                className="text-xs text-lukso-purple hover:text-lukso-purple/80"
              >
                {t.create}
              </button>
            </div>

            {!myDrops || myDrops.length === 0 ? (
              <div className="card text-center py-6">
                <p className="text-2xl mb-2">🎁</p>
                <p className="text-sm text-white/30 mb-3">{t.dropsEmpty}</p>
                <p className="text-xs text-white/20 mb-3">{t.dropsEmptySub}</p>
                <button
                  onClick={() => setSubView("addDrop")}
                  className="btn-primary text-xs px-3 py-1.5"
                >
                  {t.dropsFirstDrop}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {myDrops.map((drop) => (
                  <div key={drop.dropId} className="card flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">{drop.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        drop.isActive
                          ? "bg-green-500/20 text-green-400"
                          : "bg-white/10 text-white/40"
                      }`}>
                        {drop.isActive ? t.dropsActive : t.dropsClosed}
                      </span>
                    </div>
                    <p className="text-xs text-white/40">
                      {drop.claimed} {t.dropsClaimed}
                      {drop.maxSupply != null ? ` / ${drop.maxSupply}` : ""}
                      {" · "}
                      {String(drop.month).padStart(2, "0")}-{String(drop.day).padStart(2, "0")}
                      {drop.year > 0 ? `-${drop.year}` : ""}
                    </p>
                    {drop.endAt != null && (
                      <p className="text-xs text-white/30">
                        {t.dropsCloses} {format(fromUnixTime(drop.endAt), "MMM d, yyyy")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "settings" && profileData && walletClient && (
          <SettingsForm
            settings={profileData.settings}
            walletClient={walletClient}
          />
        )}
      </div>
    </div>
  );
}
