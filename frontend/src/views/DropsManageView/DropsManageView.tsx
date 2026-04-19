/**
 * DropsManageView — dedicated view for managing your own drop campaigns.
 *
 * Shows the connected user's drops (active + closed), allows navigating to
 * the DropDetailView for each, and provides direct access to create a new drop.
 * Shares the same tab header as DropsDiscoverView for consistent context.
 */
import { useState } from "react";
import { format, fromUnixTime } from "date-fns";
import { useAppStore } from "@/store/useAppStore";
import { useDrops } from "@/hooks/useDrops";
import { useLSP3Name } from "@/hooks/useLSP3Name";
import { useT } from "@/hooks/useT";
import { Avatar } from "@/components/Avatar";
import { LanguageToggle } from "@/components/LanguageToggle";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { DropForm } from "@/views/Editor/DropForm";
import { useCreateDrop } from "@/hooks/useCreateDrop";
import toast from "react-hot-toast";
import type { Address, IndexedDrop } from "@/types";
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
}: {
  drop: IndexedDrop;
  host: Address;
  hostName?: string;
  chainId: number;
  onViewDetail: (dropId: string) => void;
}) {
  const t = useT();

  const dateLabel = `${String(drop.month).padStart(2, "0")}-${String(drop.day).padStart(2, "0")}${drop.year > 0 ? `-${drop.year}` : ""}`;

  return (
    <div className="card flex flex-col gap-1.5">
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
        <span
          className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
            drop.isActive
              ? "bg-green-500/20 text-green-400"
              : "bg-white/10 text-white/40"
          }`}
        >
          {drop.isActive ? t.dropsActive : t.dropsClosed}
        </span>
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
  const { connectedAccount, setView, setActiveDropId, goBack } = useAppStore();
  const t = useT();

  const [addingDrop, setAddingDrop] = useState(false);

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
      setAddingDrop(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t.toastFailedDrop);
    }
  };

  const handleViewDetail = (dropId: string) => {
    setActiveDropId(dropId);
    setView("drop-detail");
  };

  // ── Create drop form ────────────────────────────────────────────────────────
  if (addingDrop && connectedAccount) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-white/10">
          <button
            onClick={() => setAddingDrop(false)}
            className="text-white/40 hover:text-white transition-colors"
          >
            ←
          </button>
          <h1 className="text-sm font-semibold flex-1 truncate">{t.addDrop}</h1>
          <LanguageToggle />
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <DropForm
            host={connectedAccount}
            onSave={handleCreate}
            onCancel={() => setAddingDrop(false)}
            isSaving={createDropMutation.isPending}
          />
        </div>
      </div>
    );
  }

  // ── Main manage view ────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header: Breadcrumb + tab switcher */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-white/10">
        <button
          onClick={() => goBack("grid")}
          className="text-white/40 hover:text-white transition-colors shrink-0"
          title="Back to Calendar"
        >
          {t.dropsBackToCalendar}
        </button>
        <div className="flex-1 flex items-center justify-center min-w-0">
          <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
            <button
              onClick={() => setView("drops")}
              className="text-xs px-3 py-1 rounded-md text-white/40 hover:text-white/70 transition-colors whitespace-nowrap"
            >
              {t.dropsManageTabExplore}
            </button>
            <button
              className="text-xs px-3 py-1 rounded-md bg-white/10 text-white font-medium whitespace-nowrap"
            >
              {t.dropsManageTabManage}
            </button>
          </div>
        </div>
        {connectedAccount && (
          <button
            onClick={() => setAddingDrop(true)}
            className="text-xs text-lukso-pink hover:text-lukso-pink/80 transition-colors shrink-0"
          >
            {t.subAddDrop}
          </button>
        )}
        <LanguageToggle />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
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
                <h2 className="text-xs font-medium text-white/40 uppercase tracking-wide mb-3">
                  {t.dropsActive}
                </h2>
                <div className="flex flex-col gap-3">
                  {myDrops
                    .filter((d) => d.isActive)
                    .map((drop) => (
                      <DropRow
                        key={drop.dropId}
                        drop={drop}
                        host={connectedAccount}
                        hostName={hostName}
                        chainId={chainId}
                        onViewDetail={handleViewDetail}
                      />
                    ))}
                </div>
              </section>
            )}

            {/* Closed drops */}
            {myDrops.filter((d) => !d.isActive).length > 0 && (
              <section>
                <h2 className="text-xs font-medium text-white/40 uppercase tracking-wide mb-3">
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
                      />
                    ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
