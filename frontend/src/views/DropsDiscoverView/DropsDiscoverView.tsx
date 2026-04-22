import { useState, useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useDrops } from "@/hooks/useDrops";
import { useDropEligibility } from "@/hooks/useDropEligibility";
import { useClaimDrop } from "@/hooks/useClaimDrop";
import { useSocialCalendar } from "@/hooks/useSocialCalendar";
import { useSocialContacts } from "@/hooks/useSocialContacts";
import { useAllSeries } from "@/hooks/useSeries";
import { useFestivities } from "@/hooks/useFestivities";
import { useRegistryOwner } from "@/hooks/useRegistryOwner";
import { useUPCreationDate } from "@/hooks/useUPCreationDate";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ViewToolbar } from "@/components/ViewToolbar";
import { Avatar } from "@/components/Avatar";
import { LanguageToggle } from "@/components/LanguageToggle";
import { MintBadgeModal } from "@/components/MintBadgeModal";
import { useT } from "@/hooks/useT";
import { useLSP3Name } from "@/hooks/useLSP3Name";
import { getLocalizedDropEligibilityReason } from "@/lib/dropEligibilityReason";
import { getMonthNames } from "@/lib/monthNames";
import { BulkGreetingModal } from "./BulkGreetingModal";
import { CelebrationType } from "@/types";
import type { IndexedDrop, Address } from "@/types";
import type { WalletClient } from "viem";

interface DropsDiscoverViewProps {
  walletClient?: WalletClient;
  chainId: number;
}

// ── helpers ───────────────────────────────────────────────────────────────────

function isTodayAnniversary(created: Date): boolean {
  const now = new Date();
  return created.getMonth() === now.getMonth() && created.getDate() === now.getDate();
}

// ── DropCard ─────────────────────────────────────────────────────────────────

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
            <Avatar
              address={drop.host}
              size={20}
              chainId={chainId}
              className="ring-1 ring-white/20"
            />
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
          <span>
            · {drop.minFollowers}+ {t.dropFollowerReq}
          </span>
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
          {claimMutation.error instanceof Error
            ? claimMutation.error.message
            : t.dropClaimFailed}
        </p>
      )}
    </div>
  );
}

// ── AnniversarySection ───────────────────────────────────────────────────────

function AnniversarySection({
  address,
  walletClient,
  chainId,
}: {
  address: Address;
  walletClient?: WalletClient;
  chainId: number;
}) {
  const t = useT();
  const [showMint, setShowMint] = useState(false);
  const { data: createdAt } = useUPCreationDate(address, chainId);

  if (!createdAt || !isTodayAnniversary(createdAt)) return null;

  const year = new Date().getFullYear();
  const upYear = createdAt.getFullYear();
  const anniversaryNumber = year - upYear;

  return (
    <>
      <section>
        <h2 className="title-premium text-xs uppercase mb-3">{t.upAnniversaryTitle}</h2>
        <div
          className="rounded-2xl p-4 flex items-center gap-4"
          style={{
            background:
              "linear-gradient(135deg, rgba(106,27,154,0.22) 0%, rgba(233,30,99,0.12) 100%)",
            border: "1px solid rgba(106,27,154,0.35)",
          }}
        >
          <div className="w-10 h-10 rounded-2xl bg-lukso-purple/30 flex items-center justify-center shrink-0">
            <span className="w-5 h-5 rounded-full bg-lukso-purple/60" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">
              {anniversaryNumber > 0
                ? `${anniversaryNumber} ${anniversaryNumber === 1 ? t.anniversaryTodayUnit : t.anniversaryTodayUnit2} ${t.upAnniversaryOnLukso}`
                : t.upAnniversaryLive}
            </p>
            <p className="text-xs text-white/40 mt-0.5">
              {t.anniversaryMintBadge} — {year}
            </p>
          </div>
          {walletClient ? (
            <button
              onClick={() => setShowMint(true)}
              className="btn-primary text-xs shrink-0"
            >
              {t.anniversaryMintBadge}
            </button>
          ) : (
            <span className="text-xs text-white/30">{t.anniversaryAlreadyMinted}</span>
          )}
        </div>
      </section>

      {showMint && walletClient && (
        <MintBadgeModal
          onClose={() => setShowMint(false)}
          recipientAddress={address}
          celebrationType={CelebrationType.UPAnniversary}
          year={year}
          walletClient={walletClient}
          chainId={chainId}
        />
      )}
    </>
  );
}

