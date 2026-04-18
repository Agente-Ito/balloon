import { useAppStore } from "@/store/useAppStore";
import { useDrops } from "@/hooks/useDrops";
import { useDropEligibility } from "@/hooks/useDropEligibility";
import { useClaimDrop } from "@/hooks/useClaimDrop";
import { useSocialCalendar } from "@/hooks/useSocialCalendar";
import { useAllSeries } from "@/hooks/useSeries";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Avatar } from "@/components/Avatar";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useT } from "@/hooks/useT";
import { useLSP3Name } from "@/hooks/useLSP3Name";
import type { IndexedDrop, Address } from "@/types";
import type { WalletClient } from "viem";

interface DropsDiscoverViewProps {
  walletClient?: WalletClient;
  chainId: number;
}

function DropCard({
  drop, viewer, walletClient, chainId,
}: {
  drop: IndexedDrop;
  viewer: Address | null;
  walletClient?: WalletClient;
  chainId: number;
}) {
  const t = useT();
  const { data: hostName } = useLSP3Name(drop.host as Address, chainId);
  const { data: eligibility, isLoading: eligLoading } = useDropEligibility(drop.dropId, viewer, chainId);
  const claimMutation = useClaimDrop(walletClient ?? null, chainId);

  const handleClaim = async () => {
    if (!viewer) return;
    await claimMutation.mutateAsync({ dropId: drop.dropId, claimer: viewer });
  };

  const handleDetails = () => {
    useAppStore.getState().setView("drop-detail");
    localStorage.setItem("activeDropId", drop.dropId);
  };

  const supplyLabel = drop.maxSupply != null
    ? `${drop.claimed} / ${drop.maxSupply} ${t.dropsClaimed}`
    : `${drop.claimed} ${t.dropsClaimed}`;

  const dateLabel = `${String(drop.month).padStart(2, "0")}-${String(drop.day).padStart(2, "0")}`;

  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-center gap-3">
        {drop.imageIPFS ? (
          <img
            src={drop.imageIPFS.startsWith("data:") ? drop.imageIPFS : `https://gateway.pinata.cloud/ipfs/${drop.imageIPFS}`}
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
          <div className="flex items-center gap-1.5 mt-0.5">
            <Avatar address={drop.host} size={16} chainId={chainId} />
            <span className="text-xs text-lukso-purple truncate">
              {hostName ?? `${drop.host.slice(0, 6)}…${drop.host.slice(-4)}`}
            </span>
          </div>
        </div>
        <span className="text-xs text-white/30 shrink-0">{dateLabel}</span>
      </div>

      <div className="flex items-center gap-3 text-xs text-white/40">
        <span>{supplyLabel}</span>
        {drop.requireFollow && <span>· {t.dropFollowRequired}</span>}
        {drop.minFollowers > 0 && <span>· {drop.minFollowers}+ {t.dropFollowerReq}</span>}
        {drop.requiredLSP7.length > 0 && <span>· LSP7 gate</span>}
        {drop.requiredLSP8.length > 0 && <span>· LSP8 gate</span>}
      </div>

      <div className="flex items-center gap-2">
        <button onClick={handleDetails} className="btn-ghost text-xs flex-1">
          {t.dropDetails}
        </button>

        {viewer && (
          eligLoading ? (
            <div className="flex-1 flex justify-center"><LoadingSpinner /></div>
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
              {eligibility?.reason ?? t.dropNotEligible}
            </span>
          )
        )}
      </div>

      {claimMutation.isSuccess && (
        <p className="text-xs text-green-400 text-center">{t.dropClaimedOk}</p>
      )}
      {claimMutation.isError && (
        <p className="text-xs text-red-400 text-center">
          {claimMutation.error instanceof Error ? claimMutation.error.message : t.dropClaimFailed}
        </p>
      )}
    </div>
  );
}

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function DropsDiscoverView({ walletClient, chainId }: DropsDiscoverViewProps) {
  const { connectedAccount, setView, setActiveSeriesId } = useAppStore();
  const t = useT();

  const { data: socialData, isLoading: socialLoading } = useSocialCalendar(connectedAccount);
  const { data: allSeries } = useAllSeries();
  const openSeries = (allSeries ?? []).filter((s) => s.submissionOpen);
  const followingAddresses = socialData?.drops.map((d) => d.host) ?? [];

  const { data: socialDrops, isLoading: socialDropsLoading } = useDrops({
    following: followingAddresses.length > 0 ? [...new Set(followingAddresses)] as Address[] : undefined,
    activeOnly: true,
    enabled: !socialLoading,
  });

  const { data: allDrops, isLoading: allDropsLoading } = useDrops({ activeOnly: true });

  const socialDropIds = new Set((socialDrops ?? []).map((d) => d.dropId));
  const discoverDrops = (allDrops ?? []).filter((d) => !socialDropIds.has(d.dropId));
  const isLoading = socialLoading || socialDropsLoading;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-white/10">
        <button onClick={() => setView("grid")} className="text-white/40 hover:text-white transition-colors">
          ←
        </button>
        <h1 className="text-sm font-semibold flex-1">{t.dropsDiscoverTitle}</h1>
        {connectedAccount && (
          <button
            onClick={() => setView("editor")}
            className="text-xs text-lukso-pink hover:text-lukso-pink/80 transition-colors"
          >
            {t.create}
          </button>
        )}
        <LanguageToggle />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-6">
        {connectedAccount && (
          <section>
            <h2 className="text-xs font-medium text-white/40 uppercase tracking-wide mb-3">
              {t.dropsFromFollows}
            </h2>
            {isLoading ? (
              <div className="flex justify-center py-6"><LoadingSpinner /></div>
            ) : (socialDrops ?? []).length === 0 ? (
              <p className="text-xs text-white/30 text-center py-4">{t.dropsFromFollowsEmpty}</p>
            ) : (
              <div className="flex flex-col gap-3">
                {(socialDrops ?? []).map((drop) => (
                  <DropCard key={drop.dropId} drop={drop} viewer={connectedAccount} walletClient={walletClient} chainId={chainId} />
                ))}
              </div>
            )}
          </section>
        )}

        <section>
          <h2 className="text-xs font-medium text-white/40 uppercase tracking-wide mb-3">
            {t.dropsDiscover}
          </h2>
          {allDropsLoading ? (
            <div className="flex justify-center py-6"><LoadingSpinner /></div>
          ) : discoverDrops.length === 0 ? (
            <p className="text-xs text-white/30 text-center py-4">{t.dropsDiscoverEmpty}</p>
          ) : (
            <div className="flex flex-col gap-3">
              {discoverDrops.map((drop) => (
                <DropCard key={drop.dropId} drop={drop} viewer={connectedAccount} walletClient={walletClient} chainId={chainId} />
              ))}
            </div>
          )}
        </section>

        {/* ── Community art series ───────────────────────────────────────── */}
        {openSeries.length > 0 && (
          <section>
            <h2 className="text-xs font-medium text-white/40 uppercase tracking-wide mb-1">
              Community Badge Art
            </h2>
            <p className="text-xs text-white/25 mb-3">
              Vote for the official badge image for these upcoming holidays.
            </p>
            <div className="flex flex-col gap-2">
              {openSeries.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setActiveSeriesId(s.id); setView("series"); }}
                  className="card w-full text-left flex items-center gap-3 hover:border-lukso-purple/40 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-lukso-purple/15 flex items-center justify-center flex-shrink-0">
                    <span className="w-5 h-5 rounded-full bg-lukso-purple/50" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-white/40">
                      {MONTH_NAMES[(s.month ?? 1) - 1]} {s.day} · Vote for the official badge
                    </p>
                  </div>
                  <span className="text-white/20 text-sm flex-shrink-0">›</span>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
