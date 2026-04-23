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
  onSubmit: (payload: { event: Celebration; createDrop: boolean; templateId?: string }) => Promise<void>;
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
    return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
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
  const [notifyTime, setNotifyTime] = useState<string>("09:00");
  const [showTemplates, setShowTemplates] = useState(!initialEvent);
  const [showValidation, setShowValidation] = useState(false);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) ?? templates[0];

  const suggestedTitle = useMemo(() => {
    if (!selectedTemplate) return "";
    if (selectedTemplate.id === "birthday" && profileName) {
      return mode === "reminder"
        ? t.quickCreateReminderFor.replace("{name}", profileName)
        : t.quickCreateNamePlaceholderWithName.replace("{name}", profileName);
    }
    return lang === "es" ? selectedTemplate.nameEs : selectedTemplate.name;
  }, [lang, mode, profileName, selectedTemplate, t]);

  useEffect(() => {
    if (!initialEvent) return;
    const parts = parseDateParts(initialEvent.date);
    setYear(parts.year); setMonth(parts.month); setDay(parts.day);
    setTitle(initialEvent.title);
    setDescription(initialEvent.description ?? "");
  }, [initialEvent]);

  // Auto-fill title only when it still matches the previous suggestion (user hasn't typed)
  useEffect(() => {
    if (initialEvent) return;
    if (title === lastSuggestedTitle) setTitle(suggestedTitle);
    setLastSuggestedTitle(suggestedTitle);
  }, [suggestedTitle]); // eslint-disable-line react-hooks/exhaustive-deps

  const maxDayForMonth = new Date(year, month, 0).getDate();
  useEffect(() => {
    if (day > maxDayForMonth) setDay(maxDayForMonth);
  }, [day, maxDayForMonth]);

  useEffect(() => {
    onModeChange?.(mode === "celebration");
  }, [mode, onModeChange]);

  const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const resolvedTitle = title.trim() || suggestedTitle;
  const isDateToday = month === now.getMonth() + 1 && day === now.getDate() && year === now.getFullYear();

  const handleSubmit = async (createDrop: boolean) => {
    if (!resolvedTitle.trim()) { setShowValidation(true); return; }

    const event: Celebration = {
      id: initialEvent?.id ?? (typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID() : `${Date.now()}`),
      type: CelebrationType.CustomEvent,
      title: resolvedTitle.trim(),
      date,
      recurring: initialEvent?.recurring ?? recurring,
      description: description.trim() || undefined,
      notifyDaysBefore: createDrop ? undefined : notifyDaysBefore,
      notifyTime: createDrop ? undefined : notifyTime,
    };

    await onSubmit({ event, createDrop, templateId: createDrop ? selectedTemplateId : undefined });
  };

  const notifyOptions = [
    { value: 0, label: t.quickCreateNotifyDay },
    { value: 1, label: t.quickCreateNotify1Day },
    { value: 3, label: t.quickCreateNotify3Days },
    { value: 7, label: t.quickCreateNotify1Week },
  ];

  // ── Template picker (shared visual, label varies by tab) ──────────────────

  const templatePicker = (label: string) => (
    <div>
      {isEditing ? (
        <button
          type="button"
          onClick={() => setShowTemplates((v) => !v)}
          className="w-full rounded-xl border border-lukso-border px-3 py-2 text-left text-sm text-[#6f5c3f] mb-2"
        >
          {showTemplates ? t.quickCreateHideTemplates : t.quickCreateShowTemplates}
        </button>
      ) : (
        <p className="text-xs text-[#7b6950] mb-1.5">{label}</p>
      )}

      {showTemplates && (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 snap-x snap-mandatory">
          {templates.map((tpl) => {
            const active = tpl.id === selectedTemplateId;
            const tplLabel = lang === "es" ? tpl.nameEs : tpl.name;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => setSelectedTemplateId(tpl.id)}
                className={`snap-start min-w-[80px] sm:min-w-[96px] rounded-xl sm:rounded-2xl border overflow-hidden transition-all flex flex-col items-center ${
                  active ? "border-lukso-purple shadow-[0_10px_30px_rgba(106,27,154,0.12)]" : "border-lukso-border"
                }`}
              >
                <div
                  className="w-full aspect-square relative"
                  style={active ? { outline: "2px solid #6A1B9A", outlineOffset: "-2px" } : undefined}
                >
                  <img
                    src={`/templates/${tpl.id}-balloon.png`}
                    alt={tplLabel}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      (e.currentTarget.nextElementSibling as HTMLElement | null)?.classList.remove("hidden");
                    }}
                  />
                  <span
                    className="hidden absolute inset-0 flex items-center justify-center text-3xl"
                    style={{ background: `linear-gradient(135deg, ${tpl.gradient[0]}, ${tpl.gradient[1]})` }}
                  >
                    {tpl.emoji}
                  </span>
                </div>
                <span className={`block text-[10px] sm:text-xs font-medium leading-tight py-1.5 px-1 text-center ${active ? "text-lukso-purple" : "text-[#3b2d1f]"}`}>
                  {tplLabel}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  // ── Date picker (label and today-indicator vary by tab) ───────────────────

  const datePicker = (label: string) => (
    <div className="rounded-2xl border border-lukso-border bg-[#fffaf1] p-2.5 sm:p-3">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs text-[#7b6950]">{label}</p>
        {isDateToday && (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 border border-amber-500/20">
            {t.quickCreateEventToday}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="input text-sm">
          {monthNames.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
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
          min={1900} max={2100}
          className="input text-sm col-span-2 sm:col-span-1"
        />
      </div>
    </div>
  );

  // ── Title field (label varies by tab) ────────────────────────────────────

  const titleField = (label: string) => (
    <div className="min-w-0">
      <label className="block text-xs text-[#7b6950] mb-1">{label}</label>
      <input
        type="text"
        value={title}
        onChange={(e) => { setTitle(e.target.value); if (showValidation) setShowValidation(false); }}
        placeholder={suggestedTitle}
        className={`input text-sm max-w-full ${showValidation && !resolvedTitle.trim() ? "border-red-400" : ""}`}
        maxLength={72}
      />
      {showValidation && !resolvedTitle.trim() && (
        <p className="text-xs text-red-500 mt-1">{t.quickCreateTitleRequired}</p>
      )}
      {!title.trim() && !showValidation && suggestedTitle && (
        <p className="text-[11px] text-[#9b8a6a] mt-0.5">
          {t.quickCreateTitleWillSaveAs} <span className="italic">"{suggestedTitle}"</span>
        </p>
      )}
    </div>
  );

  // ── Action buttons ────────────────────────────────────────────────────────

  const actionButtons = (createDrop: boolean, primaryLabel: string) => (
    <div className="flex flex-col-reverse gap-2 pt-1 sm:grid sm:grid-cols-2">
      <button type="button" onClick={onCancel} className="btn-ghost w-full text-sm py-2 border border-lukso-border">
        {t.cancel}
      </button>
      <button
        type="button"
        onClick={() => handleSubmit(createDrop)}
        disabled={isSaving}
        className="btn-primary w-full text-sm py-2"
      >
        {isSaving ? t.quickCreateSaving : primaryLabel}
      </button>
    </div>
  );

  return (
    <div className="card space-y-3 sm:space-y-4">

      {/* ── Tab switcher ── */}
      {!isEditing && (
        <div className="flex gap-1 p-1 rounded-2xl bg-[#f5ede0] border border-lukso-border">
          {(["reminder", "celebration"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setMode(tab)}
              className="flex-1 rounded-xl py-2 text-sm font-semibold transition-all"
              style={
                mode === tab
                  ? { background: "#fff", color: "#6A1B9A", boxShadow: "0 1px 4px rgba(106,27,154,0.12)" }
                  : { color: "#8B7D7D" }
              }
            >
              {tab === "reminder" ? t.quickCreateTabReminder : t.quickCreateTabCelebration}
            </button>
          ))}
        </div>
      )}

      {isEditing && (
        <div className="space-y-1">
          <p className="title-premium text-sm text-lukso-purple">{t.quickCreateEditTitle}</p>
          <p className="text-xs text-[#7b6950]">{t.quickCreateEditSub}</p>
        </div>
      )}

      {/* ════════════════════════════════════════
          REMINDER TAB
          ════════════════════════════════════════ */}
      {(mode === "reminder" || isEditing) && (
        <>
          {/* 1. Type */}
          {templatePicker(t.quickCreateReminderCategoryLabel)}

          {/* 2. Event date */}
          {datePicker(isEditing ? t.quickCreateDateLabel : t.quickCreateReminderDateLabel)}

          {/* 3. Recurring — right after date, makes sense contextually */}
          {!isEditing && (
            <label className="flex items-start gap-3 rounded-xl border border-lukso-border bg-white/60 px-3 py-2 cursor-pointer">
              <input
                type="checkbox"
                checked={recurring}
                onChange={(e) => setRecurring(e.target.checked)}
                className="mt-0.5 h-4 w-4 flex-shrink-0 accent-[#c99a2e]"
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium">{t.quickCreateRecurring}</span>
                <span className="block text-xs text-[#7b6950] break-words">{t.quickCreateRecurringSubReminder}</span>
              </span>
            </label>
          )}

          {/* 4. Name */}
          {titleField(t.quickCreateReminderNameLabel)}

          {/* 5. When + at what time — only for new reminders */}
          {!isEditing && (
            <div className="rounded-2xl border border-lukso-border bg-white/60 p-3 space-y-3">
              {/* Row 1: how many days before */}
              <div>
                <p className="text-xs text-[#7b6950] mb-1.5">{t.quickCreateNotifyWhen}</p>
                <div className="grid grid-cols-2 gap-2">
                  {notifyOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setNotifyDaysBefore(opt.value)}
                      className="rounded-xl border px-3 py-2 text-sm text-left transition-colors"
                      style={
                        notifyDaysBefore === opt.value
                          ? { borderColor: "#6A1B9A", background: "rgba(106,27,154,0.08)", color: "#4d206f" }
                          : { borderColor: "#E8D9C8", background: "transparent", color: "#6f5c3f" }
                      }
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 2: time of day — 3 pill presets */}
              <div>
                <p className="text-xs text-[#7b6950] mb-1.5">{t.quickCreateNotifyAtTime}</p>
                <div className="flex gap-2">
                  {([
                    { value: "09:00", label: t.quickCreateNotifyMorning },
                    { value: "12:00", label: t.quickCreateNotifyNoon },
                    { value: "18:00", label: t.quickCreateNotifyEvening },
                  ] as const).map((slot) => (
                    <button
                      key={slot.value}
                      type="button"
                      onClick={() => setNotifyTime(slot.value)}
                      className="flex-1 rounded-xl border px-2 py-1.5 text-xs text-center transition-colors"
                      style={
                        notifyTime === slot.value
                          ? { borderColor: "#6A1B9A", background: "rgba(106,27,154,0.08)", color: "#4d206f" }
                          : { borderColor: "#E8D9C8", background: "transparent", color: "#6f5c3f" }
                      }
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[11px] text-[#9b8a6a]">{t.quickCreateNotifyHint}</p>
            </div>
          )}

          {/* 6. Notes — optional, always visible but small */}
          <div>
            <label className="block text-xs text-[#7b6950] mb-1">{t.quickCreateReminderNote}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={profileName
                ? t.quickCreateReminderNotePlaceholderWithName.replace("{name}", profileName)
                : t.quickCreateReminderNotePlaceholder}
              className="input text-sm min-h-[52px] max-w-full"
              maxLength={180}
            />
          </div>

          {/* Recurring in edit mode (shown here since date section is compact) */}
          {isEditing && (
            <label className="flex items-start gap-3 rounded-xl border border-lukso-border bg-white/60 px-3 py-2 cursor-pointer">
              <input
                type="checkbox"
                checked={recurring}
                onChange={(e) => setRecurring(e.target.checked)}
                className="mt-0.5 h-4 w-4 flex-shrink-0 accent-[#c99a2e]"
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium">{t.quickCreateRecurring}</span>
                <span className="block text-xs text-[#7b6950] break-words">{t.quickCreateRecurringSubReminder}</span>
              </span>
            </label>
          )}

          {actionButtons(false, isEditing ? t.quickCreateUpdateBtn : t.quickCreateReminderBtn)}
        </>
      )}

      {/* ════════════════════════════════════════
          CELEBRATION TAB
          ════════════════════════════════════════ */}
      {mode === "celebration" && !isEditing && (
        <>
          {/* 1. What to celebrate */}
          {templatePicker(t.quickCreateCelebrationCategoryLabel)}

          {/* 2. Date */}
          {datePicker(t.quickCreateCelebrationDateLabel)}

          {/* 3. Name of the drop */}
          {titleField(t.quickCreateNameOptional)}

          {/* 4. Context — what happens after */}
          <div className="rounded-2xl border border-lukso-purple/20 bg-lukso-purple/5 px-4 py-3">
            <p className="text-xs text-[#6A1B9A] leading-relaxed">{t.quickCreateCelebrationDesc}</p>
          </div>

          {actionButtons(true, t.quickCreateCelebrationCta)}
        </>
      )}
    </div>
  );
}