// ── GlobalSection ─────────────────────────────────────────────────────────────

function GlobalSection({
  allDrops,
  viewer,
  walletClient,
  chainId,
  onGreetNetwork,
  onCreateGlobal,
}: {
  allDrops: IndexedDrop[];
  viewer: Address | null;
  walletClient?: WalletClient;
  chainId: number;
  onGreetNetwork: () => void;
  onCreateGlobal: () => void;
}) {
  const t = useT();
  const { data: festivities = [], isLoading } = useFestivities(chainId);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  const thisMonthFests = festivities.filter((f) => f.month === currentMonth);

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

  if (thisMonthFests.length === 0) return null;

  return (
    <section>
      <h2 className="title-premium text-xs uppercase mb-3">{t.dropsGlobal}</h2>
      <div className="flex flex-col gap-3">
        {thisMonthFests.map((fest) => {
          const matchingDrops = allDrops.filter(
            (d) =>
              d.month === fest.month &&
              d.day === fest.day &&
              d.celebrationType === "global_holiday"
          );
          const isPast =
            fest.month < currentMonth ||
            (fest.month === currentMonth && fest.day < currentDay);
          const isToday = fest.month === currentMonth && fest.day === currentDay;

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
                opacity: isPast && !isToday ? 0.5 : 1,
              }}
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{fest.name}</p>
                <p className="text-xs text-white/35 mt-0.5">
                  {String(fest.month).padStart(2, "0")}-{String(fest.day).padStart(2, "0")}
                  {isToday && (
                    <span className="ml-1 text-amber-400 font-medium"> · Today!</span>
                  )}
                </p>
                <p className="text-xs text-white/25 mt-1">{t.dropsGlobalNoInsignia}</p>
              </div>
              {viewer && (
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    onClick={onGreetNetwork}
                    className="btn-ghost text-[11px] py-1 px-2.5"
                  >
                    {t.dropsGlobalGreetCta}
                  </button>
                  <button
                    onClick={onCreateGlobal}
                    className="btn-primary text-[11px] py-1 px-2.5"
                  >
                    {t.dropsGlobalCreateCta}
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

// ── AdminSection ─────────────────────────────────────────────────────────────

function AdminSection() {
  const t = useT();
  const { setView, setPendingDropCreate } = useAppStore();
  const [showForm, setShowForm] = useState(false);

  return (
    <section>
      <h2 className="title-premium text-xs uppercase mb-3">{t.dropsAdminSection}</h2>
      <div className="flex flex-col gap-2">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="btn-ghost text-xs text-left w-full"
        >
          {showForm ? "▲" : "▼"} {t.dropsAdminAddFestivity}
        </button>
        {showForm && (
          <div
            className="rounded-xl p-3 text-xs text-white/40"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <p className="mb-2 text-white/50">{t.dropsAdminAddFestivity}</p>
            <p className="italic">
              {t.adminComingSoon}
            </p>
          </div>
        )}
        <button
          onClick={() => { setPendingDropCreate(true); setView("drops-manage"); }}
          className="btn-primary text-xs"
        >
          {t.dropsAdminCreateGlobal}
        </button>
      </div>
    </section>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────

export function DropsDiscoverView({ walletClient, chainId }: DropsDiscoverViewProps) {
  const { connectedAccount, setView, setActiveSeriesId, goBack, setPendingDropCreate } = useAppStore();
  const t = useT();
  const monthNames = useMemo(() => getMonthNames(t), [t]);

  const { data: socialData, isLoading: socialLoading } = useSocialCalendar(connectedAccount);
  const { data: contacts = [] } = useSocialContacts(connectedAccount);
  const { data: allSeries } = useAllSeries();
  const { data: registryOwner } = useRegistryOwner(chainId);

  const isAdmin =
    !!connectedAccount &&
    !!registryOwner &&
    connectedAccount.toLowerCase() === registryOwner;

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

  const ownDrops = (allDrops ?? []).filter(
    (d) =>
      !!connectedAccount && d.host.toLowerCase() === connectedAccount.toLowerCase()
  );

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
            </div>
            <LanguageToggle />
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-6">

        {/* ── UP Anniversary badge claim ────────────────────────────────── */}
        {connectedAccount && (
          <AnniversarySection
            address={connectedAccount}
            walletClient={walletClient}
            chainId={chainId}
          />
        )}

        {/* ── Global festivities ────────────────────────────────────────── */}
        <GlobalSection
          allDrops={allDrops ?? []}
          viewer={connectedAccount}
          walletClient={walletClient}
          chainId={chainId}
          onGreetNetwork={() => setShowBulkGreet(true)}
          onCreateGlobal={() => { setPendingDropCreate(true); setView("drops-manage"); }}
        />

        {/* ── From following ────────────────────────────────────────────── */}
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
            {isLoading ? (
              <div className="flex justify-center py-6">
                <LoadingSpinner />
              </div>
            ) : (socialDrops ?? []).length === 0 ? (
              <p className="text-xs text-white/30 text-center py-4">{t.dropsFromFollowsEmpty}</p>
            ) : (
              <div className="flex flex-col gap-3">
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

        {/* ── My campaigns ─────────────────────────────────────────────── */}
        {connectedAccount && ownDrops.length > 0 && (
          <section>
            <h2 className="title-premium text-xs uppercase mb-3">{t.dropsMyCampaigns}</h2>
            <div className="flex flex-col gap-3">
              {ownDrops.map((drop) => (
                <DropCard
                  key={drop.dropId}
                  drop={drop}
                  viewer={connectedAccount}
                  walletClient={walletClient}
                  chainId={chainId}
                  relationLabel={t.dropRelOwn}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Community discover ────────────────────────────────────────── */}
        <section>
          <h2 className="title-premium text-xs uppercase mb-3">{t.dropsDiscover}</h2>
          {allDropsLoading ? (
            <div className="flex justify-center py-6">
              <LoadingSpinner />
            </div>
          ) : communityDrops.length === 0 ? (
            <p className="text-xs text-white/30 text-center py-4">{t.dropsDiscoverEmpty}</p>
          ) : (
            <div className="flex flex-col gap-3">
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

        {/* ── Community art series ─────────────────────────────────────── */}
        {openSeries.length > 0 && (
          <section>
            <h2 className="title-premium text-xs uppercase mb-1">{t.communityBadgeArtTitle}</h2>
            <p className="text-xs mb-3" style={{ color: "rgba(251,191,36,0.55)" }}>
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
                  className="w-full text-left flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors"
                  style={{
                    background: "rgba(251,191,36,0.06)",
                    border: "1px solid rgba(251,191,36,0.18)",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.22)" }}
                  >
                    <span className="block w-4 h-4 rounded-sm" style={{ background: "rgba(251,191,36,0.5)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium truncate">{s.name}</p>
                      <span
                        className="text-[9px] font-bold tracking-wide px-1.5 py-0.5 rounded-full shrink-0"
                        style={{ background: "rgba(251,191,36,0.18)", color: "rgb(251,191,36)" }}
                      >
                        {t.seriesOpenPill}
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: "rgba(251,191,36,0.5)" }}>
                      {monthNames[(s.month ?? 1) - 1]} {s.day} · {t.seriesVoteLabel}
                    </p>
                  </div>
                  <span className="text-xs shrink-0" style={{ color: "rgba(251,191,36,0.35)" }}>›</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── Admin section ─────────────────────────────────────────────── */}
        {isAdmin && <AdminSection />}
      </div>

      {/* Bulk greeting wizard */}
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
