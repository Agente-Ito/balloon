/**
 * GreetingInboxView — shows all greeting cards received by the viewed profile.
 */
import type { Address } from "@/app/types";
import { useGreetingInbox } from "@/app/hooks/useGreetingInbox";
import { EmptyState } from "@/app/components/EmptyState";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { celebrationTypeEmoji } from "@/app/utils/mappers";

interface GreetingInboxViewProps {
  profileAddress: Address | null;
  chainId: number;
}

export function GreetingInboxView({ profileAddress, chainId }: GreetingInboxViewProps) {
  const { data: cards, isLoading, error } = useGreetingInbox(profileAddress, chainId);

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
        title="Could not load messages"
        description={error instanceof Error ? error.message : "Unknown error"}
      />
    );
  }

  if (!cards || cards.length === 0) {
    return (
      <EmptyState
        emoji="💌"
        title="Inbox empty"
        description="Greeting cards from friends and followers appear here."
      />
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">
        Messages · {cards.length}
      </h2>
      <div className="space-y-3">
        {cards.map((card) => (
          <div key={card.tokenId} className="card flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-lukso-purple/20 flex items-center justify-center text-xl flex-shrink-0">
              {celebrationTypeEmoji(card.celebrationType)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: "#2C2C2C" }}>{card.message || "(no message)"}</p>
              <div className="mt-1 flex items-center gap-1">
                <span className="text-xs text-white/30">From</span>
                <span className="text-xs text-lukso-purple font-mono">
                  {card.fromProfile.slice(0, 6)}...{card.fromProfile.slice(-4)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
