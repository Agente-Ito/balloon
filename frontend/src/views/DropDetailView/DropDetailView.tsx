/**
 * DropDetailView — full detail page for a single drop.
 *
 * Shows: drop info, conditions, supply progress, claim button,
 * and a list of who has already claimed.
 */
import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useDropById, useDropClaims } from "@/hooks/useDrops";
import { useDropEligibility } from "@/hooks/useDropEligibility";
import { useClaimDrop } from "@/hooks/useClaimDrop";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Avatar } from "@/components/Avatar";
import { useT } from "@/hooks/useT";
import type { Address } from "@/types";
import type { WalletClient } from "viem";
import { format, fromUnixTime } from "date-fns";

interface DropDetailViewProps {
  walletClient?: WalletClient;
  chainId: number;
}

export function DropDetailView({ walletClient, chainId }: DropDetailViewProps) {
  const { connectedAccount, setView } = useAppStore();
  const t = useT();
  const [dropId, setDropId] = useState<string | null>(null);

  useEffect(() => {
    setDropId(localStorage.getItem("activeDropId"));
  }, []);

  const { data: drop, isLoading: dropLoading } = useDropById(dropId);
  const { data: claims, isLoading: claimsLoading } = useDropClaims(dropId);
  const { data: eligibility, isLoading: eligLoading } = useDropEligibility(
    dropId,
    connectedAccount,
    chainId
  );
  const claimMutation = useClaimDrop(walletClient ?? null, chainId);

  const handleClaim = async () => {
    if (!connectedAccount || !dropId) return;
    await claimMutation.mutateAsync({ dropId, claimer: connectedAccount });
  };

  if (!dropId || dropLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!drop) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-white/60 text-sm">{t.dropNotFound}</p>
        <button onClick={() => setView("drops")} className="btn-ghost text-xs">
          {t.dropBackToDrops}
        </button>
      </div>
    );
  }

  const supplyPercent =
    drop.maxSupply != null && drop.maxSupply > 0
      ? Math.min((drop.claimed / drop.maxSupply) * 100, 100)
      : null;

  const windowLabel = (() => {
    if (drop.startAt > 0 && !drop.isActive) {
      return `${t.dropWindowOpens} ${format(fromUnixTime(drop.startAt), "MMM d, yyyy")}`;
    }
    if (drop.endAt != null) {
      return `${t.dropWindowCloses} ${format(fromUnixTime(drop.endAt), "MMM d, yyyy HH:mm")}`;
    }
    return t.dropWindowNone;
  })();

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-white/10">
        <button onClick={() => setView("drops")} className="text-white/40 hover:text-white transition-colors">
          ←
        </button>
        <h1 className="text-sm font-semibold flex-1 truncate">{drop.name}</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5">
        {/* Badge image */}
        {drop.imageIPFS ? (
          <img
            src={drop.imageIPFS.startsWith("data:") ? drop.imageIPFS : `https://gateway.pinata.cloud/ipfs/${drop.imageIPFS}`}
            alt={drop.name}
            className="w-full max-w-[200px] mx-auto rounded-2xl object-cover aspect-square"
          />
        ) : (
          <div className="w-full max-w-[200px] mx-auto rounded-2xl bg-lukso-pink/20 flex items-center justify-center text-6xl aspect-square">
            🎁
          </div>
        )}

        {/* Host */}
        <div className="flex items-center gap-2">
          <Avatar address={drop.host as Address} size={24} />
          <div>
            <p className="text-xs text-white/40">{t.dropCreatedBy}</p>
            <p className="text-xs font-mono text-white/70">
              {drop.host.slice(0, 8)}…{drop.host.slice(-6)}
            </p>
          </div>
        </div>

        {/* Supply progress */}
        {supplyPercent !== null && (
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs text-white/40">
              <span>{drop.claimed} {t.dropsClaimed}</span>
              <span>{drop.maxSupply} {t.dropTotal}</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-lukso-pink rounded-full transition-all"
                style={{ width: `${supplyPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Window */}
        <p className="text-xs text-white/40">{windowLabel}</p>

        {/* Conditions */}
        {(drop.requireFollow || drop.minFollowers > 0 || drop.requiredLSP7.length > 0 || drop.requiredLSP8.length > 0) && (
          <div className="card flex flex-col gap-2">
            <p className="text-xs font-medium text-white/60 mb-1">{t.dropRequirements}</p>
            {drop.requireFollow && (
              <div className="flex items-center gap-2 text-xs text-white/50">
                <span>👥</span> {t.dropMustFollow}
              </div>
            )}
            {drop.minFollowers > 0 && (
              <div className="flex items-center gap-2 text-xs text-white/50">
                <span>📣</span> {t.dropAtLeast} {drop.minFollowers} {t.dropFollowerReq}
              </div>
            )}
            {drop.requiredLSP7.map((addr) => (
              <div key={addr} className="flex items-center gap-2 text-xs text-white/50">
                <span>🪙</span> Hold LSP7 token{" "}
                <span className="font-mono">{addr.slice(0, 8)}…</span>
              </div>
            ))}
            {drop.requiredLSP8.map((addr) => (
              <div key={addr} className="flex items-center gap-2 text-xs text-white/50">
                <span>🖼</span> Hold LSP8 NFT from{" "}
                <span className="font-mono">{addr.slice(0, 8)}…</span>
              </div>
            ))}
          </div>
        )}

        {/* Claim section */}
        {connectedAccount && (
          <div className="flex flex-col gap-2">
            {eligLoading ? (
              <div className="flex justify-center"><LoadingSpinner /></div>
            ) : eligibility?.ok ? (
              <button
                onClick={handleClaim}
                disabled={claimMutation.isPending}
                className="btn-primary w-full"
              >
                {claimMutation.isPending ? t.dropClaiming : t.dropClaimBadge}
              </button>
            ) : (
              <div className="text-center">
                <p className="text-xs text-white/40 mb-2">
                  {eligibility?.reason ?? t.dropNotEligible}
                </p>
                <button
                  disabled
                  className="btn-ghost w-full opacity-40 cursor-not-allowed"
                >
                  {t.dropClaimBadge}
                </button>
              </div>
            )}
            {claimMutation.isSuccess && (
              <p className="text-xs text-green-400 text-center">{t.dropClaimedOk}</p>
            )}
            {claimMutation.isError && (
              <p className="text-xs text-red-400 text-center">
                {claimMutation.error instanceof Error ? claimMutation.error.message : t.dropClaimFailed}
              </p>
            )}
          </div>
        )}

        {/* Claimers list */}
        <section>
          <h2 className="text-xs font-medium text-white/40 uppercase tracking-wide mb-3">
            {t.dropClaimedBy} ({claims?.length ?? 0})
          </h2>
          {claimsLoading ? (
            <div className="flex justify-center py-4"><LoadingSpinner /></div>
          ) : (claims ?? []).length === 0 ? (
            <p className="text-xs text-white/30 text-center py-3">{t.dropFirstClaim}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {(claims ?? []).slice(0, 20).map((claim) => (
                <div key={claim.claimer} className="flex items-center gap-2">
                  <Avatar address={claim.claimer as Address} size={24} />
                  <span className="text-xs font-mono text-white/50">
                    {claim.claimer.slice(0, 8)}…{claim.claimer.slice(-6)}
                  </span>
                </div>
              ))}
              {(claims ?? []).length > 20 && (
                <p className="text-xs text-white/30 text-center">
                  +{(claims ?? []).length - 20} {t.dropMore}
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
