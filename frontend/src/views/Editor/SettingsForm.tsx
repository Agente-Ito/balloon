import { useAppStore } from "@/store/useAppStore";
import { useSetSettings } from "@/hooks/useUniversalProfile";
import { useLocalReminders } from "@/hooks/useLocalReminders";
import { useReminderSync } from "@/hooks/useReminderSync";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useT } from "@/hooks/useT";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { es as esLocale } from "date-fns/locale";
import type { ProfileSettings, Address } from "@/types";
import type { WalletClient } from "viem";

interface SettingsFormProps {
  settings: ProfileSettings;
  walletClient: WalletClient | null;
}

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}

function ToggleRow({ label, description, checked, onChange, disabled = false }: ToggleRowProps) {
  return (
    <label className={`flex items-start justify-between py-3 border-b border-lukso-border last:border-0 gap-3 ${
      disabled ? "opacity-75" : "cursor-pointer"
    }`}>
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-white/40 mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        onClick={onChange}
        disabled={disabled}
        role="switch"
        aria-checked={checked}
        className={`w-14 h-8 sm:w-12 sm:h-7 rounded-full transition-all border inline-flex items-center px-1 sm:px-0.5 flex-shrink-0 mt-0.5 touch-manipulation ${
          checked
            ? "bg-lukso-purple border-lukso-purple/70 justify-end"
            : "bg-white/10 border-white/15 justify-start"
        }`}
      >
        <span className="w-6 h-6 sm:w-5 sm:h-5 rounded-full bg-white shadow-md" />
      </button>
    </label>
  );
}

