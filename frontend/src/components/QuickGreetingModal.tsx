import { useState } from "react";
import toast from "react-hot-toast";
import { useT } from "@/hooks/useT";
import { Avatar } from "@/components/Avatar";
import { useLSP3Name } from "@/hooks/useLSP3Name";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useAppStore } from "@/store/useAppStore";
import type { BurstPreset, BurstTheme } from "@/store/useAppStore";
import type { Address } from "@/types";

const INDEXER_URL = import.meta.env.VITE_INDEXER_URL ?? "http://localhost:3001/api";

type QuickReaction = "celebrate" | "hug" | "applause" | "party" | "sparkle";

const REACTIONS: Array<{ value: QuickReaction; emoji: string }> = [
  { value: "celebrate", emoji: "🎉" },
  { value: "hug", emoji: "🤗" },
  { value: "applause", emoji: "👏" },
  { value: "party", emoji: "🥳" },
  { value: "sparkle", emoji: "✨" },
];

const REACTION_BURST: Record<QuickReaction, { preset: BurstPreset; theme: BurstTheme }> = {
  celebrate: { preset: "gentle", theme: "holiday" },
  hug: { preset: "single", theme: "anniversary" },
  applause: { preset: "single", theme: "graduation" },
  party: { preset: "celebration", theme: "birthday" },
  sparkle: { preset: "single", theme: "mixed" },
};

interface QuickGreetingModalProps {
  onClose: () => void;
  recipientAddress: Address;
  senderAddress: Address;
  chainId: number;
  onOpenOnchain?: () => void;
}

export function QuickGreetingModal({
  onClose,
  recipientAddress,
  senderAddress,
  chainId,
  onOpenOnchain,
}: QuickGreetingModalProps) {
  const t = useT();
  const triggerBurst = useAppStore((s) => s.triggerBurst);
  const [reaction, setReaction] = useState<QuickReaction>("celebrate");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const { data: recipientName } = useLSP3Name(recipientAddress, chainId);

  const recipientDisplay = recipientName
    ?? `${recipientAddress.slice(0, 8)}...${recipientAddress.slice(-4)}`;

  const sendQuickGreeting = async () => {
    setIsSending(true);
    try {
      const res = await fetch(`${INDEXER_URL}/quick-greetings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: senderAddress,
          recipient: recipientAddress,
          reaction,
          message: message.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({} as Record<string, unknown>));
        if (body.error === "QuickGreetingRateLimited") {
          const retryAfterSeconds = Number(body.retryAfterSeconds ?? 0);
          const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
          const text = t.quickGreetingRateLimitedIn.replace("{minutes}", String(minutes));
          toast.error(text);
          return;
        }
        throw new Error(String(body.error ?? `HTTP ${res.status}`));
      }
      toast.success(t.quickGreetingSent);
      const fx = REACTION_BURST[reaction];
      triggerBurst(fx.preset, fx.theme);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : t.quickGreetingFailed;
      if (msg.includes("QuickGreetingRateLimited")) {
        toast.error(t.quickGreetingRateLimited);
      } else {
        toast.error(msg.slice(0, 100));
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-lukso-card border-t border-lukso-border rounded-t-3xl p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h2 className="title-premium text-lg">{t.quickGreetingTitle}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white text-xl leading-none">
            {t.close}
          </button>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <Avatar address={recipientAddress} size={32} chainId={chainId} />
          <div>
            <p className="text-xs text-white/40">{t.cardTo}</p>
            <p className="text-sm font-medium text-lukso-purple">{recipientDisplay}</p>
          </div>
        </div>

        <p className="text-xs text-white/50 mb-2">{t.quickGreetingPickReaction}</p>
        <div className="grid grid-cols-5 gap-2 mb-3">
          {REACTIONS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setReaction(item.value)}
              className={`h-10 rounded-xl border text-lg ${
                reaction === item.value
                  ? "bg-lukso-purple/20 border-lukso-purple/50"
                  : "bg-white/5 border-white/10"
              }`}
            >
              {item.emoji}
            </button>
          ))}
        </div>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, 220))}
          placeholder={t.quickGreetingOptionalMessage}
          rows={3}
          className="input resize-none"
        />

        <p className="text-[11px] text-white/35 mt-2">{t.quickGreetingNoTxHint}</p>

        <div className="flex gap-2 mt-4">
          {onOpenOnchain ? (
            <button
              type="button"
              onClick={onOpenOnchain}
              className="btn-ghost flex-1 text-xs py-2 border border-lukso-border"
            >
              {t.quickGreetingOnchainOption}
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              disabled={isSending}
              className="btn-secondary flex-1 text-xs py-2"
            >
              {t.cancel}
            </button>
          )}
          <button
            type="button"
            onClick={sendQuickGreeting}
            disabled={isSending}
            className="btn-primary flex-1 text-xs py-2 flex items-center justify-center gap-2"
          >
            {isSending ? <LoadingSpinner size="sm" /> : null}
            {isSending ? t.quickGreetingSending : t.quickGreetingSend}
          </button>
        </div>
      </div>
    </div>
  );
}
