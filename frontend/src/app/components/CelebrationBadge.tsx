/**
 * CelebrationBadge — visual NFT badge card, used in the badge gallery view.
 */
import type { CelebrationBadge as CelebrationBadgeType } from "@/app/types";
import { celebrationTypeLabel, celebrationTypeEmoji } from "@/app/utils/mappers";

interface CelebrationBadgeProps {
  badge: CelebrationBadgeType;
  onClick?: () => void;
}

export function CelebrationBadge({ badge, onClick }: CelebrationBadgeProps) {
  const { celebrationType, year, transferable } = badge;
  const emoji = celebrationTypeEmoji(celebrationType);
  const label = celebrationTypeLabel(celebrationType);

  return (
    <button
      type="button"
      onClick={onClick}
      className="card text-left w-full hover:border-lukso-purple/40 transition-colors group"
    >
      {/* Badge image */}
      <div className="w-full aspect-square rounded-xl bg-gradient-to-br from-lukso-purple/20 to-lukso-pink/20 flex items-center justify-center mb-3 text-4xl group-hover:scale-105 transition-transform overflow-hidden">
        <span>{emoji}</span>
      </div>

      {/* Title */}
      <p className="text-sm font-semibold truncate">{label} {year}</p>

      {/* Meta row */}
      <div className="flex items-center gap-2 mt-1">
        <span className="text-xs text-white/40">{label}</span>
        <span className="text-white/20">·</span>
        <span className="text-xs text-white/40">{year}</span>
        {!transferable && (
          <>
            <span className="text-white/20">·</span>
            <span className="badge bg-lukso-pink/20 text-lukso-pink text-[10px]">Soulbound</span>
          </>
        )}
      </div>
    </button>
  );
}
