/**
 * ProfileCelebrationView — top-level profile celebration page combining
 * the badge gallery, greeting inbox, and profile header into a single view.
 * This is the main "other person's page" view in the app.
 */
import { useState } from "react";
import type { Address } from "@/app/types";
import type { PublicClient, WalletClient } from "viem";
import { Avatar } from "@/components/Avatar";
import { BadgeGalleryView } from "./BadgeGalleryView";
import { GreetingInboxView } from "./GreetingInboxView";
import { useAppStore } from "@/store/useAppStore";

type Tab = "badges" | "messages";

interface ProfileCelebrationViewProps {
  profileAddress: Address | null;
  connectedAccount: Address | null;
  walletClient: WalletClient | undefined;
  publicClient: PublicClient;
  chainId: number;
  onSendGreeting?: () => void;
  onMintBadge?: () => void;
}

export function ProfileCelebrationView({
  profileAddress,
  connectedAccount,
  chainId,
  onSendGreeting,
  onMintBadge,
}: ProfileCelebrationViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>("badges");
  const { isOwner } = useAppStore();

  if (!profileAddress) return null;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex flex-col items-center gap-3 pt-8 pb-5 px-4 bg-lukso-card border-b border-lukso-border">
        <Avatar address={profileAddress} size={72} />

        <div className="text-center">
          <p className="text-xs text-white/30 font-mono">
            {profileAddress.slice(0, 6)}…{profileAddress.slice(-4)}
          </p>
        </div>

        {/* Action buttons — shown to non-owners */}
        {!isOwner && connectedAccount && (
          <div className="flex gap-2 mt-1">
            {onSendGreeting && (
              <button onClick={onSendGreeting} className="btn-primary text-sm px-4 py-2">
                Send Card 💌
              </button>
            )}
            {onMintBadge && (
              <button onClick={onMintBadge} className="btn-secondary text-sm px-4 py-2">
                Mint Badge 🏅
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-lukso-border">
        {(["badges", "messages"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-medium capitalize transition-colors
              ${activeTab === tab
                ? "text-white border-b-2 border-lukso-purple"
                : "text-white/40 hover:text-white/60"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "badges" && (
          <BadgeGalleryView profileAddress={profileAddress} chainId={chainId} />
        )}
        {activeTab === "messages" && (
          <GreetingInboxView profileAddress={profileAddress} chainId={chainId} />
        )}
      </div>
    </div>
  );
}
