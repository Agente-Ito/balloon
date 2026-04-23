/**
 * SeriesView — community art voting for a holiday badge drop.
 *
 * Artists submit image proposals; any connected UP address can cast one vote
 * per series. The submission with the most votes becomes the official badge image.
 */
import { useState, useRef, useMemo } from "react";
import { format, fromUnixTime } from "date-fns";
import { useAppStore } from "@/store/useAppStore";
import {
  useSeriesById,
  useSeriesSubmissions,
  useCastVote,
  useRemoveVote,
  useSubmitArt,
} from "@/hooks/useSeries";
import { useLSP3Name } from "@/hooks/useLSP3Name";
import { Avatar } from "@/components/Avatar";
import { LanguageToggle } from "@/components/LanguageToggle";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ViewToolbar } from "@/components/ViewToolbar";
import { uploadFileToIPFS } from "@/lib/ipfs";
import { getMonthNames } from "@/lib/monthNames";
import { useT } from "@/hooks/useT";
import toast from "react-hot-toast";
import type { Address, SeriesSubmission } from "@/types";
import type { WalletClient } from "viem";

const IPFS_GATEWAY =
  (import.meta.env.VITE_PINATA_GATEWAY as string | undefined) ?? "https://gateway.pinata.cloud";

function resolveImage(url: string): string {
  if (url.startsWith("ipfs://")) return `${IPFS_GATEWAY}/ipfs/${url.slice(7)}`;
  return url;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ArtistName({ address, chainId }: { address: string; chainId: number }) {
  const { data: name } = useLSP3Name(address as Address, chainId);
  return <span>{name ?? `${address.slice(0, 6)}…${address.slice(-4)}`}</span>;
}

function SubmissionCard({
  submission,
  isLeading,
  isOpen,
  viewer,
  walletClient,
  seriesId,
  chainId,
}: {
  submission: SeriesSubmission;
  isLeading: boolean;
  isOpen: boolean;
  viewer: Address | null;
  walletClient?: WalletClient;
  seriesId: string;
  chainId: number;
}) {
  const t = useT();
  const castVote = useCastVote(seriesId);
  const removeVote = useRemoveVote(seriesId);

  const handleVote = async () => {
    if (!viewer) { toast.error(t.seriesConnectToVote); return; }
    if (!walletClient) { toast.error(t.seriesNoWallet); return; }
    try {
      if (submission.votedByViewer) {
        await removeVote.mutateAsync(viewer);
        toast.success(t.seriesVoted);
      } else {
        await castVote.mutateAsync({ submissionId: submission.id, voter: viewer });
        toast.success(t.seriesVoted);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message.slice(0, 80) : t.dropClaimFailed);
    }
  };

  const isPending = castVote.isPending || removeVote.isPending;
  const voteCountLabel = `${submission.voteCount} ${
    submission.voteCount === 1 ? t.seriesVoteSingular : t.seriesVotePlural
  }`;

  return (
    <div
      className={`card flex flex-col gap-3 relative ${
        isLeading ? "border-amber-400/30 bg-amber-400/5" : ""
      }`}
    >
      {isLeading && (
        <div
          className="absolute -top-2 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{
            background: "rgba(201,154,46,0.22)",
            color: "#9c6d16",
            border: "1px solid rgba(201,154,46,0.40)",
          }}
        >
          {t.seriesLeading}
        </div>
      )}

      {/* Image */}
      <div className="w-full aspect-square rounded-xl overflow-hidden bg-white/5">
        <img
          src={resolveImage(submission.imageIPFS)}
          alt="Submission"
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </div>

      {/* Artist */}
      <div className="flex items-center gap-2">
        <Avatar address={submission.artist as Address} size={20} />
        <p className="text-xs text-white/50">
          <ArtistName address={submission.artist} chainId={chainId} />
        </p>
      </div>

      {/* Message */}
      {submission.message && (
        <p className="text-xs text-white/40 italic">"{submission.message}"</p>
      )}

      {/* Vote row */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/40">{voteCountLabel}</span>
        {isOpen && viewer && (
          <button
            onClick={handleVote}
            disabled={isPending}
            className="text-xs px-3 py-1 rounded-lg font-semibold transition-colors"
            style={
              submission.votedByViewer
                ? {
                    background: "rgba(201,154,46,0.25)",
                    color: "#9c6d16",
                    border: "1px solid rgba(201,154,46,0.45)",
                  }
                : {
                    background: "rgba(255,255,255,0.10)",
                    color: "rgba(255,255,255,0.60)",
                  }
            }
          >
            {isPending ? "…" : submission.votedByViewer ? t.seriesVoted : t.seriesVote}
          </button>
        )}
        {!isOpen && submission.selected && (
          <span
            className="text-[10px] px-2 py-0.5 rounded-full"
            style={{
              background: "rgba(201,154,46,0.20)",
              color: "#9c6d16",
              border: "1px solid rgba(201,154,46,0.35)",
            }}
          >
            {t.seriesWinner}
          </span>
        )}
      </div>
    </div>
  );
}

