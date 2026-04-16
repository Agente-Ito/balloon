import { useState } from "react";
import toast from "react-hot-toast";
import { useSendGreeting } from "@/hooks/useSendGreeting";
import { CELEBRATION_LABELS, CELEBRATION_EMOJIS } from "@/constants/celebrationTypes";
import { LoadingSpinner } from "./LoadingSpinner";
import type { Address, CelebrationType } from "@/types";
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
  const [message, setMessage] = useState("");
  const { mutateAsync: sendGreeting, isPending } = useSendGreeting(
    walletClient ?? null,
    senderAddress,
    chainId
  );

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error("Write a message first!");
      return;
    }
    try {
      await sendGreeting({ to: recipientAddress, celebrationType, message: message.trim() });
      toast.success("Greeting card sent! 💌");
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send";
      if (msg.includes("GreetingRateLimited")) {
        toast.error("You already sent a card today. Try again tomorrow!");
      } else {
        toast.error(msg.slice(0, 80));
      }
    }
  };

  const emoji = CELEBRATION_EMOJIS[celebrationType];
  const label = CELEBRATION_LABELS[celebrationType];
  const charsLeft = 280 - message.length;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-lukso-card border-t border-lukso-border rounded-t-3xl p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="text-xl">{emoji}</span>
            <h2 className="text-lg font-semibold">Send Greeting</h2>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white text-xl leading-none">
            ×
          </button>
        </div>

        <p className="text-sm text-white/50 mb-4">
          Sending a <span className="text-white">{label}</span> greeting card to{" "}
          <span className="font-mono text-lukso-purple">
            {recipientAddress.slice(0, 8)}...{recipientAddress.slice(-4)}
          </span>
        </p>

        <div className="relative mb-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 280))}
            placeholder={`Write your ${label.toLowerCase()} message…`}
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

        <p className="text-xs text-white/30 mb-4">
          This card will be minted as an NFT on LUKSO and permanently sent to their Universal Profile.
        </p>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={isPending || !message.trim()}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {isPending ? <LoadingSpinner size="sm" /> : null}
            {isPending ? "Sending…" : "Send Card 💌"}
          </button>
        </div>
      </div>
    </div>
  );
}
