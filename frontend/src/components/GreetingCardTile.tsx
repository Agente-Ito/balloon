import { useState } from "react";
import { format } from "date-fns";
import { Avatar } from "./Avatar";
import { useLSP3Name } from "@/hooks/useLSP3Name";
import { useAppStore } from "@/store/useAppStore";
import { useT } from "@/hooks/useT";
import type { GreetingCard } from "@/types";
import type { Address } from "@/types";
import { CelebrationType } from "@/types";

interface GreetingCardTileProps {
  card: GreetingCard;
  chainId: number;
  className?: string;
}

export function GreetingCardTile({ card, chainId, className = "" }: GreetingCardTileProps) {
  const t = useT();
  const triggerBurst = useAppStore((s) => s.triggerBurst);
  const [isOpen, setIsOpen] = useState(false);
  const { metadata } = card;
  const { data: senderName } = useLSP3Name(metadata.from as Address, chainId);
  const displayName = senderName ?? `${metadata.from.slice(0, 6)}…${metadata.from.slice(-4)}`;

  const handleOpen = () => {
    setIsOpen(true);
    if (metadata.celebration === CelebrationType.Birthday) {
      triggerBurst("epic", "birthday");
    } else if (metadata.celebration === CelebrationType.UPAnniversary) {
      triggerBurst("celebration", "anniversary");
    } else if (metadata.celebration === CelebrationType.GlobalHoliday) {
      triggerBurst("celebration", "holiday");
    } else {
      triggerBurst("gentle", "mixed");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={`card w-full text-left transition-colors hover:border-lukso-purple/35 ${className}`}
      >
        <div className="flex items-start gap-3">
        <Avatar address={metadata.from as Address} size={36} chainId={chainId} className="flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold truncate" style={{ color: "#2C2C2C" }}>
              {metadata.title}
            </span>
            {metadata.timestamp > 0 && (
              <span className="text-xs flex-shrink-0" style={{ color: "#8B7D7D" }}>
                {format(new Date(metadata.timestamp * 1000), "MMM d, yyyy")}
              </span>
            )}
          </div>

          {metadata.message && (
            <p className="text-sm mt-1 line-clamp-2" style={{ color: "rgba(44,44,44,0.7)" }}>
              {metadata.message}
            </p>
          )}

          <div className="mt-1.5 flex items-center gap-1">
            <span className="text-xs" style={{ color: "#8B7D7D" }}>{t.cardFrom}</span>
            <span className="text-xs font-medium truncate" style={{ color: "#9C4EDB" }}>
              {displayName}
            </span>
          </div>
          <p className="text-[11px] mt-2" style={{ color: "rgba(44,44,44,0.45)" }}>
            {t.cardOpen}
          </p>
        </div>
        </div>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-lukso-card border-t border-lukso-border rounded-t-3xl p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="title-premium text-lg">{metadata.title}</h2>
              <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white text-xl leading-none">
                {t.close}
              </button>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <Avatar address={metadata.from as Address} size={32} chainId={chainId} />
              <div>
                <p className="text-xs text-white/40">{t.cardFrom}</p>
                <p className="text-sm font-medium text-lukso-purple">{displayName}</p>
              </div>
            </div>

            <div className="card bg-white/5 border-white/10">
              <p className="text-sm whitespace-pre-wrap" style={{ color: "rgba(44,44,44,0.82)" }}>
                {metadata.message || "💜"}
              </p>
            </div>

            {metadata.timestamp > 0 && (
              <p className="text-xs text-white/40 mt-3 text-right">
                {format(new Date(metadata.timestamp * 1000), "MMM d, yyyy")}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
