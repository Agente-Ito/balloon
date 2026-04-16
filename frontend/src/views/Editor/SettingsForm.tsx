import { useAppStore } from "@/store/useAppStore";
import { useSetSettings } from "@/hooks/useUniversalProfile";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useT } from "@/hooks/useT";
import toast from "react-hot-toast";
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
}

function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
  return (
    <label className="flex items-center justify-between cursor-pointer py-3 border-b border-lukso-border last:border-0">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-white/40 mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        onClick={onChange}
        className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ml-4 ${
          checked ? "bg-lukso-purple" : "bg-white/10"
        }`}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-6" : "translate-x-0.5"
        }`} />
      </button>
    </label>
  );
}

export function SettingsForm({ settings, walletClient }: SettingsFormProps) {
  const { contextProfile } = useAppStore();
  const t = useT();
  const { mutateAsync: saveSettings, isPending } = useSetSettings({
    walletClient: walletClient!,
    upAddress: contextProfile as Address,
  });

  const update = async (patch: Partial<ProfileSettings>) => {
    try {
      await saveSettings({ ...settings, ...patch });
      toast.success(t.settingsSave);
    } catch {
      toast.error(t.toastFailedBirthday);
    }
  };

  return (
    <div className="card">
      <ToggleRow
        label={t.settingsAutoMint}
        description={t.settingsAutoMintSub}
        checked={settings.autoMintBadge}
        onChange={() => update({ autoMintBadge: !settings.autoMintBadge })}
      />
      <ToggleRow
        label={t.settingsBirthdayVis}
        description={t.settingsBirthdayVisSub}
        checked={settings.birthdayVisible}
        onChange={() => update({ birthdayVisible: !settings.birthdayVisible })}
      />
      <ToggleRow
        label={t.settingsEventsVis}
        description={t.settingsEventsVisSub}
        checked={settings.eventsVisible}
        onChange={() => update({ eventsVisible: !settings.eventsVisible })}
      />
      <ToggleRow
        label={t.settingsWishlistVis}
        description={t.settingsWishlistVisSub}
        checked={settings.wishlistVisible}
        onChange={() => update({ wishlistVisible: !settings.wishlistVisible })}
      />
      <ToggleRow
        label={t.settingsNotify}
        description={t.settingsNotifySub}
        checked={settings.notifyFollowers}
        onChange={() => update({ notifyFollowers: !settings.notifyFollowers })}
      />
      {isPending && (
        <div className="flex items-center justify-center py-2">
          <LoadingSpinner size="sm" />
        </div>
      )}
    </div>
  );
}
