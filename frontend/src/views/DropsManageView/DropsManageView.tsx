/**
 * DropsManageView — dedicated view for managing your own drop campaigns.
 *
 * Shows the connected user's drops (active + closed), allows navigating to
 * the DropDetailView for each, and provides direct access to create a new drop.
 * Shares the same tab header as DropsDiscoverView for consistent context.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { format, fromUnixTime } from "date-fns";
import { useAppStore } from "@/store/useAppStore";
import { useDrops } from "@/hooks/useDrops";
import { useLSP3Name } from "@/hooks/useLSP3Name";
import { useT } from "@/hooks/useT";
import { useAllSeries } from "@/hooks/useSeries";
import { useRegistryOwner } from "@/hooks/useRegistryOwner";
import { Avatar } from "@/components/Avatar";
import { LanguageToggle } from "@/components/LanguageToggle";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ViewToolbar } from "@/components/ViewToolbar";
import { DropForm } from "@/views/Editor/DropForm";
import type { DropSourceOption } from "@/views/Editor/DropForm";
import { useCreateDrop } from "@/hooks/useCreateDrop";
import { GLOBAL_HOLIDAYS } from "@/constants/celebrationTypes";
import toast from "react-hot-toast";
import type { Address, IndexedDrop } from "@/types";
import { CelebrationType } from "@/types";
import type { WalletClient } from "viem";
import type { CreateDropParams } from "@/hooks/useCreateDrop";

interface DropsManageViewProps {
  walletClient?: WalletClient;
  chainId: number;
}

function DropRow({
  drop,
  host,
  hostName,
  chainId,
  onViewDetail,
  isRecentlyCreated = false,
}: {
  drop: IndexedDrop;
  host: Address;
  hostName?: string;
  chainId: number;
  onViewDetail: (dropId: string) => void;
  isRecentlyCreated?: boolean;
}) {
  const t = useT();

  const dateLabel = `${String(drop.month).padStart(2, "0")}-${String(drop.day).padStart(2, "0")}${drop.year > 0 ? `-${drop.year}` : ""}`;

  return (
    <div className={`card flex flex-col gap-1.5 transition-shadow ${isRecentlyCreated ? "ring-2 ring-lukso-purple/40 shadow-foil-hover" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {drop.imageIPFS ? (
            <img
              src={
                drop.imageIPFS.startsWith("data:")
                  ? drop.imageIPFS
                  : `https://gateway.pinata.cloud/ipfs/${drop.imageIPFS}`
              }
              alt={drop.name}
              className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-lukso-pink/20 flex-shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{drop.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Avatar address={host} size={16} chainId={chainId} className="ring-1 ring-white/20" />
              <span className="text-[11px] text-lukso-purple/90 truncate">
                {hostName ?? `${host.slice(0, 6)}…${host.slice(-4)}`}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {isRecentlyCreated && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-lukso-purple/15 text-lukso-purple border border-lukso-purple/30 shrink-0">
              {t.dropsNewBadge}
            </span>
          )}
          <span
            className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
              drop.isActive
                ? "bg-amber-500/20 text-amber-300"
                : "bg-white/10 text-white/40"
            }`}
          >
            {drop.isActive ? t.dropsActive : t.dropsClosed}
          </span>
        </div>
      </div>

      <p className="text-xs text-white/40">
        {drop.claimed} {t.dropsClaimed}
        {drop.maxSupply != null ? ` / ${drop.maxSupply}` : ""}
        {" · "}
        {dateLabel}
      </p>

      {drop.endAt != null && (
        <p className="text-xs text-white/30">
          {t.dropsCloses} {format(fromUnixTime(drop.endAt), "MMM d, yyyy")}
        </p>
      )}

      <button
        onClick={() => onViewDetail(drop.dropId)}
        className="btn-ghost text-xs mt-1 w-full"
      >
        {t.dropDetails}
      </button>
    </div>
  );
}

export function DropsManageView({ walletClient, chainId }: DropsManageViewProps) {
  const {
    connectedAccount,
    setView,
    setActiveDropId,
    setActiveSeriesId,
    goBack,
    triggerBurst,
    postCreateDropNotice,
    setPostCreateDropNotice,
    clearPostCreateDropNotice,
    pendingDropCreate,
    setPendingDropCreate,
    lang,
  } = useAppStore();
  const t = useT();
  const { data: allSeries } = useAllSeries();
  const openSeries = (allSeries ?? []).filter((s) => s.submissionOpen);
  const { data: registryOwner } = useRegistryOwner(chainId);
  const extraAdmins = (import.meta.env.VITE_ADMIN_ADDRESSES ?? "")
    .split(",")
    .map((a: string) => a.trim().toLowerCase())
    .filter(Boolean);
  const isAdmin =
    !!connectedAccount &&
    (
      (!!registryOwner && connectedAccount.toLowerCase() === registryOwner) ||
      extraAdmins.includes(connectedAccount.toLowerCase())
    );

  const [addingDrop, setAddingDrop] = useState(false);
  const [globalHolidayMode, setGlobalHolidayMode] = useState(false);
  const [selectedGlobalSourceId, setSelectedGlobalSourceId] = useState<string | null>(null);

  const globalHolidaySourceOptions: DropSourceOption[] = GLOBAL_HOLIDAYS.map((h) => {
    const [month, day] = h.date.split("-").map(Number);
    return {
      id: `event:${h.id}`,
      label: `${h.emoji} ${lang === "es" ? (h.titleEs ?? h.title) : h.title}`,
      suggestedName: lang === "es" ? (h.titleEs ?? h.title) : h.title,
      suggestedDescription: lang === "es" ? (h.descEs ?? h.description) : h.description,
      celebrationType: CelebrationType.GlobalHoliday,
      month,
      day,
      templateId: "holiday",
    };
  });

  // If coming from a "crear celebración" CTA, open the form immediately
  useEffect(() => {
    if (pendingDropCreate && connectedAccount) {
      setAddingDrop(true);
      setPendingDropCreate(false);
    }
  }, [pendingDropCreate, connectedAccount, setPendingDropCreate]);

  const { data: myDrops, isLoading } = useDrops({
    host: connectedAccount as Address | null,
    enabled: !!connectedAccount,
  });
  const { data: hostName } = useLSP3Name(connectedAccount, chainId);

  const createDropMutation = useCreateDrop(walletClient ?? null, chainId);

  const handleCreate = async (params: CreateDropParams) => {
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
      setPostCreateDropNotice({
        name: params.name,
        month: params.month,
        day: params.day,
        year: params.year,
        createdAt: Date.now(),
      });
      setAddingDrop(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t.toastFailedDrop);
    }
  };

  const handleViewDetail = (dropId: string) => {
    setActiveDropId(dropId);
    setView("drop-detail");
  };

  const [noticeVisible, setNoticeVisible] = useState(false);
  const noticeClearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep notice visible while the drop is still being indexed; auto-dismiss after ready+3s
  useEffect(() => {
    if (!postCreateDropNotice) {
      setNoticeVisible(false);
      return;
    }
    setNoticeVisible(true);
    // Clear any previous timer
    if (noticeClearTimer.current) clearTimeout(noticeClearTimer.current);
    // Schedule auto-dismiss
    noticeClearTimer.current = setTimeout(() => {
      clearPostCreateDropNotice();
      setNoticeVisible(false);
    }, 45_000);
    return () => { if (noticeClearTimer.current) clearTimeout(noticeClearTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postCreateDropNotice]);

  const recentNoticeActive = noticeVisible && !!postCreateDropNotice;
  const matchedRecentDrop = recentNoticeActive
    ? (myDrops ?? []).find((drop) =>
        drop.name === postCreateDropNotice!.name
        && drop.month === postCreateDropNotice!.month
        && drop.day === postCreateDropNotice!.day
        && drop.year === postCreateDropNotice!.year
      )
    : null;
  const matchedDropReady = !!matchedRecentDrop && !matchedRecentDrop.dropId.startsWith("pending-");

  // Auto-dismiss 3s after the drop is confirmed ready
  const prevReadyRef = useRef(false);
  useEffect(() => {
    if (matchedDropReady && !prevReadyRef.current) {
      prevReadyRef.current = true;
      if (noticeClearTimer.current) clearTimeout(noticeClearTimer.current);
      noticeClearTimer.current = setTimeout(() => {
        clearPostCreateDropNotice();
        setNoticeVisible(false);
      }, 6_000);
    }
    if (!recentNoticeActive) prevReadyRef.current = false;
  }, [matchedDropReady, recentNoticeActive, clearPostCreateDropNotice]);

  // Scroll newly confirmed drop row into view
  const recentDropRowRef = useCallback((node: HTMLDivElement | null) => {
    if (node && matchedDropReady) {
      node.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [matchedDropReady]);

  // ── Global holiday picker ──────────────────────────────────────────────────
  if (globalHolidayMode && !addingDrop && connectedAccount) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <ViewToolbar
          onBack={() => setGlobalHolidayMode(false)}
          backLabel={t.back}
          title={t.dropsAdminCreateGlobal}
          right={<LanguageToggle />}
        />
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            {GLOBAL_HOLIDAYS.map((h) => {
              const [month, day] = h.date.split("-").map(Number);
              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => {
                    setSelectedGlobalSourceId(`event:${h.id}`);
                    setAddingDrop(true);
                  }}
                  className="card flex flex-col items-center gap-2 py-4 hover:border-lukso-purple/40 transition-colors text-center"
                >
                  <span className="text-3xl">{h.emoji}</span>
                  <p className="text-xs font-medium leading-tight">{lang === "es" ? (h.titleEs ?? h.title) : h.title}</p>
                  <p className="text-[10px] text-white/40">{String(month).padStart(2, "0")}/{String(day).padStart(2, "0")}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Create drop form ────────────────────────────────────────────────────────
  if (addingDrop && connectedAccount) {
    const isGlobal = globalHolidayMode && !!selectedGlobalSourceId;
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <ViewToolbar
          onBack={() => {
            setAddingDrop(false);
            if (globalHolidayMode) {
              setSelectedGlobalSourceId(null);
              // stay in picker
            }
          }}
          backLabel={t.back}
          title={t.addDrop}
          right={<LanguageToggle />}
        />
        <div key="drop-form-scroll" className="flex-1 overflow-y-auto px-4 py-4">
          <DropForm
            host={connectedAccount}
            chainId={chainId}
            onSave={async (params) => {
              await handleCreate(params);
              setGlobalHolidayMode(false);
              setSelectedGlobalSourceId(null);
            }}
            onCancel={() => {
              setAddingDrop(false);
              if (globalHolidayMode) setSelectedGlobalSourceId(null);
            }}
            isSaving={createDropMutation.isPending}
            {...(isGlobal ? {
              sourceOptions: globalHolidaySourceOptions,
              initialSourceId: selectedGlobalSourceId,
            } : {})}
          />
        </div>
      </div>
    );
  }

  // ── Main manage view ────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <ViewToolbar
        onBack={() => goBack("grid")}
        backLabel={t.navHome}
        right={
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5 rounded-lg p-0.5" style={{ background: "rgba(106,27,154,0.07)" }}>
              <button
                onClick={() => setView("drops")}
                className="title-premium text-xs px-3 py-1 rounded-md whitespace-nowrap transition-colors"
                style={{ color: "#8B7D7D" }}
              >
                {t.dropsManageTabExplore}
              </button>
              <button
                className="title-premium text-xs px-3 py-1 rounded-md whitespace-nowrap"
                style={{ background: "rgba(106,27,154,0.15)", color: "#6A1B9A" }}
              >
                {t.dropsManageTabManage}
              </button>
              <button
                onClick={() => {
                  if (openSeries.length > 0) {
                    setActiveSeriesId(openSeries[0].id);
                    setView("series");
                  } else {
                    setView("drops");
                  }
                }}
                className="title-premium text-xs px-3 py-1 rounded-md whitespace-nowrap transition-colors relative"
                style={{ color: openSeries.length > 0 ? "#c99a2e" : "#C0A870", opacity: openSeries.length > 0 ? 1 : 0.55 }}
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

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {/* ── Create new drop inline CTA ─────────────────────────────────── */}
        {connectedAccount && (
          <button
            onClick={() => setAddingDrop(true)}
            className="w-full flex items-center justify-center gap-2 rounded-2xl border border-dashed border-lukso-purple/40 py-2.5 text-sm font-medium transition-colors hover:bg-lukso-purple/5 active:bg-lukso-purple/10"
            style={{ color: "#6A1B9A" }}
          >
            <span className="text-base leading-none">+</span>
            <span className="title-premium text-xs">{t.subAddDrop}</span>
          </button>
        )}

        {recentNoticeActive && (
          <div className="card border-lukso-purple/30 bg-lukso-purple/10 animate-banner-in">
            <p className="title-premium text-sm text-lukso-purple mb-1">{t.dropCreatedBannerTitle}</p>
            <p className="text-xs text-lukso-purple/75 mb-3">
              {matchedDropReady ? t.dropCreatedBannerReady : t.dropCreatedBannerIndexing}
            </p>
            <div className="flex flex-wrap gap-2">
              {matchedDropReady ? (
                <button
                  type="button"
                  onClick={() => {
                    handleViewDetail(matchedRecentDrop!.dropId);
                    clearPostCreateDropNotice();
                  }}
                  className="btn-secondary text-xs px-3 py-1.5"
                >
                  {t.uiShowDetails}
                </button>
              ) : (
                <span className="text-xs px-3 py-1.5 rounded-full border border-lukso-purple/25 text-lukso-purple/80 bg-white/50">
                  {t.dropCreatedBannerPublishing}
                </span>
              )}

              <button
                type="button"
                onClick={() => {
                  clearPostCreateDropNotice();
                  setAddingDrop(true);
                }}
                className="btn-primary text-xs px-3 py-1.5"
              >
                {t.uiCreateAnother}
              </button>

              <button
                type="button"
                onClick={clearPostCreateDropNotice}
                className="btn-ghost text-xs px-3 py-1.5 border border-lukso-border"
              >
                {t.uiDismiss}
              </button>
            </div>
          </div>
        )}

        {!connectedAccount ? (
          <div className="card text-center py-8">
            <p className="text-sm text-white/30">{t.dropsManageNotOwner}</p>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : !myDrops || myDrops.length === 0 ? (
          <div className="card text-center py-8 flex flex-col items-center gap-3">
            <p className="text-sm text-white/30">{t.dropsEmpty}</p>
            <p className="text-xs text-white/20">{t.dropsEmptySub}</p>
            <button
              onClick={() => setAddingDrop(true)}
              className="btn-primary text-xs px-4 py-1.5"
            >
              {t.dropsFirstDrop}
            </button>
          </div>
        ) : (
          <>
            {/* Active drops first */}
            {myDrops.filter((d) => d.isActive).length > 0 && (
              <section>
                <h2 className="title-premium text-xs uppercase mb-3">
                  {t.dropsActive}
                </h2>
                <div className="flex flex-col gap-3">
                  {myDrops
                    .filter((d) => d.isActive)
                    .map((drop) => {
                      const isRecent = recentNoticeActive && !!postCreateDropNotice
                        && drop.name === postCreateDropNotice.name
                        && drop.month === postCreateDropNotice.month
                        && drop.day === postCreateDropNotice.day
                        && drop.year === postCreateDropNotice.year;
                      return (
                        <div key={drop.dropId} ref={isRecent ? recentDropRowRef : undefined}>
                          <DropRow
                            drop={drop}
                            host={connectedAccount}
                            hostName={hostName}
                            chainId={chainId}
                            onViewDetail={handleViewDetail}
                            isRecentlyCreated={isRecent}
                          />
                        </div>
                      );
                    })}
                </div>
              </section>
            )}

            {/* Closed drops */}
            {myDrops.filter((d) => !d.isActive).length > 0 && (
              <section>
                <h2 className="title-premium text-xs uppercase mb-3">
                  {t.dropsClosed}
                </h2>
                <div className="flex flex-col gap-3">
                  {myDrops
                    .filter((d) => !d.isActive)
                    .map((drop) => (
                      <DropRow
                        key={drop.dropId}
                        drop={drop}
                        host={connectedAccount}
                        hostName={hostName}
                        chainId={chainId}
                        onViewDetail={handleViewDetail}
                        isRecentlyCreated={recentNoticeActive && !!postCreateDropNotice && drop.name === postCreateDropNotice.name && drop.month === postCreateDropNotice.month && drop.day === postCreateDropNotice.day && drop.year === postCreateDropNotice.year}
                      />
                    ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* ── Admin ──────────────────────────────────────────────────────────── */}
        {isAdmin && (
          <section>
            <h2 className="title-premium text-xs uppercase mb-3">{t.dropsAdminSection}</h2>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  setGlobalHolidayMode(true);
                  setSelectedGlobalSourceId(null);
                }}
                className="btn-primary text-xs"
              >
                {t.dropsAdminCreateGlobal}
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