function SubmitForm({
  seriesId,
  artist,
  onDone,
}: {
  seriesId: string;
  artist: Address;
  onDone: () => void;
}) {
  const t = useT();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const submitArt = useSubmitArt(seriesId);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) { toast.error(t.seriesFileTooLarge); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (!file) { toast.error(t.seriesPickImageFirst); return; }
    try {
      setUploading(true);
      const { url } = await uploadFileToIPFS(file);
      if (!url.startsWith("ipfs://")) {
        toast.error("IPFS upload failed — check your connection and try again");
        return;
      }
      await submitArt.mutateAsync({ artist, imageIPFS: url, message: message.trim() || undefined });
      toast.success(t.seriesSubmitCta);
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message.slice(0, 80) : t.dropClaimFailed);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="card flex flex-col gap-4">
      <p className="text-sm font-semibold">{t.seriesSubmitArtworkTitle}</p>
      <p className="text-xs text-white/40">{t.seriesSubmitArtworkHint}</p>

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="w-full aspect-square rounded-xl bg-white/5 border border-dashed border-white/20 flex items-center justify-center overflow-hidden hover:border-lukso-purple/50 transition-colors"
      >
        {preview ? (
          <img src={preview} alt="preview" className="w-full h-full object-cover rounded-xl" />
        ) : (
          <span className="text-white/20 text-sm">{t.seriesSubmitArtworkHint.split(".")[0]}</span>
        )}
      </button>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      <div>
        <label className="block text-xs text-white/40 mb-1">{t.seriesArtistStatement}</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, 200))}
          placeholder={t.seriesArtistStatementPlaceholder}
          rows={2}
          className="input resize-none w-full"
        />
        <p className="text-[10px] text-white/20 text-right">{200 - message.length}</p>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!file || uploading || submitArt.isPending}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {uploading || submitArt.isPending ? (
          <><LoadingSpinner size="sm" /> {t.seriesUploadingCta}</>
        ) : (
          t.seriesSubmitCta
        )}
      </button>
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────

interface SeriesViewProps {
  walletClient?: WalletClient;
  chainId: number;
}

export function SeriesView({ walletClient, chainId }: SeriesViewProps) {
  const { activeSeriesId, connectedAccount, goBack } = useAppStore();
  const t = useT();
  const monthNames = useMemo(() => getMonthNames(t), [t]);
  const [showSubmitForm, setShowSubmitForm] = useState(false);

  const { data: series, isLoading: seriesLoading } = useSeriesById(activeSeriesId);
  const { data: submissions, isLoading: subsLoading } = useSeriesSubmissions(
    activeSeriesId,
    connectedAccount,
  );

  if (seriesLoading || !series) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const isOpen = series.submissionOpen;
  const deadline = series.votingDeadline;
  const sortedSubs = [...(submissions ?? [])].sort((a, b) => b.voteCount - a.voteCount);
  const leadingId = sortedSubs[0]?.id;
  const monthLabel = monthNames[(series.month ?? 1) - 1];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <ViewToolbar
        onBack={() => goBack("drops")}
        backLabel={t.back}
        title={series.name}
        right={<LanguageToggle />}
      />

      {/* Header card */}
      <div className="mx-4 mb-3 card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-base font-bold">{series.name}</p>
            <p className="text-xs text-white/40 mt-0.5">
              {monthLabel} {series.day}
              {deadline && ` · ${t.seriesVotingCloses} ${format(fromUnixTime(deadline), "MMM d")}`}
            </p>
            {series.description && (
              <p className="text-xs text-white/30 mt-1">{series.description}</p>
            )}
          </div>
          <div
            className="text-[10px] font-semibold px-2 py-1 rounded-full flex-shrink-0"
            style={
              isOpen
                ? {
                    background: "rgba(201,154,46,0.20)",
                    color: "#9c6d16",
                    border: "1px solid rgba(201,154,46,0.35)",
                  }
                : {
                    background: "rgba(255,255,255,0.10)",
                    color: "rgba(255,255,255,0.40)",
                  }
            }
          >
            {isOpen ? t.seriesOpenStatus : t.seriesClosedStatus}
          </div>
        </div>

        {isOpen && (
          <p className="text-xs text-white/30 mt-3 border-t border-white/10 pt-2">
            {connectedAccount ? t.seriesVoteInstructions : t.seriesConnectToVote}
          </p>
        )}
      </div>

      {/* Submissions grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {subsLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : sortedSubs.length === 0 ? (
          <div className="card text-center py-10">
            <p className="text-sm text-white/40 mb-1">{t.seriesNoSubmissions}</p>
            {isOpen && connectedAccount && (
              <p className="text-xs text-white/25">{t.seriesFirstArtist}</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {sortedSubs.map((sub) => (
              <SubmissionCard
                key={sub.id}
                submission={sub}
                isLeading={sub.id === leadingId && sub.voteCount > 0}
                isOpen={isOpen}
                viewer={connectedAccount}
                walletClient={walletClient}
                seriesId={series.id}
                chainId={chainId}
              />
            ))}
          </div>
        )}

        {/* Submit art CTA */}
        {isOpen && connectedAccount && !showSubmitForm && (
          <button
            onClick={() => setShowSubmitForm(true)}
            className="mt-4 w-full btn-secondary flex items-center justify-center gap-2 text-sm py-3"
          >
            {t.seriesSubmitDesignCta}
          </button>
        )}

        {isOpen && connectedAccount && showSubmitForm && (
          <div className="mt-4">
            <SubmitForm
              seriesId={series.id}
              artist={connectedAccount}
              onDone={() => setShowSubmitForm(false)}
            />
            <button
              onClick={() => setShowSubmitForm(false)}
              className="mt-2 w-full text-xs text-white/30 hover:text-white/50 py-1"
            >
              {t.cancel}
            </button>
          </div>
        )}

        {!connectedAccount && isOpen && (
          <p className="text-xs text-white/30 text-center mt-4">{t.seriesGridOnly}</p>
        )}
      </div>
    </div>
  );
}
