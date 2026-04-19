import { useReceivedGreetingCards } from "@/hooks/useGreetingCards";
import { useQuickGreetings } from "@/hooks/useQuickGreetings";
import { GreetingCardTile } from "@/components/GreetingCardTile";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useT } from "@/hooks/useT";
import type { Address } from "@/types";

interface GreetingCardListProps {
  profileAddress: Address;
  chainId: number;
}

export function GreetingCardList({ profileAddress, chainId }: GreetingCardListProps) {
  const t = useT();
  const { data: cards, isLoading } = useReceivedGreetingCards(profileAddress, chainId);
  const { data: quickGreetings, isLoading: isLoadingQuick } = useQuickGreetings(profileAddress, 20);

  const reactionEmoji = (reaction: string) => {
    if (reaction === "hug") return "🤗";
    if (reaction === "applause") return "👏";
    if (reaction === "party") return "🥳";
    if (reaction === "sparkle") return "✨";
    return "🎉";
  };

  const relativeTime = (timestamp: number) => {
    const diff = timestamp - Math.floor(Date.now() / 1000);
    const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
    const abs = Math.abs(diff);
    if (abs < 60) return rtf.format(Math.round(diff), "second");
    if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
    if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
    return rtf.format(Math.round(diff / 86400), "day");
  };

  if (isLoading && isLoadingQuick) return <LoadingSpinner size="sm" className="mx-auto" />;

  const noCards = !cards || cards.length === 0;
  const noQuick = !quickGreetings || quickGreetings.length === 0;

  if (noCards && noQuick) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-white/30">{t.cardListEmpty}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {!noQuick && (
        <div className="space-y-2">
          <p className="text-xs text-white/40 uppercase tracking-wide font-medium">{t.quickGreetingInboxTitle}</p>
          {quickGreetings!.map((item) => (
            <div key={`quick-${item.id}`} className="card flex items-start gap-3">
              <span className="text-xl leading-none">{reactionEmoji(item.reaction)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/45 mb-1">
                  {t.cardFrom} {item.sender.slice(0, 8)}…{item.sender.slice(-4)} · {relativeTime(item.created_at)}
                </p>
                {item.message ? (
                  <p className="text-sm text-white/85">{item.message}</p>
                ) : (
                  <p className="text-sm text-white/55">{t.quickGreetingNoMessage}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!noCards && cards!.map((card) => (
        <GreetingCardTile key={card.tokenId} card={card} chainId={chainId} />
      ))}
    </div>
  );
}
