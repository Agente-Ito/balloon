import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { useT } from "@/hooks/useT";
import { getMonthNames } from "@/lib/monthNames";
import { useGridSize } from "@/lib/useGridSize";
import { useAppStore } from "@/store/useAppStore";
import { useProfileData, useSetBirthday, useAddEvent, useAddWishlistItem, useQuickSetupBatch, useReplaceEvents } from "@/hooks/useUniversalProfile";
import { useLSP3Name } from "@/hooks/useLSP3Name";
import { EventForm } from "./EventForm";
import { QuickSetupForm } from "./QuickSetupForm";
import { QuickCreateFlow } from "./QuickCreateFlow";
import { WishlistForm } from "./WishlistForm";
import { SettingsForm } from "./SettingsForm";
import { DropForm, type DropSourceOption } from "./DropForm";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ViewToolbar } from "@/components/ViewToolbar";
import { CELEBRATION_COLORS } from "@/constants/celebrationTypes";
import { useCreateDrop, type CreateDropParams } from "@/hooks/useCreateDrop";
import { useUPCreationDate } from "@/hooks/useUPCreationDate";
import { useLocalReminders } from "@/hooks/useLocalReminders";
import { computeAnniversary } from "@/lib/upCreationDate";
import { anniversarySVGToFile } from "@/lib/anniversaryBadge";
import type { Celebration, WishlistItem, Address } from "@/types";
import { CelebrationType } from "@/types";
import type { WalletClient, PublicClient } from "viem";
import { format } from "date-fns";

interface EditorProps {
  walletClient?: WalletClient;
  publicClient: PublicClient;
  chainId: number;
}

type EditorTab = "dates" | "wishlist" | "settings";
type SubView = "main" | "addEvent" | "addWishlist" | "addDrop" | "quickSetup" | "quickCreate";
type SetupMode = "quick" | "step";