export function SettingsForm({ settings, walletClient }: SettingsFormProps) {
  const { contextProfile, connectedAccount, lang } = useAppStore();
  const t = useT();
  const dateLocale = lang === "es" ? esLocale : undefined;
  const { mutateAsync: saveSettings, isPending } = useSetSettings({
    walletClient: walletClient!,
    upAddress: contextProfile as Address,
  });
  const {
    reminders: localReminders,
    allReminderRecords,
    replaceReminders,
  } = useLocalReminders(contextProfile as Address | null);
  const {
    backupReminders,
    restoreReminders,
    isBackingUp: isBackingUpReminders,
    isRestoring: isRestoringReminders,
    lastSyncMeta,
  } = useReminderSync({
    walletClient: walletClient ?? undefined,
    profileAddress: contextProfile as Address | null,
    connectedAccount,
  });

  const [draft, setDraft] = useState<ProfileSettings>(settings);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const hasChanges = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(settings),
    [draft, settings]
  );

  const updateDraft = (patch: Partial<ProfileSettings>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const saveDraft = async () => {
    if (!hasChanges) return;
    try {
      await saveSettings(draft);
      toast.success(t.settingsSave);
    } catch {
      toast.error(t.toastSettingsFailed);
    }
  };

  return (
    <div className="card">
      <ToggleRow
        label={t.settingsAutoMint}
        description={t.settingsAutoMintSub}
        checked={draft.autoMintBadge}
        onChange={() => updateDraft({ autoMintBadge: !draft.autoMintBadge })}
        disabled={isPending}
      />
      <ToggleRow
        label={t.settingsBirthdayVis}
        description={t.settingsBirthdayVisSub}
        checked={draft.birthdayVisible}
        onChange={() => updateDraft({ birthdayVisible: !draft.birthdayVisible })}
        disabled={isPending}
      />
      <ToggleRow
        label={t.settingsEventsVis}
        description={t.settingsEventsVisSub}
        checked={draft.eventsVisible}
        onChange={() => updateDraft({ eventsVisible: !draft.eventsVisible })}
        disabled={isPending}
      />
      <ToggleRow
        label={t.settingsWishlistVis}
        description={t.settingsWishlistVisSub}
        checked={draft.wishlistVisible}
        onChange={() => updateDraft({ wishlistVisible: !draft.wishlistVisible })}
        disabled={isPending}
      />
      <ToggleRow
        label={t.settingsNotify}
        description={t.settingsNotifySub}
        checked={draft.notifyFollowers}
        onChange={() => updateDraft({ notifyFollowers: !draft.notifyFollowers })}
        disabled={isPending}
      />

      <div className="py-3 border-b border-lukso-border last:border-0">
        <p className="text-sm font-medium">{t.settingsReminderFreq}</p>
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
          {([
            { key: "monthly", label: t.settingsReminderMonthly },
            { key: "weekly", label: t.settingsReminderWeekly },
            { key: "daily", label: t.settingsReminderDaily },
          ] as const).map((option) => {
            const selected = (draft.reminderFrequency ?? "monthly") === option.key;
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => updateDraft({ reminderFrequency: option.key })}
                disabled={isPending}
                className={`text-xs py-1.5 rounded-lg border transition-colors ${
                  selected
                    ? "bg-lukso-purple/20 border-lukso-purple/50 text-lukso-purple"
                    : "bg-white/5 border-white/10 text-white/60 hover:text-white/80"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="py-3 border-b border-lukso-border last:border-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="title-premium text-sm mb-1">{t.reminderSyncTitle}</p>
            <p className="text-xs text-white/45">{t.reminderSyncSub}</p>
            {lastSyncMeta?.lastSyncedAt ? (
              <p className="text-[11px] text-white/35 mt-1">
                {t.reminderSyncLastSaved} {format(new Date(lastSyncMeta.lastSyncedAt * 1000), "PPP p", { locale: dateLocale })}
              </p>
            ) : (
              <p className="text-[11px] text-white/35 mt-1">{t.reminderSyncNoBackup}</p>
            )}
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-white/60">
            {localReminders.length} {t.reminderSyncLocalCount}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
          <button
            type="button"
            onClick={async () => {
              try {
                await backupReminders(allReminderRecords);
                toast.success(t.toastReminderBackupSaved);
              } catch (err) {
                const msg = err instanceof Error ? err.message : t.toastReminderBackupFailed;
                toast.error(msg.slice(0, 120) || t.toastReminderBackupFailed);
              }
            }}
            disabled={isBackingUpReminders || isRestoringReminders || !connectedAccount}
            className="btn-primary text-xs py-2"
          >
            {isBackingUpReminders ? t.saving : t.reminderSyncBackupBtn}
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                const payload = await restoreReminders(allReminderRecords);
                const activeReminders = payload.reminders.filter((reminder) => !reminder.deletedAt);
                if (!activeReminders.length) {
                  toast.error(t.toastReminderRestoreEmpty);
                  return;
                }
                if (localReminders.length > 0 && !window.confirm(t.reminderSyncRestoreConfirm)) {
                  return;
                }
                replaceReminders(payload.reminders);
                toast.success(t.toastReminderRestoreSuccess);
              } catch (err) {
                const msg = err instanceof Error ? err.message : t.toastReminderRestoreFailed;
                toast.error(msg.slice(0, 120) || t.toastReminderRestoreFailed);
              }
            }}
            disabled={isBackingUpReminders || isRestoringReminders || !connectedAccount}
            className="btn-secondary text-xs py-2"
          >
            {isRestoringReminders ? t.loading : t.reminderSyncRestoreBtn}
          </button>
        </div>
        <p className="text-[11px] text-white/35 mt-2">{t.reminderSyncHint}</p>
      </div>

      <div className="pt-3 space-y-2">
        <p className="text-[11px] text-white/45">{t.settingsBatchHint}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setDraft(settings)}
            disabled={!hasChanges || isPending}
            className="btn-ghost flex-1 text-xs py-1.5 border border-lukso-border disabled:opacity-40"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={saveDraft}
            disabled={!hasChanges || isPending}
            className="btn-primary flex-1 text-xs py-1.5 disabled:opacity-40"
          >
            {hasChanges ? t.save : t.settingsNoChanges}
          </button>
        </div>
      </div>

      {isPending && (
        <div className="flex items-center justify-center py-2">
          <LoadingSpinner size="sm" />
        </div>
      )}
    </div>
  );
}
