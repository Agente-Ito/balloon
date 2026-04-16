import { format } from "date-fns";
import { CELEBRATION_EMOJIS } from "@/constants/celebrationTypes";
import type { GreetingCard } from "@/types";

interface GreetingCardTileProps {
  card: GreetingCard;
  className?: string;
}

export function GreetingCardTile({ card, className = "" }: GreetingCardTileProps) {
  const { metadata } = card;
  const emoji = CELEBRATION_EMOJIS[metadata.celebration];

  return (
    <div className={`card ${className}`}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-lukso-purple/20 flex items-center justify-center text-xl flex-shrink-0">
          {emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-white truncate">{metadata.title}</span>
            {metadata.timestamp > 0 && (
              <span className="text-xs text-white/30 flex-shrink-0">
                {format(new Date(metadata.timestamp * 1000), "MMM d, yyyy")}
              </span>
            )}
          </div>

          {metadata.message && (
            <p className="text-sm text-white/70 mt-1 line-clamp-2">{metadata.message}</p>
          )}

          <div className="mt-2 flex items-center gap-1">
            <span className="text-xs text-white/30">From</span>
            <span className="text-xs text-lukso-purple font-mono">
              {metadata.from.slice(0, 6)}...{metadata.from.slice(-4)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
