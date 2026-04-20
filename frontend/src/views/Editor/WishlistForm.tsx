import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useT } from "@/hooks/useT";
import type { WishlistItem, WishlistItemType } from "@/types";

interface WishlistFormProps {
  onSave: (item: WishlistItem) => void;
  onCancel: () => void;
}

export function WishlistForm({ onSave, onCancel }: WishlistFormProps) {
  const t = useT();
  const [type, setType] = useState<WishlistItemType>("lsp8");
  const [name, setName] = useState("");
  const [assetAddress, setAssetAddress] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      id: uuidv4(),
      type,
      name: name.trim(),
      assetAddress: assetAddress.trim() ? (assetAddress.trim() as `0x${string}`) : undefined,
      tokenId: tokenId.trim() || undefined,
      description: description.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type */}
      <div>
        <label className="block text-xs text-white/50 mb-1">{t.wishlistType}</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
          {(["lsp8", "lsp7", "note"] as WishlistItemType[]).map((tp) => (
            <button
              key={tp}
              type="button"
              onClick={() => setType(tp)}
              className={`py-2 rounded-xl text-xs font-medium transition-colors ${
                type === tp ? "bg-lukso-purple text-white" : "bg-white/5 text-white/50 hover:bg-white/10"
              }`}
            >
              {tp === "lsp8" ? t.wishlistTypeNFT : tp === "lsp7" ? t.wishlistTypeToken : t.wishlistTypeNote}
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="block text-xs text-white/50 mb-1">{t.wishlistName}</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.wishlistNamePlaceholder}
          className="input"
          required
        />
      </div>

      {/* Contract address */}
      {type !== "note" && (
        <div>
          <label className="block text-xs text-white/50 mb-1">{t.wishlistContract}</label>
          <input
            type="text"
            value={assetAddress}
            onChange={(e) => setAssetAddress(e.target.value)}
            placeholder="0x…"
            className="input font-mono text-xs"
          />
        </div>
      )}

      {/* Token ID */}
      {type === "lsp8" && (
        <div>
          <label className="block text-xs text-white/50 mb-1">{t.wishlistTokenId}</label>
          <input
            type="text"
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
            placeholder={t.wishlistTokenIdPlaceholder}
            className="input font-mono text-xs"
          />
        </div>
      )}

      {/* Description */}
      <div>
        <label className="block text-xs text-white/50 mb-1">{t.wishlistDesc}</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t.wishlistDescPlaceholder}
          rows={2}
          className="input resize-none"
          maxLength={200}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">
          {t.cancel}
        </button>
        <button type="submit" className="btn-primary flex-1" disabled={!name.trim()}>
          {t.wishlistAddBtn}
        </button>
      </div>
    </form>
  );
}
