import { useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useT } from "@/hooks/useT";
import { getMonthNames } from "@/lib/monthNames";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { CelebrationType } from "@/types";
import type { Celebration } from "@/types";
import type { ProfileSettings } from "@/types";

interface QuickSetupPayload {
  birthday: string;
  event: Celebration;
  settings?: ProfileSettings;
}

interface QuickSetupFormProps {
  isSaving: boolean;
  onSave: (payload: QuickSetupPayload) => void;
  onCancel: () => void;
}

export function QuickSetupForm({ isSaving, onSave, onCancel }: QuickSetupFormProps) {
  const t = useT();
  const monthNames = useMemo(() => getMonthNames(t), [t]);

  const [birthdayMonth, setBirthdayMonth] = useState("");
  const [birthdayDay, setBirthdayDay] = useState("");
  const [birthdayYear, setBirthdayYear] = useState("");

  const [eventTitle, setEventTitle] = useState("");
  const [eventMonth, setEventMonth] = useState("");
  const [eventDay, setEventDay] = useState("");
  const [eventYear, setEventYear] = useState("");
  const [eventRecurring, setEventRecurring] = useState(true);
  const [includeSettings, setIncludeSettings] = useState(false);
  const [notifyFollowers, setNotifyFollowers] = useState(true);
  const [reminderFrequency, setReminderFrequency] = useState<"monthly" | "weekly" | "daily">("monthly");

  const isValid =
    birthdayMonth !== "" &&
    birthdayDay !== "" &&
    eventTitle.trim() !== "" &&
    eventMonth !== "" &&
    eventDay !== "" &&
    (eventRecurring || eventYear !== "");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    const bMm = birthdayMonth.padStart(2, "0");
    const bDd = birthdayDay.padStart(2, "0");
    const birthday = birthdayYear ? `${birthdayYear}-${bMm}-${bDd}` : `--${bMm}-${bDd}`;

    const eMm = eventMonth.padStart(2, "0");
    const eDd = eventDay.padStart(2, "0");
    const currentYear = String(new Date().getFullYear());
    const eYy = eventRecurring ? (eventYear || currentYear) : eventYear;

    onSave({
      birthday,
      event: {
        id: uuidv4(),
        type: CelebrationType.CustomEvent,
        title: eventTitle.trim(),
        date: `${eYy}-${eMm}-${eDd}`,
        recurring: eventRecurring,
      },
      settings: includeSettings
        ? {
            autoMintBadge: true,
            birthdayVisible: true,
            eventsVisible: true,
            wishlistVisible: true,
            notifyFollowers,
            reminderFrequency,
          }
        : undefined,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="card bg-lukso-purple/10 border-lukso-purple/30">
        <p className="title-premium text-sm text-lukso-purple mb-1">{t.quickSetupTitle}</p>
        <p className="text-xs text-lukso-purple/70">{t.quickSetupSub}</p>
      </div>

      <div>
        <label className="block text-xs text-white/50 mb-1">{t.birthday}</label>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[10px] text-white/40 mb-1">{t.birthdayMonth}</label>
            <select
              value={birthdayMonth}
              onChange={(e) => setBirthdayMonth(e.target.value)}
              className="input text-sm py-1.5"
            >
              <option value="">-</option>
              {monthNames.map((m, i) => (
                <option key={m} value={String(i + 1)}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-white/40 mb-1">{t.birthdayDay}</label>
            <select
              value={birthdayDay}
              onChange={(e) => setBirthdayDay(e.target.value)}
              className="input text-sm py-1.5"
            >
              <option value="">-</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={String(d)}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-white/40 mb-1">
              {t.birthdayYear} <span className="text-white/25">{t.birthdayYearOpt}</span>
            </label>
            <input
              type="number"
              value={birthdayYear}
              onChange={(e) => setBirthdayYear(e.target.value)}
              min={1900}
              max={new Date().getFullYear()}
              className="input text-sm py-1.5"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs text-white/50 mb-1">{t.quickSetupReminderTitle}</label>
        <input
          type="text"
          value={eventTitle}
          onChange={(e) => setEventTitle(e.target.value)}
          placeholder={t.eventNamePlaceholder}
          maxLength={60}
          className="input mb-2"
        />
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[10px] text-white/40 mb-1">{t.eventMonth}</label>
            <select
              value={eventMonth}
              onChange={(e) => setEventMonth(e.target.value)}
              className="input text-sm py-1.5"
            >
              <option value="">-</option>
              {monthNames.map((m, i) => (
                <option key={m} value={String(i + 1)}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-white/40 mb-1">{t.eventDay}</label>
            <select
              value={eventDay}
              onChange={(e) => setEventDay(e.target.value)}
              className="input text-sm py-1.5"
            >
              <option value="">-</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={String(d)}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-white/40 mb-1">
              {t.eventYear} {eventRecurring ? <span className="text-white/25">{t.eventYearOpt}</span> : "*"}
            </label>
            <input
              type="number"
              value={eventYear}
              onChange={(e) => setEventYear(e.target.value)}
              min={1900}
              max={2100}
              className="input text-sm py-1.5"
              required={!eventRecurring}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">{t.eventRepeats}</p>
            <p className="text-xs text-white/40">{t.eventRepeatsSub}</p>
          </div>
          <button
            type="button"
            onClick={() => setEventRecurring((v) => !v)}
            className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${eventRecurring ? "bg-lukso-purple" : "bg-white/10"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${eventRecurring ? "translate-x-6" : "translate-x-0"}`} />
          </button>
        </div>
      </div>

      <div className="card border-lukso-border/80">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">{t.quickSetupIncludeSettings}</p>
            <p className="text-xs text-white/40">{t.quickSetupIncludeSettingsSub}</p>
          </div>
          <button
            type="button"
            onClick={() => setIncludeSettings((v) => !v)}
            className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${includeSettings ? "bg-lukso-purple" : "bg-white/10"}`}
            aria-checked={includeSettings}
            role="switch"
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${includeSettings ? "translate-x-6" : "translate-x-0"}`} />
          </button>
        </div>

        {includeSettings && (
          <div className="mt-3 space-y-3">
            <div>
              <p className="text-xs text-white/50 mb-1">{t.settingsNotify}</p>
              <button
                type="button"
                onClick={() => setNotifyFollowers((v) => !v)}
                className={`text-xs px-2 py-1 rounded-lg border ${
                  notifyFollowers
                    ? "bg-lukso-purple/20 border-lukso-purple/50 text-lukso-purple"
                    : "bg-white/5 border-white/10 text-white/60"
                }`}
              >
                {notifyFollowers ? t.quickSetupNotifyOn : t.quickSetupNotifyOff}
              </button>
            </div>

            <div>
              <p className="text-xs text-white/50 mb-1">{t.settingsReminderFreq}</p>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { key: "monthly", label: t.settingsReminderMonthly },
                  { key: "weekly", label: t.settingsReminderWeekly },
                  { key: "daily", label: t.settingsReminderDaily },
                ] as const).map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setReminderFrequency(option.key)}
                    className={`text-xs py-1.5 rounded-lg border transition-colors ${
                      reminderFrequency === option.key
                        ? "bg-lukso-purple/20 border-lukso-purple/50 text-lukso-purple"
                        : "bg-white/5 border-white/10 text-white/60"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card bg-white/5 border-white/10">
        <p className="text-xs font-medium text-white/70 mb-1">{t.quickSetupSummaryTitle}</p>
        <p className="text-[11px] text-white/45">{t.quickSetupSummarySub}</p>
        <ul className="mt-2 space-y-1 text-[11px] text-white/60">
          <li>• app:celebrations:birthday</li>
          <li>• app:celebrations:events[]</li>
          {includeSettings && <li>• app:celebrations:settings</li>}
        </ul>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1" disabled={isSaving}>
          {t.cancel}
        </button>
        <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={!isValid || isSaving}>
          {isSaving ? <><LoadingSpinner size="sm" /> {t.quickSetupSaving}</> : t.quickSetupSave}
        </button>
      </div>
    </form>
  );
}
