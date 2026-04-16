import { resolveIPFSUrl } from "@/lib/ipfs";
import { CELEBRATION_LABELS, CELEBRATION_EMOJIS, CELEBRATION_COLORS } from "@/constants/celebrationTypes";
import type { Badge } from "@/types";

interface BadgeCardProps {
  badge: Badge;
  className?: string;
}

export function BadgeCard({ badge, className = "" }: BadgeCardProps) {
  const { metadata, soulbound } = badge;
  const emoji = CELEBRATION_EMOJIS[metadata.celebrationType];
  const label = CELEBRATION_LABELS[metadata.celebrationType];
  const colorClass = CELEBRATION_COLORS[metadata.celebrationType];

  return (
    <div className={`card flex flex-col gap-3 ${className}`}>
      {/* Badge art */}
      <div
        className={`w-full aspect-square rounded-xl flex items-center justify-center text-4xl ${colorClass} bg-opacity-20`}
      >
        {metadata.image ? (
          <img
            src={resolveIPFSUrl(metadata.image)}
            alt={metadata.title}
            className="w-full h-full object-cover rounded-xl"
          />
        ) : (
          <span>{emoji}</span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-white">{metadata.title}</span>
          {soulbound && (
            <span className="badge bg-lukso-pink/20 text-lukso-pink text-[10px]">Soulbound</span>
          )}
        </div>
        <span className="text-xs text-white/50">
          {label} · {metadata.year}
        </span>
      </div>
    </div>
  );
}
