import { format } from "date-fns";
import { Avatar } from "./Avatar";
import { useLSP3Name } from "@/hooks/useLSP3Name";
import { useT } from "@/hooks/useT";
import type { GreetingCard } from "@/types";
import type { Address } from "@/types";

interface GreetingCardTileProps {
  card: GreetingCard;
  chainId: number;
  className?: string;
}

export function GreetingCardTile({ card, chainId, className = "" }: GreetingCardTileProps) {
  const t = useT();
  const { metadata } = card;
  const { data: senderName } = useLSP3Name(metadata.from as Address, chainId);
  const displayName = senderName ?? `${metadata.from.slice(0, 6)}…${metadata.from.slice(-4)}`;

  return (
    <div className={`card ${className}`}>
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
        </div>
      </div>
    </div>
  );
}
