import { useT } from "@/hooks/useT";
import type { WishlistItem as WishlistItemType } from "@/types";

interface WishlistItemProps {
  item: WishlistItemType;
}

export function WishlistItemRow({ item }: WishlistItemProps) {
  const t = useT();
  const typeLabel = {
    lsp8: t.wishlistItemNFT,
    lsp7: t.wishlistItemToken,
    note: t.wishlistItemNote,
  }[item.type];
  const typeColor = {
    lsp8: "bg-lukso-purple/20 text-lukso-purple",
    lsp7: "bg-amber-500/20 text-amber-300",
    note: "bg-white/10 text-white/50",
  }[item.type];

  return (
    <div className="card flex items-start gap-3">
      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="w-5 h-5 rounded-full bg-white/10" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{item.name}</span>
          <span className={`badge ${typeColor} text-[10px]`}>{typeLabel}</span>
        </div>

        {item.description && (
          <p className="text-xs text-white/50 mt-0.5">{item.description}</p>
        )}

        {item.assetAddress && (
          <p className="text-xs text-white/30 font-mono mt-1 truncate">{item.assetAddress}</p>
        )}
      </div>

      {item.type !== "note" && item.assetAddress && (
        <a
          href={`https://universaleverything.io/asset/${item.assetAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary text-xs px-2 py-1 flex-shrink-0"
        >
          {t.wishlistViewBtn} ↗
        </a>
      )}
    </div>
  );
}
