import { useEffect, useMemo, useState } from "react";
import { CelebrationType, type Celebration } from "@/types";
import { useT } from "@/hooks/useT";
import { getMonthNames } from "@/lib/monthNames";
import { HOLIDAY_DROP_TEMPLATES } from "@/constants/dropTemplates";
import { useAppStore } from "@/store/useAppStore";

type CreateMode = "reminder" | "celebration";

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
  const lang = useAppStore((state) => state.lang);
  const isEditing = Boolean(initialEvent);
  const now = new Date();
  const monthNames = useMemo(() => getMonthNames(t), [t]);
  const templates = useMemo(
    () => HOLIDAY_DROP_TEMPLATES.filter((template) => template.id !== "anniversary"),
    []
  );

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
  const [mode, setMode] = useState<CreateMode>("reminder");
  const [year, setYear] = useState(initialParts.year);
  const [month, setMonth] = useState(initialParts.month);
  const [day, setDay] = useState(initialParts.day);
  const [title, setTitle] = useState(initialEvent?.title ?? "");
  const [description, setDescription] = useState(initialEvent?.description ?? "");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("celebration");
  const [lastSuggestedTitle, setLastSuggestedTitle] = useState("");
  const [recurring, setRecurring] = useState(true);
  const [notifyDaysBefore, setNotifyDaysBefore] = useState<number>(1);
  const [showTemplates, setShowTemplates] = useState(!initialEvent);

  const personalizedNamePlaceholder = profileName
    ? t.quickCreateNamePlaceholderWithName.replace("{name}", profileName)
    : t.quickCreateNamePlaceholder;
  const personalizedDescPlaceholder = profileName
    ? t.quickCreateDescPlaceholderWithName.replace("{name}", profileName)
    : t.quickCreateDescPlaceholder;

  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId) ?? templates[0];

  const suggestedTitle = useMemo(() => {
    if (!selectedTemplate) return personalizedNamePlaceholder;
    if (selectedTemplate.id === "birthday" && profileName) {
      return t.quickCreateNamePlaceholderWithName.replace("{name}", profileName);
    }
    return lang === "es" ? selectedTemplate.nameEs : selectedTemplate.name;
  }, [lang, personalizedNamePlaceholder, profileName, selectedTemplate, t]);

  useEffect(() => {
    if (!initialEvent) return;
    const parts = parseDateParts(initialEvent.date);
    setYear(parts.year);
    setMonth(parts.month);
    setDay(parts.day);
    setTitle(initialEvent.title);
    setDescription(initialEvent.description ?? "");
  }, [initialEvent]);

  useEffect(() => {
    if (initialEvent) return;
    const nextSuggestion = suggestedTitle;
    if (title === lastSuggestedTitle) {
      setTitle(nextSuggestion);
    }
    setLastSuggestedTitle(nextSuggestion);
  }, [suggestedTitle]); // eslint-disable-line react-hooks/exhaustive-deps

  const maxDayForMonth = new Date(year, month, 0).getDate();
  useEffect(() => {
    if (day > maxDayForMonth) setDay(maxDayForMonth);
  }, [day, maxDayForMonth]);

  useEffect(() => {
    onModeChange?.(mode === "celebration");
  }, [mode, onModeChange]);

  const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const resolvedTitle = title.trim() || suggestedTitle || personalizedNamePlaceholder;
  const canSubmit = resolvedTitle.trim().length > 1 && !!date;

  const handleSubmit = async (createDrop: boolean) => {
    if (!canSubmit) return;

    const event: Celebration = {
      id: initialEvent?.id ?? (typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}`),
      type: CelebrationType.CustomEvent,
      title: resolvedTitle.trim(),
      date,
      recurring: initialEvent?.recurring ?? recurring,
      description: description.trim() || undefined,
      notifyDaysBefore: createDrop ? undefined : notifyDaysBefore,
    };

    await onSubmit({ event, createDrop });
  };

  const notifyOptions = [
    { value: 0, label: t.quickCreateNotifyDay },
    { value: 1, label: t.quickCreateNotify1Day },
    { value: 3, label: t.quickCreateNotify3Days },
    { value: 7, label: t.quickCreateNotify1Week },
  ];

  // ── Shared: template + date + title ──────────────────────────────────────

  const sharedContent = (
    <>
      {isEditing && (
        <button
          type="button"
          onClick={() => setShowTemplates((v) => !v)}
          className="w-full rounded-xl border border-lukso-border px-3 py-2 text-left text-sm text-[#6f5c3f]"
        >
          {showTemplates ? t.quickCreateHideTemplates : t.quickCreateShowTemplates}
        </button>
      )}

      {showTemplates && (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 snap-x snap-mandatory">
          {templates.map((template) => {
            const active = template.id === selectedTemplateId;
            const label = lang === "es" ? template.nameEs : template.name;
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => setSelectedTemplateId(template.id)}
                className={`snap-start min-w-[80px] sm:min-w-[96px] rounded-xl sm:rounded-2xl border overflow-hidden transition-all flex flex-col items-center ${
                  active
                    ? "border-lukso-purple shadow-[0_10px_30px_rgba(106,27,154,0.12)]"
                    : "border-lukso-border"
                }`}
              >
                <div
                  className="w-full aspect-square relative"
                  style={active ? { outline: "2px solid #6A1B9A", outlineOffset: "-2px" } : undefined}
                >
                  <img
                    src={`/templates/${template.id}-balloon.png`}
                    alt={label}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      (e.currentTarget.nextElementSibling as HTMLElement | null)?.classList.remove("hidden");
                    }}
                  />
                  <span
                    className="hidden absolute inset-0 flex items-center justify-center text-3xl"
                    style={{ background: `linear-gradient(135deg, ${template.gradient[0]}, ${template.gradient[1]})` }}
                  >
                    {template.emoji}
                  </span>
                </div>
                <span
                  className={`block text-[10px] sm:text-xs font-medium leading-tight py-1.5 px-1 text-center ${
                    active ? "text-lukso-purple" : "text-[#3b2d1f]"
                  }`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="rounded-2xl border border-lukso-border bg-[#fffaf1] p-2.5 sm:p-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="input text-sm">
            {monthNames.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
          <select value={day} onChange={(e) => setDay(Number(e.target.value))} className="input text-sm">
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
            className="input text-sm col-span-2 sm:col-span-1"
          />
        </div>
      </div>

      <div className="min-w-0">
        <label className="block text-xs text-[#7b6950] mb-1">{t.quickCreateNameOptional}</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={suggestedTitle}
          className="input text-sm max-w-full"
          maxLength={72}
        />
      </div>
    </>
  );

  return (
    <div className="card space-y-3 sm:space-y-4">

      {/* ── Tab switcher ── */}
      {!isEditing && (
        <div className="flex gap-1 p-1 rounded-2xl bg-[#f5ede0] border border-lukso-border">
          <button
            type="button"
            onClick={() => setMode("reminder")}
            className="flex-1 rounded-xl py-2 text-sm font-semibold transition-all"
            style={
              mode === "reminder"
                ? { background: "#fff", color: "#6A1B9A", boxShadow: "0 1px 4px rgba(106,27,154,0.12)" }
                : { color: "#8B7D7D" }
            }
          >
            {t.quickCreateTabReminder}
          </button>
          <button
            type="button"
            onClick={() => setMode("celebration")}
            className="flex-1 rounded-xl py-2 text-sm font-semibold transition-all"
            style={
              mode === "celebration"
                ? { background: "#fff", color: "#6A1B9A", boxShadow: "0 1px 4px rgba(106,27,154,0.12)" }
                : { color: "#8B7D7D" }
            }
          >
            {t.quickCreateTabCelebration}
          </button>
        </div>
      )}

      {isEditing && (
        <div className="space-y-1">
          <p className="title-premium text-sm text-lukso-purple">{t.quickCreateEditTitle}</p>
          <p className="text-xs text-[#7b6950]">{t.quickCreateEditSub}</p>
        </div>
      )}

      {/* ── Reminder tab ── */}
      {(mode === "reminder" || isEditing) && (
        <>
          {sharedContent}

          {/* Notify timing */}
          {!isEditing && (
            <div>
              <label className="block text-xs text-[#7b6950] mb-1.5">{t.quickCreateNotifyWhen}</label>
              <div className="grid grid-cols-2 gap-2">
                {notifyOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setNotifyDaysBefore(opt.value)}
                    className="rounded-2xl border px-3 py-2 text-sm text-left transition-colors"
                    style={
                      notifyDaysBefore === opt.value
                        ? { borderColor: "#6A1B9A", background: "rgba(106,27,154,0.08)", color: "#4d206f" }
                        : { borderColor: "#E8D9C8", background: "rgba(255,255,255,0.6)", color: "#6f5c3f" }
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-[#9b8a6a] mt-1.5">{t.quickCreateNotifyHint}</p>
            </div>
          )}

          {/* Recurring + description (more options) */}
          <div className="space-y-3 rounded-2xl border border-lukso-border bg-white/60 p-3">
            <div className="min-w-0">
              <label className="block text-xs text-[#7b6950] mb-1">{t.quickCreateDesc}</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={personalizedDescPlaceholder}
                className="input text-sm min-h-[60px] max-w-full"
                maxLength={180}
              />
            </div>
            <label className="flex items-start gap-3 rounded-xl border border-lukso-border px-3 py-2 cursor-pointer">
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
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="btn-ghost w-full text-sm py-2 border border-lukso-border"
            >
              {t.cancel}
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={!canSubmit || isSaving}
              className="btn-primary w-full text-sm py-2"
            >
              {isSaving
                ? t.quickCreateSaving
                : isEditing
                  ? t.quickCreateUpdateBtn
                  : t.quickCreateReminderBtn}
            </button>
          </div>
        </>
      )}

      {/* ── Celebration tab ── */}
      {mode === "celebration" && !isEditing && (
        <>
          {sharedContent}

          <div className="rounded-2xl border border-lukso-border bg-white/60 px-4 py-3">
            <p className="text-xs text-[#7b6950] leading-relaxed">{t.quickCreateCelebrationDesc}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="btn-ghost w-full text-sm py-2 border border-lukso-border"
            >
              {t.cancel}
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={!canSubmit || isSaving}
              className="btn-primary w-full text-sm py-2"
            >
              {isSaving ? t.quickCreateSaving : t.quickCreateCelebrationCta}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
