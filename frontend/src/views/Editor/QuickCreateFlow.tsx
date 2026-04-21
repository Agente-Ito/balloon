import { useEffect, useMemo, useState } from "react";
import { CelebrationType, type Celebration } from "@/types";
import { useT } from "@/hooks/useT";
import { getMonthNames } from "@/lib/monthNames";

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
  const now = new Date();
  const monthNames = useMemo(() => getMonthNames(t), [t]);

  const parseDateParts = (value?: string) => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [yy, mm, dd] = value.split("-").map(Number);
      return { year: yy, month: mm, day: dd };
    }
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
    };
  };

  const initialParts = parseDateParts(initialEvent?.date);
  const [year, setYear] = useState(initialParts.year);
  const [month, setMonth] = useState(initialParts.month);
  const [day, setDay] = useState(initialParts.day);
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
    const parts = parseDateParts(initialEvent.date);
    setYear(parts.year);
    setMonth(parts.month);
    setDay(parts.day);
    setTitle(initialEvent.title);
    setDescription(initialEvent.description ?? "");
  }, [initialEvent]);

  const maxDayForMonth = new Date(year, month, 0).getDate();
  useEffect(() => {
    if (day > maxDayForMonth) setDay(maxDayForMonth);
  }, [day, maxDayForMonth]);

  useEffect(() => {
    onModeChange?.(createDrop);
  }, [createDrop, onModeChange]);

  const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
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

      <div className="min-w-0">
        <label className="block text-xs text-[#7b6950] mb-1">{t.quickCreateDate}</label>
        <div className="grid grid-cols-3 gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="input text-sm"
          >
            {monthNames.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={day}
            onChange={(e) => setDay(Number(e.target.value))}
            className="input text-sm"
          >
            {Array.from({ length: maxDayForMonth }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value) || now.getFullYear())}
            min={1900}
            max={2100}
            className="input text-sm"
          />
        </div>
      </div>

      <div className="min-w-0">
        <label className="block text-xs text-[#7b6950] mb-1">{t.quickCreateName}</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={personalizedNamePlaceholder}
          className="input text-sm max-w-full"
          maxLength={72}
        />
      </div>

      <div className="min-w-0">
        <label className="block text-xs text-[#7b6950] mb-1">{t.quickCreateDesc}</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={personalizedDescPlaceholder}
          className="input text-sm min-h-[74px] max-w-full"
          maxLength={180}
        />
      </div>

      <label className="flex items-start gap-3 rounded-xl border border-lukso-border px-3 py-2">
        <input
          type="checkbox"
          checked={recurring}
          onChange={(e) => setRecurring(e.target.checked)}
          className="mt-0.5 h-4 w-4 flex-shrink-0 accent-[#c99a2e]"
        />
        <span className="min-w-0">
          <span className="block text-sm font-medium">{t.quickCreateRecurring}</span>
          <span className="block text-xs text-[#7b6950] break-words">{t.quickCreateRecurringSub}</span>
        </span>
      </label>

      <label className="flex items-start gap-3 rounded-xl border border-lukso-border px-3 py-2">
        <input
          type="checkbox"
          checked={createDrop}
          onChange={(e) => setCreateDrop(e.target.checked)}
          className="mt-0.5 h-4 w-4 flex-shrink-0 accent-[#c99a2e]"
        />
        <span className="min-w-0">
          <span className="block text-sm font-medium">{t.quickCreateToggle}</span>
          <span className="block text-xs text-[#7b6950] break-words">{t.quickCreateToggleSub}</span>
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
