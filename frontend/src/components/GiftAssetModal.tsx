/**
 * GiftAssetModal — lets a user pick an asset from the recipient's wishlist
 * and navigate directly to transfer it. Does not perform the transfer itself
 * (the user is redirected to the asset's page or the LSP7/LSP8 transfer UI).
 */
import { useT } from "@/hooks/useT";
import type { Address, WishlistItem } from "@/types";

interface GiftAssetModalProps {
  onClose: () => void;
  recipientAddress: Address;
  wishlist: WishlistItem[];
}

export function GiftAssetModal({ onClose, wishlist }: GiftAssetModalProps) {
  const t = useT();
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-lukso-card border-t border-lukso-border rounded-t-3xl p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h2 className="title-premium text-lg">{t.celebrationGiftAsset}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white text-xl leading-none">
            {t.close}
          </button>
        </div>

        <p className="text-sm text-white/50 mb-4">
          {t.wishlistShortcutSub}
        </p>

        {wishlist.length === 0 ? (
          <div className="card text-center py-8 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-lukso-purple/10 border border-lukso-border mx-auto mb-3 flex items-center justify-center">
              <span className="w-6 h-6 rounded-full bg-lukso-purple/25" />
            </div>
            <p className="text-sm text-white/40">{t.giftModalEmpty}</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
            {wishlist.map((item) => (
              <WishlistItemRow key={item.id} item={item} />
            ))}
          </div>
        )}

        <button onClick={onClose} className="btn-secondary w-full">
          Close
        </button>
      </div>
    </div>
  );
}

function WishlistItemRow({ item }: { item: WishlistItem }) {
  const typeLabel = { lsp8: "NFT", lsp7: "Token", note: "Note" }[item.type];
  const typeColor = {
    lsp8: "bg-lukso-purple/20 text-lukso-purple",
    lsp7: "bg-amber-500/15 text-amber-700",
    note: "bg-white/10 text-white/50",
  }[item.type];

  return (
    <div className="card flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-xl flex-shrink-0">
        {item.image ? (
          <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
        ) : (
          <span className="w-6 h-6 rounded-full bg-lukso-purple/30" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{item.name}</span>
          <span className={`badge ${typeColor} text-[10px]`}>{typeLabel}</span>
        </div>
        {item.assetAddress && (
          <p className="text-xs text-white/30 font-mono truncate">{item.assetAddress}</p>
        )}
        {item.description && (
          <p className="text-xs text-white/40 truncate">{item.description}</p>
        )}
      </div>

      {item.type !== "note" && item.assetAddress && (
        <a
          href={`https://universaleverything.io/asset/${item.assetAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary text-xs px-3 py-1 flex-shrink-0"
        >
          View
        </a>
      )}
    </div>
  );
}