export function Editor({ walletClient, chainId }: EditorProps) {
  const {
    contextProfile,
    setView,
    goBack,
    setActiveCelebrationDate,
    pendingDropDate,
    setPendingDropDate,
    pendingAnniversaryDrop,
    setPendingAnniversaryDrop,
    pendingEventDraft,
    setPendingEventDraft,
    editorEntryTab,
    editorEntrySubView,
    clearEditorEntry,
    triggerBurst,
    setPostCreateDropNotice,
  } = useAppStore();
  const t = useT();
  const monthNames = useMemo(() => getMonthNames(t), [t]);
  const initialEditorEntry = useMemo(() => ({
    tab: editorEntryTab,
    subView: editorEntrySubView,
  }), []);
  const [activeTab, setActiveTab] = useState<EditorTab>(
    editorEntryTab === "settings" ? editorEntryTab : "dates"
  );

  // If coming from the calendar "Create drop for this day" action,
  // open the drop form immediately and consume the pending date.
  const [subView, setSubView] = useState<SubView>(() =>
    pendingDropDate
      ? "addDrop"
      : (editorEntrySubView ?? "main")
  );

  // Entry intent should only affect the first render of Editor.
  useEffect(() => {
    if (editorEntryTab || editorEntrySubView) {
      clearEditorEntry();
    }
  }, [editorEntryTab, editorEntrySubView, clearEditorEntry]);

  const { data: profileData, isLoading } = useProfileData(contextProfile, chainId);
  const {
    reminders: localReminders,
    saveReminder,
    updateReminder,
  } = useLocalReminders(contextProfile as Address | null);

  const { mutateAsync: setBirthday, isPending: isSavingBirthday } = useSetBirthday({
    walletClient: walletClient!,
    upAddress: contextProfile as Address,
    chainId,
  });

  const addEventMutation = useAddEvent({
    walletClient: walletClient!,
    upAddress: contextProfile as Address,
    chainId,
  });

  const { mutateAsync: addWishlistItem } = useAddWishlistItem({
    walletClient: walletClient!,
    upAddress: contextProfile as Address,
    chainId,
  });

  const quickSetupMutation = useQuickSetupBatch({
    walletClient: walletClient!,
    upAddress: contextProfile as Address,
    chainId,
  });

  const createDropMutation = useCreateDrop(walletClient ?? null, chainId);
  const replaceEventsMutation = useReplaceEvents({
    walletClient: walletClient!,
    upAddress: contextProfile as Address,
    chainId,
  });

  // UP creation date → anniversary hint
  const { data: upCreationDate } = useUPCreationDate(contextProfile as Address | null, chainId);
  const anniversaryInfo = upCreationDate ? computeAnniversary(upCreationDate) : null;

  // LSP3 profile name — used to personalize drop prefills
  const { data: profileName, isLoading: isNameLoading } = useLSP3Name(contextProfile as Address | null, chainId);

  // After saving an event, offer to create a drop from it
  const [pendingDropFromEvent, setPendingDropFromEvent] = useState<Celebration | null>(null);
  const [pendingDropTemplateId, setPendingDropTemplateId] = useState<string | null>(null);
  const [quickCreateAsCelebration, setQuickCreateAsCelebration] = useState(false);

  const [birthdayMonth, setBirthdayMonth] = useState("");
  const [birthdayDay, setBirthdayDay] = useState("");
  const [birthdayYear, setBirthdayYear] = useState("");
  const [isBirthdayEditing, setIsBirthdayEditing] = useState(false);
  const [preferredSetupMode, setPreferredSetupMode] = useState<SetupMode | null>(null);

  const currentBirthday = profileData?.birthday ?? "";
  const hasBirthdayConfigured = !!currentBirthday;
  const ownerEvents = [...(profileData?.events ?? []), ...localReminders];
  const hasCustomEvents = ownerEvents.length > 0;
  const showFirstSteps = !hasBirthdayConfigured || !hasCustomEvents;
  const canUseQuickSetup = !hasBirthdayConfigured && !hasCustomEvents;

  useEffect(() => {
    try {
      const value = localStorage.getItem("celebrations:first-steps-mode");
      if (value === "quick" || value === "step") {
        setPreferredSetupMode(value);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const rememberSetupMode = (mode: SetupMode) => {
    setPreferredSetupMode(mode);
    try {
      localStorage.setItem("celebrations:first-steps-mode", mode);
    } catch {
      // ignore storage errors
    }
  };

  const resetSetupModePreference = () => {
    setPreferredSetupMode(null);
    try {
      localStorage.removeItem("celebrations:first-steps-mode");
    } catch {
      // ignore storage errors
    }
  };

  const toolbarActions = (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => {
          setSubView("main");
          setActiveTab("settings");
        }}
        aria-label={t.tabSettings}
        title={t.tabSettings}
        className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border transition-all duration-200 flex items-center justify-center p-0"
        style={{
          borderColor: activeTab === "settings" && subView === "main" ? "rgba(201,154,46,0.92)" : "#E8D9C8",
          background: activeTab === "settings" && subView === "main"
            ? "linear-gradient(180deg, rgba(246,231,191,0.95) 0%, rgba(233,211,158,0.92) 100%)"
            : "rgba(255,255,255,0.05)",
          boxShadow: activeTab === "settings" && subView === "main"
            ? "0 0 0 2px rgba(201,154,46,0.18), 0 10px 24px rgba(156,116,33,0.18)"
            : "none",
          transform: activeTab === "settings" && subView === "main" ? "translateY(-1px)" : "translateY(0)",
        }}
      >
        <img
          src="/settings-gear.png"
          alt={t.tabSettings}
          className="w-[92%] h-[92%] object-contain"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/settings-gear-metallic.svg";
          }}
        />
      </button>
      <LanguageToggle />
    </div>
  );

  const exitQuickCreate = () => {
    setPendingEventDraft(null);
    setQuickCreateAsCelebration(false);

    if (initialEditorEntry.subView === "quickCreate" && !pendingEventDraft) {
      goBack("grid");
      return;
    }

    setSubView("main");
  };

  // Pre-populate form fields when profile data loads
  useEffect(() => {
    if (!currentBirthday) return;
    if (currentBirthday.startsWith("--")) {
      const mm = currentBirthday.slice(2, 4);
      const dd = currentBirthday.slice(5, 7);
      setBirthdayMonth(String(parseInt(mm)));
      setBirthdayDay(String(parseInt(dd)));
      setBirthdayYear("");
    } else {
      const [yyyy, mm, dd] = currentBirthday.split("-");
      setBirthdayMonth(String(parseInt(mm)));
      setBirthdayDay(String(parseInt(dd)));
      setBirthdayYear(yyyy ?? "");
    }
  }, [currentBirthday, monthNames]);

  const birthdayDisplay = (() => {
    if (!currentBirthday) return null;
    if (currentBirthday.startsWith("--")) {
      const mm = currentBirthday.slice(2, 4);
      const dd = currentBirthday.slice(5, 7);
      return `${monthNames[parseInt(mm) - 1]} ${dd}`;
    }
    const [yyyy, mm, dd] = currentBirthday.split("-");
    return `${monthNames[parseInt(mm) - 1]} ${dd}, ${yyyy}`;
  })();

  const formatSourceDate = (month: number, day: number, year?: number) => {
    const monthLabel = monthNames[month - 1] ?? String(month);
    return year ? `${monthLabel} ${day}, ${year}` : `${monthLabel} ${day}`;
  };

  const getNextOccurrenceYear = (month: number, day: number) => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const candidate = new Date(today.getFullYear(), month - 1, day);
    return candidate < todayStart ? today.getFullYear() + 1 : today.getFullYear();
  };

  const birthdaySourceOption = useMemo<DropSourceOption | null>(() => {
    if (!currentBirthday) return null;

    let birthYear: number | undefined;
    let month: number;
    let day: number;

    if (currentBirthday.startsWith("--")) {
      month = Number(currentBirthday.slice(2, 4));
      day = Number(currentBirthday.slice(5, 7));
    } else {
      const [yyyy, mm, dd] = currentBirthday.split("-").map(Number);
      birthYear = yyyy;
      month = mm;
      day = dd;
    }

    const celebrationYear = getNextOccurrenceYear(month, day);
    const suggestedName = birthYear
      ? `${t.typeBirthday} ${celebrationYear - birthYear}`
      : t.typeBirthday;
    const suggestedDescription = profileName
      ? t.birthdayDropDesc.replace("{name}", profileName)
      : undefined;

    return {
      id: "birthday",
      label: `${t.typeBirthday} · ${formatSourceDate(month, day, birthYear)}`,
      suggestedName,
      suggestedDescription,
      celebrationType: CelebrationType.Birthday,
      month,
      day,
      year: celebrationYear,
      templateId: "birthday",
    };
  }, [currentBirthday, monthNames, profileName, t]);

  const anniversarySourceOption = useMemo<DropSourceOption | null>(() => {
    if (!anniversaryInfo) return null;
    const unit = anniversaryInfo.upcomingYears !== 1
      ? t.anniversaryDropDescUnitPlural
      : t.anniversaryDropDescUnit;
    return {
      id: "anniversary",
      label: `${t.typeAnniversary} · ${format(anniversaryInfo.nextDate, "MMM d, yyyy")}`,
      suggestedName: `${t.typeAnniversary} ${anniversaryInfo.upcomingYears}`,
      suggestedDescription: t.anniversaryDropDesc
        .replace("{name}", profileName ?? contextProfile?.slice(0, 8) ?? "")
        .replace("{n}", String(anniversaryInfo.upcomingYears))
        .replace("{unit}", unit),
      celebrationType: CelebrationType.UPAnniversary,
      month: anniversaryInfo.nextDate.getMonth() + 1,
      day: anniversaryInfo.nextDate.getDate(),
      year: anniversaryInfo.nextDate.getFullYear(),
      templateId: "anniversary",
    };
  }, [anniversaryInfo, contextProfile, profileName, t]);

  const dropSourceOptions = useMemo<DropSourceOption[]>(() => {
    const sources: DropSourceOption[] = [];

    if (birthdaySourceOption) sources.push(birthdaySourceOption);

    ownerEvents.forEach((event) => {
      const parts = event.date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!parts) return;
      const [, yyyy, mm, dd] = parts;
      sources.push({
        id: `event:${event.id}`,
        label: `${event.title} · ${formatSourceDate(Number(mm), Number(dd), Number(yyyy))}`,
        suggestedName: event.title,
        suggestedDescription: event.description,
        celebrationType: event.type,
        month: Number(mm),
        day: Number(dd),
        year: Number(yyyy),
        templateId:
          event.type === CelebrationType.Birthday
            ? "birthday"
            : event.type === CelebrationType.UPAnniversary
              ? "anniversary"
              : event.type === CelebrationType.GlobalHoliday
                ? "holiday"
                : "celebration",
      });
    });

    if (anniversarySourceOption) sources.push(anniversarySourceOption);

    if (pendingDropDate) {
      const [yyyy, mm, dd] = pendingDropDate.split("-").map(Number);
      const alreadyPresent = sources.some((source) => (
        source.month === mm && source.day === dd && (source.year ?? yyyy) === yyyy
      ));

      if (!alreadyPresent) {
        sources.unshift({
          id: `context:${pendingDropDate}`,
          label: `${t.quickCreateDate} · ${formatSourceDate(mm, dd, yyyy)}`,
          suggestedName: t.addDrop,
          celebrationType: CelebrationType.CustomEvent,
          month: mm,
          day: dd,
          year: yyyy,
          templateId: "celebration",
        });
      }
    }

    return sources;
  }, [anniversarySourceOption, birthdaySourceOption, ownerEvents, pendingDropDate, t]);

  const initialDropSourceId = useMemo(() => {
    if (pendingDropFromEvent) return `event:${pendingDropFromEvent.id}`;
    if (pendingAnniversaryDrop && anniversarySourceOption) return anniversarySourceOption.id;
    if (pendingDropDate) {
      const [, mm, dd] = pendingDropDate.split("-").map(Number);
      if (birthdaySourceOption && birthdaySourceOption.month === mm && birthdaySourceOption.day === dd) {
        return birthdaySourceOption.id;
      }
      const eventMatch = ownerEvents.find((event) => event.date === pendingDropDate);
      if (eventMatch) return `event:${eventMatch.id}`;
      return `context:${pendingDropDate}`;
    }
    return dropSourceOptions[0]?.id ?? null;
  }, [anniversarySourceOption, birthdaySourceOption, dropSourceOptions, ownerEvents, pendingAnniversaryDrop, pendingDropDate, pendingDropFromEvent]);

  // Anniversary dismiss — persisted per year so it re-shows next anniversary
  const anniversaryDismissKey = anniversaryInfo
    ? `celebrations:anniversary-dismissed:${anniversaryInfo.nextDate.getFullYear()}`
    : null;
  const [anniversaryDismissed, setAnniversaryDismissed] = useState(false);
  const isLargeGrid = useGridSize();
  // Anniversary card starts expanded on large tiles, collapsed on small
  const [anniversaryExpanded, setAnniversaryExpanded] = useState(() => isLargeGrid);

  useEffect(() => {
    if (!anniversaryDismissKey) return;
    setAnniversaryDismissed(localStorage.getItem(anniversaryDismissKey) === "1");
  }, [anniversaryDismissKey]);

  const dismissAnniversary = () => {
    if (anniversaryDismissKey) localStorage.setItem(anniversaryDismissKey, "1");
    setAnniversaryDismissed(true);
  };

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
      setIsBirthdayEditing(false);
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
      await addEventMutation.mutateAsync(event);
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
        <ViewToolbar
          onBack={() => setSubView("main")}
          backLabel={t.back}
          title={t.subAddEvent}
          right={toolbarActions}
        />
        <div className="flex-1 overflow-y-auto p-4">
          <EventForm onSave={handleAddEvent} onCancel={() => setSubView("main")} />
        </div>
      </div>
    );
  }

  if (subView === "quickCreate") {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <ViewToolbar
          onBack={exitQuickCreate}
          backLabel={t.back}
          title={quickCreateAsCelebration ? t.quickCreateTabCelebration : t.quickCreateTabReminder}
          right={toolbarActions}
        />
        <div className="flex-1 overflow-y-auto p-4">
          <QuickCreateFlow
            initialEvent={pendingEventDraft ?? undefined}
            profileName={profileName ?? undefined}
            onModeChange={setQuickCreateAsCelebration}
            isSaving={addEventMutation.isPending || replaceEventsMutation.isPending}
            onCancel={exitQuickCreate}
            onSubmit={async ({ event, createDrop, templateId }) => {
              if (!walletClient) {
                toast.error(t.toastNoWallet);
                return;
              }
              try {
                if (pendingEventDraft) {
                  if (pendingEventDraft.storage === "local") {
                    const updatedLocalEvent: Celebration = {
                      ...pendingEventDraft,
                      title: event.title,
                      date: event.date,
                      description: event.description,
                      storage: "local",
                    };

                    updateReminder(updatedLocalEvent);
                    toast.success(t.toastEventUpdated);

                    if (createDrop) {
                      setPendingDropTemplateId(templateId ?? null);
                      setPendingDropFromEvent(updatedLocalEvent);
                      setPendingAnniversaryDrop(false);
                      setPendingEventDraft(null);
                      setSubView("addDrop");
                      return;
                    }

                    setPendingEventDraft(null);
                    setSubView("main");
                    return;
                  }

                  const updatedEvent: Celebration = {
                    ...pendingEventDraft,
                    title: event.title,
                    date: event.date,
                    description: event.description,
                  };

                  const nextEvents = (profileData?.events ?? []).map((existing) =>
                    existing.id === pendingEventDraft.id ? updatedEvent : existing
                  );

                  await replaceEventsMutation.mutateAsync(nextEvents);
                  toast.success(t.toastEventUpdated);

                  if (createDrop) {
                    setPendingDropTemplateId(templateId ?? null);
                    setPendingDropFromEvent(updatedEvent);
                    setPendingAnniversaryDrop(false);
                    setPendingEventDraft(null);
                    setSubView("addDrop");
                    return;
                  }

                  setPendingEventDraft(null);
                  setSubView("main");
                  return;
                }

                if (createDrop) {
                  triggerBurst("celebration", "mixed");
                  setPendingDropTemplateId(templateId ?? null);
                  setPendingDropFromEvent({ ...event, storage: "local" });
                  setPendingAnniversaryDrop(false);
                  setPendingEventDraft(null);
                  setSubView("addDrop");
                  return;
                }

                saveReminder({ ...event, storage: "local" });
                toast.success(t.toastLocalReminderSaved);
                triggerBurst("celebration", "mixed");
                setPendingEventDraft(null);
                setSubView("main");
              } catch (err) {
                console.error("[quickCreate] failed:", err);
                const msg = err instanceof Error ? err.message : String(err);
                toast.error(msg.slice(0, 120) || (pendingEventDraft ? t.toastFailedUpdateEvent : t.toastFailedEvent));
              }
            }}
          />
        </div>
      </div>
    );
  }

  if (subView === "quickSetup") {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <ViewToolbar
          onBack={() => setSubView("main")}
          backLabel={t.back}
          title={t.quickSetupTitle}
          right={toolbarActions}
        />

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <QuickSetupForm
            isSaving={quickSetupMutation.isPending}
            onCancel={() => setSubView("main")}
            onSave={async ({ birthday, event, settings }) => {
              if (!walletClient) {
                toast.error(t.toastNoWallet);
                return;
              }
              try {
                await quickSetupMutation.mutateAsync({ birthday, event, settings });
                toast.success(t.toastQuickSetupSaved);
                triggerBurst("celebration", "mixed");
                setPendingDropFromEvent(event);
                setSubView("main");
              } catch (err) {
                console.error("[quickSetup] failed:", err);
                const msg = err instanceof Error ? err.message : String(err);
                toast.error(msg.slice(0, 120) || t.toastQuickSetupFailed);
              }
            }}
          />
        </div>
      </div>
    );
  }

  if (subView === "addWishlist") {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <ViewToolbar
          onBack={() => setSubView("main")}
          backLabel={t.back}
          title={t.subAddWishlist}
          right={toolbarActions}
        />
        <div className="flex-1 overflow-y-auto p-4">
          <WishlistForm onSave={handleAddWishlistItem} onCancel={() => setSubView("main")} />
        </div>
      </div>
    );
  }

  if (subView === "addDrop") {
    // When the prefill needs the profile name (anniversary or birthday-from-calendar),
    // wait for it to finish loading so the DropForm initializes with the correct value.
    const prefillNeedsName = !pendingDropFromEvent && (!!pendingDropDate || !!anniversaryInfo);
    if (prefillNeedsName && isNameLoading) {
      return (
        <div className="h-full flex items-center justify-center">
          <LoadingSpinner />
        </div>
      );
    }

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
          templateId: pendingDropTemplateId ?? undefined,
        };
      }
      if (pendingDropDate) {
        const [yy, mm, dd] = pendingDropDate.split("-");
        const name = birthdaySourceOption?.suggestedName ?? (profileName
          ? t.birthdayDropName.replace("{name}", profileName)
          : "");
        const desc = birthdaySourceOption?.suggestedDescription ?? (profileName
          ? t.birthdayDropDesc.replace("{name}", profileName)
          : "");
        return {
          name,
          description: desc,
          month: Number(mm),
          day: Number(dd),
          year: Number(yy) || new Date().getFullYear(),
        };
      }
      if (anniversaryInfo && pendingAnniversaryDrop) {
        const d = anniversaryInfo.nextDate;
        const n = String(anniversaryInfo.upcomingYears);
        const namePrefix = profileName ?? contextProfile?.slice(0, 8) ?? "";
        const annName = profileName
          ? t.anniversaryDropNameProfile.replace("{name}", profileName).replace("{n}", n)
          : t.anniversaryDropNameNoProfile.replace("{n}", n);
        const unit = anniversaryInfo.upcomingYears !== 1
          ? t.anniversaryDropDescUnitPlural
          : t.anniversaryDropDescUnit;
        const annDesc = t.anniversaryDropDesc
          .replace("{name}", namePrefix)
          .replace("{n}", n)
          .replace("{unit}", unit);
        return {
          name: annName,
          description: annDesc,
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
        <ViewToolbar
          onBack={() => {
            setSubView("main");
            setPendingDropFromEvent(null);
            setPendingDropDate(null);
            setPendingAnniversaryDrop(false);
            setPendingDropTemplateId(null);
          }}
          backLabel={pendingDropDate ? t.calendarTitle : t.back}
          title={
            pendingDropDate
              ? `${t.dropForEvent} ${format(new Date(pendingDropDate), "MMM d")}`
              : prefill?.name
                ? `${t.dropForEvent} "${prefill.name}"`
                : t.subAddDrop
          }
          right={toolbarActions}
        />
        <div key="add-drop-scroll" className="flex-1 overflow-y-auto p-4">
          <DropForm
            host={contextProfile as Address}
            chainId={chainId}
            isSaving={createDropMutation.isPending}
            prefill={prefill}
            sourceOptions={dropSourceOptions}
            initialSourceId={initialDropSourceId}
            onCancel={() => {
              setSubView("main");
              setPendingDropFromEvent(null);
              setPendingDropDate(null);
                setPendingAnniversaryDrop(false);
            }}
            onSave={async (params: CreateDropParams) => {
              try {
                await createDropMutation.mutateAsync(params);
                toast.success(t.toastDropCreated);
                const dropTheme =
                  params.celebrationType === CelebrationType.Birthday
                    ? "birthday"
                    : params.celebrationType === CelebrationType.UPAnniversary
                      ? "anniversary"
                      : params.celebrationType === CelebrationType.GlobalHoliday
                        ? "holiday"
                        : "mixed";
                triggerBurst("celebration", dropTheme);
                setSubView("main");
                setPendingDropFromEvent(null);
                setPendingDropDate(null);
                setPendingAnniversaryDrop(false);
                setPostCreateDropNotice({
                  name: params.name,
                  month: params.month,
                  day: params.day,
                  year: params.year,
                  createdAt: Date.now(),
                });
                setView("drops-manage");
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
      <ViewToolbar
        onBack={() => goBack("grid")}
        backLabel={t.navHome}
        title={t.editorHeaderTitle}
        right={toolbarActions}
      />

      {/* Tabs */}
      <div className="flex gap-1 px-4 pt-2 mb-1">
        {(["dates"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="title-premium flex-1 py-2 rounded-xl text-xs transition-colors"
            style={{
              background: activeTab === tab ? "rgba(106,27,154,0.10)" : "transparent",
              color: activeTab === tab ? "#6A1B9A" : "#8B7D7D",
            }}
          >
            {t.tabDates}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        {activeTab === "dates" && (
          <>
            {/* First-time onboarding: simple, non-modal guidance */}
            {showFirstSteps && (
              canUseQuickSetup ? (
                <div className="card border-lukso-purple/30 bg-lukso-purple/10">
                  <p className="title-premium text-sm text-lukso-purple mb-1">{t.firstStepsTitle}</p>
                  <p className="text-xs text-lukso-purple/70 mb-3">{t.firstStepsSub}</p>
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/80">{t.firstStepsBirthday}</span>
                      <span className={hasBirthdayConfigured ? "text-amber-300" : "text-[#7b6950]"}>
                        {hasBirthdayConfigured ? t.firstStepsDone : "•"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/80">{t.firstStepsReminder}</span>
                      <span className={hasCustomEvents ? "text-amber-300" : "text-[#7b6950]"}>
                        {hasCustomEvents ? t.firstStepsDone : "•"}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {preferredSetupMode && (
                      <div className="flex items-center justify-center gap-2">
                        <p className="text-[11px] text-[#6f5c3f] text-center">
                          {preferredSetupMode === "quick" ? t.firstStepsPersonalizedQuick : t.firstStepsPersonalizedStep}
                        </p>
                        <button
                          type="button"
                          onClick={resetSetupModePreference}
                          className="text-[11px] text-lukso-purple/80 hover:text-lukso-purple underline underline-offset-2"
                        >
                          {t.firstStepsResetPreference}
                        </button>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        rememberSetupMode("quick");
                        setSubView("quickSetup");
                      }}
                      className={`w-full text-xs py-1.5 inline-flex items-center justify-center gap-2 ${
                        preferredSetupMode === "step"
                          ? "btn-ghost border border-lukso-border"
                          : "btn-primary"
                      }`}
                    >
                      {t.firstStepsQuickSetup}
                      {(preferredSetupMode === "quick" || preferredSetupMode === null) && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/15 text-white/80">
                          {t.firstStepsRecommended}
                        </span>
                      )}
                    </button>
                    <p className="text-[11px] text-[#7b6950] text-center">{t.firstStepsStepByStep}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          rememberSetupMode("step");
                          setIsBirthdayEditing(true);
                        }}
                        className={`text-xs py-1.5 border border-lukso-border inline-flex items-center justify-center gap-1 ${
                          preferredSetupMode === "step" ? "btn-secondary" : "btn-ghost"
                        }`}
                      >
                        {t.firstStepsOnlyBirthday}
                        {preferredSetupMode === "step" && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/15 text-white/80">
                            {t.firstStepsRecommended}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          rememberSetupMode("step");
                          setSubView("quickCreate");
                        }}
                        className={`text-xs py-1.5 border border-lukso-border inline-flex items-center justify-center gap-1 ${
                          preferredSetupMode === "step" ? "btn-secondary" : "btn-ghost"
                        }`}
                      >
                        {t.firstStepsOnlyReminder}
                        {preferredSetupMode === "step" && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/15 text-white/80">
                            {t.firstStepsRecommended}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card border-lukso-purple/25 bg-lukso-purple/5 py-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="title-premium text-sm text-lukso-purple">{t.firstStepsTitle}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className={`text-[11px] px-2 py-1 rounded-full border ${hasBirthdayConfigured ? "bg-[#f6e7bf] border-[#c99a2e]/70 text-[#6b4a12]" : "bg-[#fff8ea] border-[#dcc79f] text-[#7b6950]"}`}>
                          {t.firstStepsBirthday} {hasBirthdayConfigured ? "• " + t.firstStepsDone : ""}
                        </span>
                        <span className={`text-[11px] px-2 py-1 rounded-full border ${hasCustomEvents ? "bg-[#f6e7bf] border-[#c99a2e]/70 text-[#6b4a12]" : "bg-[#fff8ea] border-[#dcc79f] text-[#7b6950]"}`}>
                          {t.firstStepsReminder} {hasCustomEvents ? "• " + t.firstStepsDone : ""}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      {!hasBirthdayConfigured && (
                        <button
                          onClick={() => setIsBirthdayEditing(true)}
                          className="btn-primary text-xs px-3 py-1.5"
                        >
                          {t.firstStepsBirthday}
                        </button>
                      )}
                      {!hasCustomEvents && (
                        <button
                          onClick={() => setSubView("quickCreate")}
                          className="btn-ghost text-xs px-3 py-1.5 border border-lukso-border"
                        >
                          {t.firstStepsReminder}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            )}

            {/* Wishlist shortcut — hidden until feature is ready */}

            <div className="rounded-2xl border border-[#E8D9C8] bg-white/60 px-4 py-3 flex flex-col gap-2">
              <div className="min-w-0">
                <p className="title-premium text-[11px] uppercase text-lukso-purple/80 mb-1">
                  {t.tabDrops}
                </p>
                <p className="text-[11px] text-[#7b6950]">
                  {t.dropsManageSubtitle}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setView("drops")}
                  className="btn-ghost text-[11px] px-2.5 py-1.5 flex-1"
                >
                  {t.dropsExploreCta}
                </button>
                <button
                  onClick={() => setView("drops-manage")}
                  className="btn-primary text-[11px] px-2.5 py-1.5 flex-1"
                >
                  {t.dropsManageCta}
                </button>
              </div>
            </div>

            {/* Post-event drop prompt */}
            {pendingDropFromEvent && (
              <div className="rounded-2xl border border-lukso-purple/30 bg-lukso-purple/10 px-3 py-3 animate-bounce-in">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="title-premium text-sm text-lukso-purple mb-1">
                      {t.dropPromptTitle}
                    </p>
                    <p className="text-[11px] text-lukso-purple/65">
                      {t.dropPromptPersonalSub}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <button
                      onClick={() => setPendingDropFromEvent(null)}
                      className="btn-ghost text-[11px] px-2.5 py-1.5 border border-lukso-border"
                    >
                      {t.skip}
                    </button>
                    <button
                      onClick={() => {
                        setActiveCelebrationDate(pendingDropFromEvent.date);
                        setPendingDropFromEvent(null);
                        setView("celebration");
                      }}
                      className="btn-secondary text-[11px] px-2.5 py-1.5"
                    >
                      {t.dropPromptPersonal}
                    </button>
                    <button
                      onClick={() => {
                        setPendingAnniversaryDrop(false);
                        setSubView("addDrop");
                      }}
                      className="btn-primary text-[11px] px-2.5 py-1.5"
                    >
                      {t.dropPromptCreate}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Birthday — display mode when set, edit mode when not set or user clicks Change */}
            <div>
              {birthdayDisplay && !isBirthdayEditing ? (
                <div className="rounded-2xl border border-[#E8D9C8] bg-white/60 px-3 py-2.5 flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="title-premium text-[11px] uppercase text-lukso-purple/80 mb-1">
                      {t.birthday}
                    </p>
                    <p className="text-sm font-medium leading-tight">{birthdayDisplay}</p>
                  </div>
                  <button
                    onClick={() => setIsBirthdayEditing(true)}
                    className="btn-ghost text-[11px] px-2.5 py-1.5 border border-lukso-border flex-shrink-0"
                  >
                    {t.change}
                  </button>
                </div>
              ) : (
                <div className="card">
                  <div className="flex items-center justify-between mb-2">
                    <p className="title-premium text-xs uppercase">
                      {t.birthday}
                    </p>
                  </div>
                  {!birthdayDisplay && (
                    <p className="text-xs text-white/50 mb-3">{t.birthdayCurrent} <span className="text-white/40">{t.birthdayNotSet}</span></p>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
                    <div>
                      <label className="block text-[10px] text-white/40 mb-1">{t.birthdayMonth}</label>
                      <select
                        value={birthdayMonth}
                        onChange={(e) => setBirthdayMonth(e.target.value)}
                        className="input text-sm py-1.5"
                      >
                        <option value="">—</option>
                        {monthNames.map((m, i) => (
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
                        className="input text-sm py-1.5 col-span-2 sm:col-span-1"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {isBirthdayEditing && (
                      <button
                        onClick={() => setIsBirthdayEditing(false)}
                        className="btn-ghost flex-1 text-xs py-1.5 border border-lukso-border"
                      >
                        {t.cancel}
                      </button>
                    )}
                    <button
                      onClick={handleSaveBirthday}
                      disabled={isSavingBirthday || !birthdayMonth || !birthdayDay}
                      className="btn-primary flex-1 flex items-center justify-center gap-1"
                    >
                      {isSavingBirthday ? <LoadingSpinner size="sm" /> : t.birthdaySave}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* UP Anniversary hint — compact pill by default, expands on tap */}
            {anniversaryInfo && !pendingDropFromEvent && !anniversaryDismissed && (
              <div className={`rounded-2xl border px-3 py-2.5 ${
                anniversaryInfo.isToday
                  ? "bg-lukso-purple/20 border-lukso-purple/50"
                  : "bg-white/5 border-lukso-border"
              }`}>
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => setAnniversaryExpanded((v) => !v)}
                    className="flex items-center gap-2 flex-1 text-left"
                  >
                    <span className="w-2 h-2 rounded-full bg-lukso-purple flex-shrink-0" />
                    <p className={`text-sm font-semibold leading-tight ${anniversaryInfo.isToday ? "text-lukso-purple" : ""}`}>
                      {anniversaryInfo.isToday ? t.anniversaryToday : t.anniversaryUpcoming}
                    </p>
                    <span className="text-white/25 text-xs ml-auto">
                      {anniversaryExpanded ? "▲" : "▼"}
                    </span>
                  </button>
                  <button
                    onClick={dismissAnniversary}
                    className="text-white/20 hover:text-white/50 text-xs leading-none flex-shrink-0"
                    aria-label="Dismiss"
                  >
                    ✕
                  </button>
                </div>

                {anniversaryExpanded && (
                  <div className="mt-2.5">
                    {anniversaryInfo.isToday ? (
                      <p className="text-[11px] mb-2.5 leading-tight" style={{ color: "rgba(44,44,44,0.55)" }}>
                        {t.anniversaryTodaySub} <strong style={{ color: "#2C2C2C" }}>{anniversaryInfo.upcomingYears} {anniversaryInfo.upcomingYears !== 1 ? t.anniversaryTodayUnit2 : t.anniversaryTodayUnit}</strong>
                      </p>
                    ) : (
                      <p className="text-[11px] mb-2.5 leading-tight" style={{ color: "rgba(44,44,44,0.55)" }}>
                        {t.anniversaryUpcomingSub} <strong style={{ color: "#2C2C2C" }}>{anniversaryInfo.upcomingYears}</strong> {t.anniversaryUpcomingOn}{" "}
                        <strong style={{ color: "#2C2C2C" }}>
                          {format(anniversaryInfo.nextDate, "MMMM d, yyyy")}
                        </strong>
                      </p>
                    )}
                    <button
                      onClick={() => {
                        setPendingDropFromEvent(null);
                        setPendingAnniversaryDrop(true);
                        setSubView("addDrop");
                      }}
                      className="btn-primary w-full text-[11px] py-1.5"
                    >
                      {anniversaryInfo.isToday ? t.anniversaryTodayCta : t.anniversaryUpcomingCta}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Custom events */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="title-premium text-xs uppercase">
                  {t.eventsTitle}
                </p>
                <button
                  onClick={() => setSubView("quickCreate")}
                  className="text-xs text-lukso-purple hover:text-lukso-purple/80"
                >
                  {t.add}
                </button>
              </div>

              {ownerEvents.length === 0 && !anniversaryDismissed ? (
                <div className="card text-center py-4">
                  <p className="text-sm text-white/30">{t.eventsEmpty}</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {ownerEvents.map((event) => (
                    <div key={event.id} className="rounded-2xl border border-[#E8D9C8] bg-white/60 px-3 py-2.5 flex items-center gap-2.5">
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${CELEBRATION_COLORS[event.type]}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight truncate">{event.title}</p>
                        <p className="text-[11px] text-white/40 leading-tight mt-0.5">
                          {event.date} · {event.recurring ? t.eventsRecurring : t.eventsOneTime}
                        </p>
                      </div>
                      {event.storage === "local" && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-lukso-purple/10 border border-lukso-purple/20 text-lukso-purple whitespace-nowrap">
                          {t.eventsLocalBadge}
                        </span>
                      )}
                    </div>
                  ))}
                  {/* Anniversary shown here once the banner is dismissed */}
                  {anniversaryInfo && anniversaryDismissed && (
                    <div className="rounded-2xl border border-[#E8D9C8] bg-white/60 px-3 py-2.5 flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-purple-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white/60 leading-tight">{t.anniversaryLabel}</p>
                        <p className="text-[11px] text-white/30 leading-tight mt-0.5">
                          {format(anniversaryInfo.nextDate, "MMMM d, yyyy")}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setPendingDropFromEvent(null);
                          setPendingAnniversaryDrop(true);
                          setSubView("addDrop");
                        }}
                        className="text-[11px] text-lukso-purple hover:text-lukso-purple/80 flex-shrink-0"
                      >
                        {t.anniversaryCreateDropShort}
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>
          </>
        )}

        {activeTab === "wishlist" && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="title-premium text-xs uppercase">
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
                <p className="text-sm text-white/30 mb-3">{t.wishlistEmpty}</p>
                <button
                  onClick={() => setSubView("addWishlist")}
                  className="btn-secondary text-xs px-3 py-1"
                >
                  {t.wishlistAdd}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {profileData?.wishlist.map((item) => (
                  <div key={item.id} className="card flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                      <span className="w-4 h-4 rounded-full bg-white/10" />
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
