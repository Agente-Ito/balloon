import type { WishlistItem as WishlistItemType } from "@/types";

interface WishlistItemProps {
  item: WishlistItemType;
}

export function WishlistItemRow({ item }: WishlistItemProps) {
  const typeLabel = { lsp8: "NFT", lsp7: "Token", note: "Note" }[item.type];
  const typeColor = {
    lsp8: "bg-lukso-purple/20 text-lukso-purple",
    lsp7: "bg-green-500/20 text-green-400",
    note: "bg-white/10 text-white/50",
  }[item.type];

  return (
    <div className="card flex items-start gap-3">
      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl flex-shrink-0">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover rounded-xl"
          />
        ) : (
          "🎁"
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
          View ↗
        </a>
      )}
    </div>
  );
}
