/**
 * SeriesView — community art voting for a holiday badge drop.
 *
 * Artists submit image proposals; any connected UP address can cast one vote
 * per series. The submission with the most votes becomes the official badge image.
 */
import { useState, useRef } from "react";
import { format, fromUnixTime } from "date-fns";
import { useAppStore } from "@/store/useAppStore";
import { useSeriesById, useSeriesSubmissions, useCastVote, useRemoveVote, useSubmitArt } from "@/hooks/useSeries";
import { useLSP3Name } from "@/hooks/useLSP3Name";
import { Avatar } from "@/components/Avatar";
import { LanguageToggle } from "@/components/LanguageToggle";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ViewToolbar } from "@/components/ViewToolbar";
import { uploadFileToIPFS } from "@/lib/ipfs";
import { useT } from "@/hooks/useT";
import toast from "react-hot-toast";
import type { Address, SeriesSubmission } from "@/types";
import type { WalletClient } from "viem";

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const IPFS_GATEWAY = (import.meta.env.VITE_PINATA_GATEWAY as string | undefined) ?? "https://gateway.pinata.cloud";

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
  const castVote = useCastVote(seriesId);
  const removeVote = useRemoveVote(seriesId);

  const handleVote = async () => {
    if (!viewer) { toast.error("Connect your UP to vote"); return; }
    if (!walletClient) { toast.error("No wallet connected"); return; }
    try {
      if (submission.votedByViewer) {
        await removeVote.mutateAsync(viewer);
        toast.success("Vote removed");
      } else {
        await castVote.mutateAsync({ submissionId: submission.id, voter: viewer });
        toast.success("Vote cast! 🎨");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message.slice(0, 80) : "Failed");
    }
  };

  const isPending = castVote.isPending || removeVote.isPending;

  return (
    <div className={`card flex flex-col gap-3 relative ${isLeading ? "border-lukso-purple/50 bg-lukso-purple/5" : ""}`}>
      {isLeading && (
        <div className="absolute -top-2 left-3 bg-lukso-purple text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          👑 Leading
        </div>
      )}

      {/* Image */}
      <div className="w-full aspect-square rounded-xl overflow-hidden bg-white/5">
        <img
          src={resolveImage(submission.imageIPFS)}
          alt="Submission"
          className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
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
        <span className="text-xs text-white/40">
          {submission.voteCount} {submission.voteCount === 1 ? "vote" : "votes"}
        </span>
        {isOpen && viewer && (
          <button
            onClick={handleVote}
            disabled={isPending}
            className={`text-xs px-3 py-1 rounded-lg font-semibold transition-colors ${
              submission.votedByViewer
                ? "bg-lukso-purple text-white"
                : "bg-white/10 text-white/60 hover:bg-white/20"
            }`}
          >
            {isPending ? "…" : submission.votedByViewer ? "✓ Voted" : "Vote"}
          </button>
        )}
        {!isOpen && submission.selected && (
          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
            Winner
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
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const submitArt = useSubmitArt(seriesId);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) { toast.error("File too large (max 10 MB)"); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (!file) { toast.error("Pick an image first"); return; }
    try {
      setUploading(true);
      const { url } = await uploadFileToIPFS(file);
      if (!url.startsWith("ipfs://")) {
        toast.error("IPFS upload failed — check your connection and try again");
        return;
      }
      await submitArt.mutateAsync({ artist, imageIPFS: url, message: message.trim() || undefined });
      toast.success("Artwork submitted! 🎨");
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message.slice(0, 80) : "Submission failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="card flex flex-col gap-4">
      <p className="text-sm font-semibold">Submit your artwork</p>
      <p className="text-xs text-white/40">
        Upload your badge design. PNG, JPG, GIF or SVG — max 10 MB.
        The community will vote for their favourite.
      </p>

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="w-full aspect-square rounded-xl bg-white/5 border border-dashed border-white/20 flex items-center justify-center overflow-hidden hover:border-lukso-purple/50 transition-colors"
      >
        {preview
          ? <img src={preview} alt="preview" className="w-full h-full object-cover rounded-xl" />
          : <span className="text-4xl">🖼️</span>}
      </button>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      <div>
        <label className="block text-xs text-white/40 mb-1">Artist statement (optional)</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, 200))}
          placeholder="Tell us about your design…"
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
        {uploading || submitArt.isPending ? <><LoadingSpinner size="sm" /> Uploading…</> : "Submit artwork"}
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
  const monthLabel = MONTH_NAMES[(series.month ?? 1) - 1];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <ViewToolbar
        onBack={() => goBack("drops")}
        backLabel={t.back}
        title={series.name}
        right={<LanguageToggle />}
      />

      {/* Header card */}
      <div className="mx-4 mb-3 card bg-white/5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-base font-bold">{series.name}</p>
            <p className="text-xs text-white/40 mt-0.5">
              {monthLabel} {series.day}
              {deadline && ` · Voting closes ${format(fromUnixTime(deadline), "MMM d")}`}
            </p>
            {series.description && (
              <p className="text-xs text-white/50 mt-1">{series.description}</p>
            )}
          </div>
          <div className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
            isOpen ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/40"
          }`}>
            {isOpen ? "Open" : "Closed"}
          </div>
        </div>

        {/* Vote instructions */}
        {isOpen && (
          <p className="text-xs text-white/30 mt-3 border-t border-white/10 pt-2">
            {connectedAccount
              ? "Tap any design to cast your vote. You can switch your vote any time."
              : "Connect your Universal Profile to vote."}
          </p>
        )}
      </div>

      {/* Submissions grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {subsLoading ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : sortedSubs.length === 0 ? (
          <div className="card text-center py-10">
            <p className="text-3xl mb-2">🎨</p>
            <p className="text-sm text-white/40">No submissions yet.</p>
            {isOpen && connectedAccount && (
              <p className="text-xs text-white/30 mt-1">Be the first artist to submit!</p>
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
            🎨 Submit your design
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
              Cancel
            </button>
          </div>
        )}

        {!connectedAccount && isOpen && (
          <p className="text-xs text-white/30 text-center mt-4">
            Open this app inside the LUKSO Grid to vote or submit artwork.
          </p>
        )}
      </div>
    </div>
  );
}
