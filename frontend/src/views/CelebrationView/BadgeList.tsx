import { useBadges } from "@/hooks/useBadges";
import { BadgeCard } from "@/components/BadgeCard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useT } from "@/hooks/useT";
import type { Address } from "@/types";

interface BadgeListProps {
  profileAddress: Address;
  chainId: number;
}

export function BadgeList({ profileAddress, chainId }: BadgeListProps) {
  const t = useT();
  const { data: badges, isLoading } = useBadges(profileAddress, chainId);

  if (isLoading) return <LoadingSpinner size="sm" className="mx-auto" />;

  if (!badges || badges.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-white/30">{t.badgeListEmpty}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {badges.map((badge) => (
        <BadgeCard key={badge.tokenId} badge={badge} />
      ))}
    </div>
  );
}
