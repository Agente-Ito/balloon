/**
 * BirthdayNudgeCard — inline prompt shown once on the home screen to
 * ask the connected owner for their birthday.
 *
 * Two-step flow:
 *   Step 1 — pick month / day / year (optional)
 *   Step 2 — confirm the human-readable date before writing on-chain
 *
 * Logic:
 *  - Shows when isOwner && !hasBirthday && not dismissed
 *  - Dismiss (×): stores a timestamp in localStorage; hides for DISMISS_DAYS
 *  - Save: writes birthday on-chain via useSetBirthday; disappears permanently
 *    because hasBirthday becomes true in the parent
 *  - After DISMISS_DAYS the nudge reappears so the user gets another chance
 */
import { useState, useMemo } from "react";
import { useSetBirthday } from "@/hooks/useUniversalProfile";
import { useT } from "@/hooks/useT";
import { useAppStore } from "@/store/useAppStore";
import { getMonthNames } from "@/lib/monthNames";
import toast from "react-hot-toast";
import type { WalletClient } from "viem";
import type { Address } from "@/types";

const DISMISS_DAYS = 30;

function dismissKey(address: Address) {
  return `celebrations:birthday-nudge-dismissed:${address.toLowerCase()}`;
}

export function isBirthdayNudgeDismissed(address: Address): boolean {
  try {
    const raw = localStorage.getItem(dismissKey(address));
    if (!raw) return false;
    return Date.now() - parseInt(raw, 10) < DISMISS_DAYS * 86_400_000;
  } catch {
    return false;
  }
}

interface BirthdayNudgeCardProps {
  profileAddress: Address;
  walletClient?: WalletClient;
  chainId: number;
  onDismiss: () => void;
}

export function BirthdayNudgeCard({
  profileAddress,
  walletClient,
  chainId,
  onDismiss,
}: BirthdayNudgeCardProps) {
  const t = useT();
  const monthNames = useMemo(() => getMonthNames(t), [t]);
  const { setEditorEntry, setView } = useAppStore();

  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [year, setYear] = useState("");
  const [confirming, setConfirming] = useState(false);

  const { mutateAsync: saveBirthday, isPending } = useSetBirthday({
    walletClient: walletClient!,
    upAddress: profileAddress,
    chainId,
  });

  const maxDays = (() => {
    if (!month) return 31;
    const m = parseInt(month, 10);
    if ([4, 6, 9, 11].includes(m)) return 30;
    if (m === 2) return 29;
    return 31;
  })();

  const canProceed = !!month && !!day;

  // Human-readable label for the confirmation step
  const dateLabel = useMemo(() => {
    if (!month || !day) return "";
    const mName = monthNames[parseInt(month, 10) - 1];
    return year ? `${mName} ${day}, ${year}` : `${mName} ${day}`;
  }, [month, day, year, monthNames]);

  const handleProceed = () => setConfirming(true);

  const handleConfirm = async () => {
    if (!walletClient) {
      toast.error(t.toastNoWallet);
      return;
    }
    const mm = month.padStart(2, "0");
    const dd = day.padStart(2, "0");
    const value = year ? `${year}-${mm}-${dd}` : `--${mm}-${dd}`;
    try {
      await saveBirthday(value);
      toast.success(t.toastBirthdaySaved);
      // Parent hides us because hasBirthday → true after cache update
    } catch (err) {
      toast.error(err instanceof Error ? err.message.slice(0, 100) : t.toastFailedBirthday);
      setConfirming(false);
    }
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem(dismissKey(profileAddress), String(Date.now()));
    } catch { /* private mode — ignore */ }
    onDismiss();
  };

  const goToEditor = () => {
    setEditorEntry("dates", "main");
    setView("editor");
  };

  return (
    <div
      className="card px-4 py-4 flex flex-col gap-3 animate-slide-up"
      style={{ border: "1px solid rgba(106,27,154,0.18)" }}
    >
      {!confirming ? (
        /* ── Step 1: pick date ── */
        <>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-snug">{t.birthdayNudgeTitle}</p>
              <p className="text-xs mt-0.5" style={{ color: "#7b6950" }}>{t.birthdayNudgeSub}</p>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label={t.birthdayNudgeSkip}
              className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors -mr-1 -mt-1"
              style={{ color: "#9b8a6a" }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[#9b8a6a]">{t.birthdayNudgeMonthLabel}</label>
              <select
                value={month}
                onChange={(e) => { setMonth(e.target.value); setDay(""); }}
                className="input text-sm py-1.5"
              >
                <option value="" />
                {monthNames.map((m, i) => (
                  <option key={m} value={String(i + 1)}>{m}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[#9b8a6a]">{t.birthdayNudgeDayLabel}</label>
              <select
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="input text-sm py-1.5"
              >
                <option value="" />
                {Array.from({ length: maxDays }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={String(d)}>{d}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[#9b8a6a]">{t.birthdayNudgeYearHint}</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="—"
                min={1900}
                max={new Date().getFullYear()}
                className="input text-sm py-1.5"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleProceed}
              disabled={!canProceed}
              className="btn-primary text-xs flex-1 disabled:opacity-40"
            >
              {t.birthdayNudgeSave}
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="btn-ghost text-xs px-3"
            >
              {t.birthdayNudgeSkip}
            </button>
          </div>
        </>
      ) : (
        /* ── Step 2: confirm ── */
        <>
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold leading-snug">{t.birthdayNudgeConfirmTitle}</p>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              aria-label={t.birthdayNudgeEdit}
              className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors -mr-1 -mt-1"
              style={{ color: "#9b8a6a" }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Big date display */}
          <div
            className="rounded-2xl px-4 py-3 text-center"
            style={{ background: "rgba(106,27,154,0.07)", border: "1px solid rgba(106,27,154,0.14)" }}
          >
            <p className="text-base font-semibold" style={{ color: "#4d206f" }}>{dateLabel}</p>
            {!year && (
              <p className="text-[10px] mt-1" style={{ color: "#9b8a6a" }}>{t.birthdayNudgeYearHint}</p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isPending}
              className="btn-primary text-xs flex-1 disabled:opacity-40"
            >
              {isPending ? "…" : t.birthdayNudgeConfirm}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="btn-ghost text-xs px-3"
            >
              {t.birthdayNudgeEdit}
            </button>
          </div>

          {/* Settings hint */}
          <p className="text-[10px] text-center leading-relaxed" style={{ color: "#9b8a6a" }}>
            {t.birthdayNudgeEditHint}{" "}
            <button
              type="button"
              onClick={goToEditor}
              className="underline underline-offset-2 hover:text-lukso-purple transition-colors"
            >
              {t.birthdayNudgeEditHintLink}
            </button>
            .
          </p>
        </>
      )}
    </div>
  );
}
