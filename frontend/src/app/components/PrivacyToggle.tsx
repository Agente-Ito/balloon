/**
 * PrivacyToggle — a labelled on/off toggle for profile privacy settings.
 * Wraps a native checkbox with accessible ARIA attributes and LUKSO-styled UI.
 */
interface PrivacyToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function PrivacyToggle({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: PrivacyToggleProps) {
  return (
    <label className="flex items-center justify-between gap-4 cursor-pointer select-none">
      <div className="flex-1">
        <span className="text-sm font-medium text-white/80">{label}</span>
        {description && <p className="text-xs text-white/40 mt-0.5">{description}</p>}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-lukso-purple
          ${checked ? "bg-lukso-purple" : "bg-white/10"}
          ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform
            ${checked ? "translate-x-5" : "translate-x-0"}`}
        />
      </button>
    </label>
  );
}
