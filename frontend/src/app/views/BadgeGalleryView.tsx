import type { Address } from "@/app/types";
import { useBadgeGallery } from "@/app/hooks/useBadgeGallery";
import { CelebrationBadge } from "@/app/components/CelebrationBadge";
import { EmptyState } from "@/app/components/EmptyState";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { BalloonIcon } from "@/components/BalloonIcon";

interface BadgeGalleryViewProps {
  profileAddress: Address | null;
  chainId: number;
}

export function BadgeGalleryView({ profileAddress, chainId }: BadgeGalleryViewProps) {
  const { data: stamps, isLoading, error } = useBadgeGallery(profileAddress, chainId);

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
        title="Could not load passport"
        description={error instanceof Error ? error.message : "Unknown error"}
      />
    );
  }

  if (!stamps || stamps.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center px-6">
        <BalloonIcon size={56} className="animate-float-slow opacity-70" />
        <div>
          <p className="text-sm font-semibold text-cel-text/70">Pasaporte sin sellos</p>
          <p className="text-xs text-cel-muted mt-1">
            Los sellos se acumulan aquí cada vez que participes en una celebración o drops.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Passport header */}
      <div className="flex items-center gap-2 mb-4">
        <BalloonIcon size={22} />
        <h2 className="text-sm font-semibold text-cel-text/70 uppercase tracking-wider">
          Pasaporte · {stamps.length} {stamps.length === 1 ? "sello" : "sellos"}
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stamps.map((stamp) => (
          <CelebrationBadge key={stamp.tokenId} badge={stamp} />
        ))}
      </div>
    </div>
  );
}
