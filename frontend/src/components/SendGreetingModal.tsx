import { useState } from "react";
import toast from "react-hot-toast";
import { useSendGreeting } from "@/hooks/useSendGreeting";
import { getCelebrationTypeKey } from "@/constants/celebrationTypes";
import { useT } from "@/hooks/useT";
import { LoadingSpinner } from "./LoadingSpinner";
import { Avatar } from "./Avatar";
import { useLSP3Name } from "@/hooks/useLSP3Name";
import { useAppStore } from "@/store/useAppStore";
import { CelebrationType, type Address } from "@/types";
import type { WalletClient } from "viem";

interface SendGreetingModalProps {
  onClose: () => void;
  recipientAddress: Address;
  senderAddress: Address;
  celebrationType: CelebrationType;
  walletClient: WalletClient | null;
  chainId: number;
}

export function SendGreetingModal({
  onClose,
  recipientAddress,
  senderAddress,
  celebrationType,
  walletClient,
  chainId,
}: SendGreetingModalProps) {
  const t = useT();
  const triggerBurst = useAppStore((s) => s.triggerBurst);
  const [message, setMessage] = useState("");
  const { mutateAsync: sendGreeting, isPending } = useSendGreeting(
    walletClient ?? null,
    senderAddress,
    chainId
  );
  const { data: senderName } = useLSP3Name(senderAddress, chainId);
  const { data: recipientName } = useLSP3Name(recipientAddress, chainId);

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error(t.toastNoWallet);
      return;
    }
    try {
      await sendGreeting({ to: recipientAddress, celebrationType, message: message.trim() });
      toast.success(t.toastGreetingSent);
      if (celebrationType === CelebrationType.Birthday) {
        triggerBurst("celebration", "birthday");
      } else if (celebrationType === CelebrationType.GlobalHoliday) {
        triggerBurst("gentle", "holiday");
      } else if (celebrationType === CelebrationType.UPAnniversary) {
        triggerBurst("gentle", "anniversary");
      } else {
        triggerBurst("gentle", "mixed");
      }
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : t.toastGreetingFailed;
      if (msg.includes("GreetingRateLimited")) {
        toast.error(t.toastGreetingRateLimited);
      } else {
        toast.error(msg.slice(0, 80));
      }
    }
  };

  const label = t[getCelebrationTypeKey(celebrationType) as keyof typeof t];
  const charsLeft = 280 - message.length;

  const recipientDisplay = recipientName
    ?? `${recipientAddress.slice(0, 8)}…${recipientAddress.slice(-4)}`;
  const senderDisplay = senderName
    ?? `${senderAddress.slice(0, 8)}…${senderAddress.slice(-4)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-lukso-card border-t border-lukso-border rounded-t-3xl p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h2 className="title-premium text-lg">{t.celebrationSendGreeting}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white text-xl leading-none">
            {t.close}
          </button>
        </div>

        {/* Recipient */}
        <div className="flex items-center gap-2 mb-4">
          <Avatar address={recipientAddress} size={32} chainId={chainId} />
          <div>
            <p className="text-xs text-white/40">{t.cardTo}</p>
            <p className="text-sm font-medium text-lukso-purple">{recipientDisplay}</p>
          </div>
        </div>

        <div className="relative mb-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 280))}
            placeholder={`${t.greetingPlaceholder} ${label.toLowerCase()}…`}
            rows={4}
            className="input resize-none"
          />
          <span
            className={`absolute bottom-3 right-3 text-xs ${
              charsLeft < 20 ? "text-lukso-pink" : "text-white/30"
            }`}
          >
            {charsLeft}
          </span>
        </div>

        {/* Sender signature */}
        <p className="text-xs text-white/40 mb-3 text-right italic">
          — {t.cardFrom} {senderDisplay}
        </p>

        <p className="text-xs text-white/30 mb-4">{t.greetingNftNote}</p>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">{t.cancel}</button>
          <button
            onClick={handleSend}
            disabled={isPending || !message.trim()}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {isPending ? <LoadingSpinner size="sm" /> : null}
            {isPending ? t.greetingSending : t.celebrationSendGreeting}
          </button>
        </div>
      </div>
    </div>
  );
}
