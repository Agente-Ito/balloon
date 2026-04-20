import { useEffect, useState } from "react";
import { CelebrationType, type Celebration } from "@/types";
import { useT } from "@/hooks/useT";

interface QuickCreateFlowProps {
  initialEvent?: Celebration;
  profileName?: string;
  onModeChange?: (createDrop: boolean) => void;
  isSaving: boolean;
  onCancel: () => void;
  onSubmit: (payload: { event: Celebration; createDrop: boolean }) => Promise<void>;
}

export function QuickCreateFlow({ initialEvent, profileName, onModeChange, isSaving, onCancel, onSubmit }: QuickCreateFlowProps) {
  const t = useT();
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(initialEvent?.date ?? today);
  const [title, setTitle] = useState(initialEvent?.title ?? "");
  const [description, setDescription] = useState(initialEvent?.description ?? "");
  const [createDrop, setCreateDrop] = useState(false);
  const [recurring, setRecurring] = useState(true);
  const personalizedNamePlaceholder = profileName
    ? t.quickCreateNamePlaceholderWithName.replace("{name}", profileName)
    : t.quickCreateNamePlaceholder;
  const personalizedDescPlaceholder = profileName
    ? t.quickCreateDescPlaceholderWithName.replace("{name}", profileName)
    : t.quickCreateDescPlaceholder;

  useEffect(() => {
    if (!initialEvent) return;
    setDate(initialEvent.date);
    setTitle(initialEvent.title);
    setDescription(initialEvent.description ?? "");
  }, [initialEvent]);

  useEffect(() => {
    onModeChange?.(createDrop);
  }, [createDrop, onModeChange]);

  const canSubmit = title.trim().length > 1 && !!date;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    const event: Celebration = {
      id: initialEvent?.id ?? (typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}`),
      type: CelebrationType.CustomEvent,
      title: title.trim(),
      date,
      recurring: initialEvent?.recurring ?? recurring,
      description: description.trim() || undefined,
    };

    await onSubmit({ event, createDrop });
  };

  return (
    <div className="card space-y-3">
      <p className="title-premium text-sm text-lukso-purple">
        {createDrop ? t.quickCreateHeaderCelebration : t.quickCreateHeaderReminder}
      </p>

      <div>
        <label className="block text-xs text-white/50 mb-1">{t.quickCreateDate}</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="input text-sm"
        />
      </div>

      <div>
        <label className="block text-xs text-white/50 mb-1">{t.quickCreateName}</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={personalizedNamePlaceholder}
          className="input text-sm"
          maxLength={72}
        />
      </div>

      <div>
        <label className="block text-xs text-white/50 mb-1">{t.quickCreateDesc}</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={personalizedDescPlaceholder}
          className="input text-sm min-h-[74px]"
          maxLength={180}
        />
      </div>

      <label className="flex items-start gap-3 rounded-xl border border-lukso-border px-3 py-2">
        <input
          type="checkbox"
          checked={recurring}
          onChange={(e) => setRecurring(e.target.checked)}
          className="mt-0.5"
        />
        <span className="min-w-0">
          <span className="block text-sm font-medium">{t.quickCreateRecurring}</span>
          <span className="block text-xs text-white/45 break-words">{t.quickCreateRecurringSub}</span>
        </span>
      </label>

      <label className="flex items-start gap-3 rounded-xl border border-lukso-border px-3 py-2">
        <input
          type="checkbox"
          checked={createDrop}
          onChange={(e) => setCreateDrop(e.target.checked)}
          className="mt-0.5"
        />
        <span className="min-w-0">
          <span className="block text-sm font-medium">{t.quickCreateToggle}</span>
          <span className="block text-xs text-white/45 break-words">{t.quickCreateToggleSub}</span>
        </span>
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="btn-ghost text-xs sm:text-sm py-2 border border-lukso-border"
        >
          {t.cancel}
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || isSaving}
          className="btn-primary text-xs sm:text-sm py-2"
        >
          {isSaving
            ? t.quickCreateSaving
            : createDrop
              ? t.quickCreateDropBtn
              : initialEvent
                ? t.quickCreateUpdateBtn
                : t.quickCreateReminderBtn}
        </button>
      </div>
    </div>
  );
}
