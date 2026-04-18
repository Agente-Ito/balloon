/**
 * CelebrationView — hero view for a specific celebration day.
 * Shows: profile avatar, celebration type, and CTAs (mint badge, send greeting, gift).
 */
import { useState } from "react";
import { format, parseISO } from "date-fns";
import { useAppStore } from "@/store/useAppStore";
import { useProfileData } from "@/hooks/useUniversalProfile";
import { useCalendar } from "@/hooks/useCalendar";
import { useCanSendGreeting } from "@/hooks/useGreetingCards";
import { Avatar } from "@/components/Avatar";
import { MintBadgeModal } from "@/components/MintBadgeModal";
import { SendGreetingModal } from "@/components/SendGreetingModal";
import { GiftAssetModal } from "@/components/GiftAssetModal";
import { BadgeList } from "./BadgeList";
import { GreetingCardList } from "./GreetingCardList";
import { CELEBRATION_COLORS, CELEBRATION_LABELS } from "@/constants/celebrationTypes";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useT } from "@/hooks/useT";
import type { WalletClient, PublicClient } from "viem";
import type { CelebrationType } from "@/types";

interface CelebrationViewProps {
  walletClient?: WalletClient;
  publicClient: PublicClient;
  chainId: number;
}

type Modal = "badge" | "greeting" | "gift" | null;

export function CelebrationView({ walletClient, chainId }: CelebrationViewProps) {
  const {
    contextProfile,
    connectedAccount,
    isOwner,
    activeCelebrationDate,
    setView,
  } = useAppStore();

  const t = useT();
  const [activeTab, setActiveTab] = useState<"badges" | "cards">("badges");
  const [openModal, setOpenModal] = useState<Modal>(null);

  const { data: profileData, isLoading } = useProfileData(contextProfile, chainId);
  const today = new Date();
  const { celebrationDays } = useCalendar({
    profileData,
    month: activeCelebrationDate ? parseISO(activeCelebrationDate) : today,
  });

  const dayData = celebrationDays.find((d) => d.date === activeCelebrationDate);
  const primaryCelebration = dayData?.celebrations[0];

  const { data: canSendData } = useCanSendGreeting(connectedAccount, contextProfile, chainId);

  if (isLoading || !primaryCelebration) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const celebrationType = primaryCelebration.type as CelebrationType;
  const year = activeCelebrationDate
    ? parseInt(activeCelebrationDate.split("-")[0])
    : today.getFullYear();

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button
          onClick={() => setView("calendar")}
          className="text-white/40 hover:text-white text-sm"
        >
          {t.celebrationBack}
        </button>
        <span className="text-xs text-white/30 font-mono">
          {activeCelebrationDate && format(parseISO(activeCelebrationDate), "MMM d, yyyy")}
        </span>
        <LanguageToggle />
      </div>

      {/* Hero */}
      <div className="flex flex-col items-center gap-3 px-4 py-6">
        <div className="relative">
          <Avatar address={contextProfile} size={72} />
          <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-lukso-bg ${CELEBRATION_COLORS[celebrationType]}`} />
        </div>

        <div className="text-center">
          <h1 className="text-xl font-bold">{primaryCelebration.title}</h1>
          <p className="text-sm text-white/50 mt-0.5">
            {CELEBRATION_LABELS[celebrationType]} · {year}
          </p>
          {contextProfile && (
            <p className="text-xs text-lukso-purple font-mono mt-1">
              {contextProfile.slice(0, 10)}…{contextProfile.slice(-6)}
            </p>
          )}
        </div>

        {/* Multiple celebrations today */}
        {dayData && dayData.celebrations.length > 1 && (
          <div className="flex gap-2">
            {dayData.celebrations.slice(1).map((c) => (
              <span key={c.id} className="badge bg-white/5 text-white/60 flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${CELEBRATION_COLORS[c.type]}`} />
                {c.title}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* CTAs */}
      <div className="px-4 grid grid-cols-3 gap-2 mb-4">
        {/* Mint badge — only for own profile */}
        {isOwner && (
          <button
            onClick={() => setOpenModal("badge")}
            className="card flex flex-col items-center gap-2 py-3 hover:border-lukso-pink/40 transition-colors"
          >
            <span className="w-5 h-5 rounded-full bg-lukso-pink/60" />
            <span className="text-xs text-center text-white/70 leading-tight">{t.celebrationMintBadge}</span>
          </button>
        )}

        {/* Send greeting — anyone except self */}
        {!isOwner && connectedAccount && (
          <button
            onClick={() => setOpenModal("greeting")}
            disabled={canSendData?.canSend === false}
            className="card flex flex-col items-center gap-2 py-3 hover:border-lukso-purple/40 transition-colors disabled:opacity-40"
          >
            <span className="w-5 h-5 rounded-full bg-lukso-purple/60" />
            <span className="text-xs text-center text-white/70 leading-tight">
              {canSendData?.canSend === false ? t.celebrationSentToday : t.celebrationSendGreeting}
            </span>
          </button>
        )}

        {/* Gift asset */}
        {!isOwner && (
          <button
            onClick={() => setOpenModal("gift")}
            className="card flex flex-col items-center gap-2 py-3 hover:border-green-500/40 transition-colors"
          >
            <span className="w-5 h-5 rounded-full bg-green-500/60" />
            <span className="text-xs text-center text-white/70 leading-tight">{t.celebrationGiftAsset}</span>
          </button>
        )}

        {/* Wishlist — always visible */}
        <button
          onClick={() => setView("wishlist")}
          className="card flex flex-col items-center gap-2 py-3 hover:border-white/20 transition-colors"
        >
          <span className="w-5 h-5 rounded-full bg-white/20" />
          <span className="text-xs text-center text-white/70 leading-tight">{t.celebrationWishlistBtn}</span>
        </button>
      </div>

      {/* Tabs: Badges / Greeting Cards */}
      <div className="px-4 flex gap-1 mb-3">
        {(["badges", "cards"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            {tab === "badges" ? t.celebrationTabBadges : t.celebrationTabCards}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {contextProfile && activeTab === "badges" && (
          <BadgeList profileAddress={contextProfile} chainId={chainId} />
        )}
        {contextProfile && activeTab === "cards" && (
          <GreetingCardList profileAddress={contextProfile} chainId={chainId} />
        )}
      </div>

      {/* Modals */}
      {openModal === "badge" && contextProfile && (
        <MintBadgeModal
          onClose={() => setOpenModal(null)}
          recipientAddress={contextProfile}
          celebrationType={celebrationType}
          year={year}
          walletClient={walletClient ?? null}
          chainId={chainId}
        />
      )}
      {openModal === "greeting" && contextProfile && connectedAccount && (
        <SendGreetingModal
          onClose={() => setOpenModal(null)}
          recipientAddress={contextProfile}
          senderAddress={connectedAccount}
          celebrationType={celebrationType}
          walletClient={walletClient ?? null}
          chainId={chainId}
        />
      )}
      {openModal === "gift" && contextProfile && (
        <GiftAssetModal
          onClose={() => setOpenModal(null)}
          recipientAddress={contextProfile}
          wishlist={profileData?.wishlist ?? []}
        />
      )}
    </div>
  );
}
