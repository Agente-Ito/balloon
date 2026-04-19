import { useAppStore } from "@/store/useAppStore";
import { useProfileData } from "@/hooks/useUniversalProfile";
import { WishlistItemRow } from "./WishlistItem";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Avatar } from "@/components/Avatar";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLSP3Name } from "@/hooks/useLSP3Name";
import { useT } from "@/hooks/useT";
import type { WalletClient, PublicClient } from "viem";

interface WishlistProps {
  walletClient?: WalletClient;
  publicClient: PublicClient;
  chainId: number;
}

export function Wishlist({ chainId }: WishlistProps) {
  const { contextProfile, isOwner, setView } = useAppStore();
  const t = useT();
  const { data: profileData, isLoading } = useProfileData(contextProfile, chainId);
  const { data: profileName } = useLSP3Name(contextProfile, chainId);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button
          onClick={() => setView("grid")}
          className="text-white/40 hover:text-white text-sm"
        >
          {t.back}
        </button>
        <span className="font-semibold">{t.wishlistTitle}</span>
        <div className="flex items-center gap-2">
          {isOwner && (
            <button
              onClick={() => setView("editor")}
              className="text-xs text-lukso-purple hover:text-lukso-purple/80"
            >
              {t.wishlistEditBtn}
            </button>
          )}
          <LanguageToggle />
        </div>
      </div>

      {/* Profile hint */}
      {contextProfile && (
        <div className="flex items-center gap-2 px-4 py-2">
          <Avatar address={contextProfile} size={24} />
          <p className="text-xs text-white/40">
            {(profileName ?? `${contextProfile.slice(0, 8)}…${contextProfile.slice(-6)}`) + t.wishlistItemsOf}
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
            <p className="text-sm text-white/40">{t.wishlistPrivate}</p>
          </div>
        ) : profileData?.wishlist.length === 0 ? (
          <div className="card text-center py-8 mt-4">
            <p className="text-sm text-white/40 mb-3">{t.wishlistEmpty}</p>
            {isOwner && (
              <button
                onClick={() => setView("editor")}
                className="btn-secondary text-xs px-3 py-1"
              >
                {t.wishlistEmptyOwner}
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
