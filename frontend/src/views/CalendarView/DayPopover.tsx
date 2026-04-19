import { format, parseISO } from "date-fns";
import { CELEBRATION_EMOJIS, getCelebrationTypeKey } from "@/constants/celebrationTypes";
import { Avatar } from "@/components/Avatar";
import { useAppStore } from "@/store/useAppStore";
import { useLSP3Name } from "@/hooks/useLSP3Name";
import { useT } from "@/hooks/useT";
import type { CelebrationDay } from "@/types";
import type { Address } from "@/types";

interface DayPopoverProps {
  day: CelebrationDay;
  onClose: () => void;
  chainId: number;
  /** Whether the viewer owns this profile (can create drops). */
  isOwner?: boolean;
}

function ProfileNameInline({ address, chainId }: { address: Address; chainId: number }) {
  const { data: name } = useLSP3Name(address, chainId);
  return <>{name ?? `${address.slice(0, 8)}…`}</>;
}

export function DayPopover({ day, onClose, isOwner, chainId }: DayPopoverProps) {
  const { setView, setActiveCelebrationDate, setPendingDropDate, connectedAccount } = useAppStore();
  const t = useT();

  const handleCelebrate = (date: string) => {
    setActiveCelebrationDate(date);
    setView("celebration");
    onClose();
  };

  const handleCreateDrop = () => {
    setPendingDropDate(day.date);
    setView("editor");
    onClose();
  };

  const hasCelebrations = day.celebrations.length > 0;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-lukso-card border-t border-lukso-border rounded-t-3xl p-5 animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">
            {format(parseISO(day.date), "MMMM d, yyyy")}
          </h3>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white text-xl leading-none"
          >
            {t.close}
          </button>
        </div>

        {/* Celebrations list */}
        {hasCelebrations ? (
          <div className="space-y-2 max-h-56 overflow-y-auto mb-4">
            {day.celebrations.map((celebration) => (
              <div key={celebration.id} className="card flex items-center gap-3">
                <span className="text-2xl">{CELEBRATION_EMOJIS[celebration.type]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{celebration.title}</p>
                  <p className="text-xs text-white/40">{t[getCelebrationTypeKey(celebration.type) as keyof typeof t]}</p>
                  {celebration.profileAddress && (
                    <div className="flex items-center gap-1 mt-1">
                      <Avatar address={celebration.profileAddress} size={14} />
                      <span className="text-xs text-white/30">
                        <ProfileNameInline
                          address={celebration.profileAddress as Address}
                          chainId={chainId}
                        />
                      </span>
                    </div>
                  )}
                </div>

                {/* CTA: view celebration */}
                {(celebration.profileAddress !== connectedAccount || !celebration.profileAddress) && (
                  <button
                    onClick={() => handleCelebrate(day.date)}
                    className="btn-primary text-xs px-3 py-1.5 flex-shrink-0"
                  >
                    {t.calendarCelebrate}
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-white/30 mb-4 text-center py-4">
            {t.calendarNone}
          </p>
        )}

        {/* Create drop CTA — only shown to the profile owner */}
        {isOwner && (
          <div className={`border-t border-lukso-border pt-4 ${hasCelebrations ? "" : ""}`}>
            <button
              onClick={handleCreateDrop}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <span>🎈</span>
              <span>{t.calendarCreateDrop}</span>
            </button>
            <p className="text-[11px] text-white/30 text-center mt-2 hidden [@media(min-height:560px)]:block">
              {t.calendarDropHint} {format(parseISO(day.date), "MMMM d")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
