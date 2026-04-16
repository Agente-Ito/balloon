import { useAppStore } from "@/store/useAppStore";
import { useProfileData } from "@/hooks/useUniversalProfile";
import { WishlistItemRow } from "./WishlistItem";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Avatar } from "@/components/Avatar";
import type { WalletClient, PublicClient } from "viem";

interface WishlistProps {
  walletClient?: WalletClient;
  publicClient: PublicClient;
  chainId: number;
}

export function Wishlist({ chainId }: WishlistProps) {
  const { contextProfile, isOwner, setView } = useAppStore();
  const { data: profileData, isLoading } = useProfileData(contextProfile, chainId);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button
          onClick={() => setView("grid")}
          className="text-white/40 hover:text-white text-sm"
        >
          ← Back
        </button>
        <span className="font-semibold">Wishlist</span>
        {isOwner && (
          <button
            onClick={() => setView("editor")}
            className="text-xs text-lukso-purple hover:text-lukso-purple/80"
          >
            Edit
          </button>
        )}
      </div>

      {/* Profile hint */}
      {contextProfile && (
        <div className="flex items-center gap-2 px-4 py-2">
          <Avatar address={contextProfile} size={24} />
          <p className="text-xs text-white/40 font-mono">
            {contextProfile.slice(0, 8)}…{contextProfile.slice(-6)}'s wishlist
          </p>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner />
          </div>
        ) : !profileData?.settings.wishlistVisible && !isOwner ? (
          <div className="card text-center py-8 mt-4">
            <p className="text-2xl mb-2">🔒</p>
            <p className="text-sm text-white/40">Wishlist is private</p>
          </div>
        ) : profileData?.wishlist.length === 0 ? (
          <div className="card text-center py-8 mt-4">
            <p className="text-2xl mb-2">📭</p>
            <p className="text-sm text-white/40">No wishlist items yet</p>
            {isOwner && (
              <button
                onClick={() => setView("editor")}
                className="btn-secondary mt-3 text-xs px-3 py-1"
              >
                Add items
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2 mt-2">
            {profileData?.wishlist.map((item) => (
              <WishlistItemRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
