import { useReceivedGreetingCards } from "@/hooks/useGreetingCards";
import { GreetingCardTile } from "@/components/GreetingCardTile";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import type { Address } from "@/types";

interface GreetingCardListProps {
  profileAddress: Address;
  chainId: number;
}

export function GreetingCardList({ profileAddress, chainId }: GreetingCardListProps) {
  const { data: cards, isLoading } = useReceivedGreetingCards(profileAddress, chainId);

  if (isLoading) return <LoadingSpinner size="sm" className="mx-auto" />;

  if (!cards || cards.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-white/30">No greeting cards received yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {cards.map((card) => (
        <GreetingCardTile key={card.tokenId} card={card} />
      ))}
    </div>
  );
}
