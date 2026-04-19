import { resolveIPFSUrl } from "@/lib/ipfs";
import { CELEBRATION_EMOJIS, CELEBRATION_COLORS, getCelebrationTypeKey } from "@/constants/celebrationTypes";
import { useT } from "@/hooks/useT";
import type { Badge } from "@/types";

interface BadgeCardProps {
  badge: Badge;
  className?: string;
}

export function BadgeCard({ badge, className = "" }: BadgeCardProps) {
  const t = useT();
  const { metadata, soulbound } = badge;
  const emoji = CELEBRATION_EMOJIS[metadata.celebrationType];
  const label = t[getCelebrationTypeKey(metadata.celebrationType) as keyof typeof t];
  const colorClass = CELEBRATION_COLORS[metadata.celebrationType];

  return (
    <div className={`card flex flex-col gap-3 ${className}`}>
      {/* Badge art */}
      <div
        className={`w-full aspect-square rounded-xl flex items-center justify-center text-4xl ${colorClass} bg-opacity-10`}
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
          <span className="text-sm font-semibold" style={{ color: "#2C2C2C" }}>
            {metadata.title}
          </span>
          {soulbound && (
            <span
              className="badge text-[10px] font-semibold"
              style={{
                background: "rgba(106,27,154,0.12)",
                color: "#6A1B9A",
              }}
            >
              Soulbound
            </span>
          )}
        </div>
        <span className="text-xs" style={{ color: "#8B7D7D" }}>
          {label} · {metadata.year}
        </span>
      </div>
    </div>
  );
}
