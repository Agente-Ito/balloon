/**
 * GridCard — compact home shown in the Universal Profile Grid.
 * Keeps one visual focal point plus up to 3 clear actions.
 */
import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useProfileData } from "@/hooks/useUniversalProfile";
import { NetworkBadge } from "@/components/NetworkBadge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { BalloonIcon } from "@/components/BalloonIcon";
import { BalloonLogo } from "@/components/BalloonLogo";
import { Avatar } from "@/components/Avatar";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useT } from "@/hooks/useT";
import { useLSP3Profile } from "@/hooks/useLSP3Profile";
import { BirthdayNudgeCard, isBirthdayNudgeDismissed } from "./BirthdayNudgeCard";
import type { WalletClient, PublicClient } from "viem";

interface GridCardProps {
  walletClient?: WalletClient;
  publicClient: PublicClient;
  chainId: number;
}

export function GridCard({ walletClient, chainId }: GridCardProps) {
  const { contextProfile, isOwner, setView, setEditorEntry } = useAppStore();
  const t = useT();
  const { data: profileData, isLoading } = useProfileData(contextProfile, chainId);
  const { data: lsp3 } = useLSP3Profile(contextProfile, chainId);
  const hasBirthday = !!profileData?.birthday;
  const showBirthdayCta = isOwner && !hasBirthday;

  // Birthday nudge: show inline card instead of the action button on first load.
  // Falls back to button once dismissed (stored in localStorage for 30 days).
  const [nudgeDismissed, setNudgeDismissed] = useState(() =>
    contextProfile ? isBirthdayNudgeDismissed(contextProfile) : true
  );
  const showNudge = showBirthdayCta && !nudgeDismissed;

  const actions: Array<{ key: string; label: string; onClick: () => void; primary?: boolean }> = [];

  if (showBirthdayCta && nudgeDismissed) {
    // Nudge was dismissed — surface the birthday CTA as a regular button fallback
    actions.push({
      key: "birthday",
      label: t.gridAddBirthdayCta,
      onClick: () => {
        setEditorEntry("dates", "main");
        setView("editor");
      },
    });
  }

  if (isOwner) {
    actions.push({
      key: "create",
      label: t.gridCreateDropReminderCta,
      primary: true,
      onClick: () => {
        setEditorEntry("dates", "quickCreate");
        setView("editor");
      },
    });
  }

  actions.push({
    key: "drops",
    label: t.gridViewActiveBalloonsCta,
    onClick: () => setView("drops"),
  });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 gap-4 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="min-w-0 flex flex-col gap-0">
            <div className="flex items-center gap-2">
              {contextProfile ? (
                <Avatar
                  address={contextProfile}
                  size={34}
                  chainId={chainId}
                  imageUrl={lsp3?.imageUrl}
                  name={lsp3?.name}
                  className="ring-1 ring-[#E8D9C8] shrink-0"
                />
              ) : null}
              <BalloonLogo className="max-w-[150px] sm:max-w-none" displayHeight={52} />
            </div>

          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <NetworkBadge chainId={chainId} />
          <button
            type="button"
            onClick={() => {
              setEditorEntry("settings", "main");
              setView("editor");
            }}
            aria-label={t.tabSettings}
            title={t.tabSettings}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-lukso-border bg-white/5 hover:bg-lukso-purple/10 hover:border-lukso-purple/30 transition-colors flex items-center justify-center p-0 overflow-hidden"
          >
            <img
              src="/settings-gear.png"
              alt={t.tabSettings}
              className="w-full h-full object-contain scale-[1.35]"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/settings-gear-metallic.svg";
              }}
            />
          </button>
          <LanguageToggle />
        </div>
      </div>

      <div className="flex-1 min-h-[200px] sm:min-h-[220px] flex flex-col items-center justify-center text-center gap-2 sm:gap-4 card px-3 sm:px-4 py-3 sm:py-5 overflow-hidden">
        <BalloonIcon size={70} className="animate-float-mobile sm:hidden" />
        <BalloonIcon size={112} className="animate-float hidden sm:block" />
        <p className="title-home text-[13px] leading-[1.08] sm:text-base">
          <span className="block whitespace-nowrap">{t.gridHeroLine1}</span>
          <span className="block whitespace-nowrap">{t.gridHeroLine2}</span>
        </p>
        <div className="grid grid-cols-2 gap-2 w-full max-w-md pt-1 px-1 sm:px-0">
          {actions.slice(0, 3).map((action, index) => (
            <button
              key={action.key}
              onClick={action.onClick}
              className={`text-xs sm:text-sm py-2.5 sm:py-3 px-2.5 sm:px-3 leading-tight w-full ${action.primary ? "btn-primary" : "btn-secondary"} ${actions.length === 3 && index === 0 ? "col-span-2" : ""}`}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Birthday nudge — inline, non-blocking, first-time only */}
      {showNudge && contextProfile && (
        <BirthdayNudgeCard
          profileAddress={contextProfile}
          walletClient={walletClient}
          chainId={chainId}
          onDismiss={() => setNudgeDismissed(true)}
        />
      )}

      {/* Debug overlay — dev only, never renders in prod */}
      {import.meta.env.DEV && import.meta.env.VITE_DEBUG_GRID === "1" && (
        <div className="text-[10px] text-white/20 font-mono break-all border border-white/10 rounded p-2 space-y-0.5">
          <div>context: {contextProfile ?? "null"}</div>
          <div>isOwner: {String(isOwner)}</div>
        </div>
      )}
    </div>
  );
}
