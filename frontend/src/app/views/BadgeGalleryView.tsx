/**
 * BadgeGalleryView — shows all celebration badges owned by the viewed profile.
 */
import type { Address } from "@/app/types";
import { useBadgeGallery } from "@/app/hooks/useBadgeGallery";
import { CelebrationBadge } from "@/app/components/CelebrationBadge";
import { EmptyState } from "@/app/components/EmptyState";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface BadgeGalleryViewProps {
  profileAddress: Address | null;
  chainId: number;
}

export function BadgeGalleryView({ profileAddress, chainId }: BadgeGalleryViewProps) {
  const { data: badges, isLoading, error } = useBadgeGallery(profileAddress, chainId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        emoji="⚠️"
        title="Could not load badges"
        description={error instanceof Error ? error.message : "Unknown error"}
      />
    );
  }

  if (!badges || badges.length === 0) {
    return (
      <EmptyState
        emoji="🏅"
        title="No badges yet"
        description="Celebration badges appear here when minted for this profile."
      />
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">
        Badges · {badges.length}
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {badges.map((badge) => (
          <CelebrationBadge key={badge.tokenId} badge={badge} />
        ))}
      </div>
    </div>
  );
}
