/**
 * DropForm — form for creating a new badge drop campaign.
 * Supports pre-filling from events, anniversary, and holiday templates.
 */
import { useState, useEffect, useRef, useMemo } from "react";
import type { CreateDropParams } from "@/hooks/useCreateDrop";
import type { Address, CelebrationType } from "@/types";
import { HOLIDAY_DROP_TEMPLATES, holidayTemplateToFile } from "@/constants/dropTemplates";
import { useT } from "@/hooks/useT";
import { getMonthNames } from "@/lib/monthNames";

export interface DropFormPrefill {
  name?: string;
  description?: string;
  celebrationType?: CelebrationType;
  month?: number;
  day?: number;
  year?: number;
  /** Pre-generated image file (anniversary SVG, holiday badge, etc.) */
  imageFile?: File;
}

interface DropFormProps {
  host: Address;
  onSave: (params: CreateDropParams) => void;
  onCancel: () => void;
  isSaving: boolean;
  prefill?: DropFormPrefill;
}

function AddressListField({
  label, placeholder, list, onAdd, onRemove, addLabel,
}: {
  label: string; placeholder: string; list: Address[]; addLabel: string;
  onAdd: (a: Address) => void; onRemove: (a: Address) => void;
}) {
  const [input, setInput] = useState("");
  const add = () => {
    const addr = input.trim() as Address;
    if (addr.startsWith("0x") && addr.length === 42 && !list.includes(addr)) {
      onAdd(addr); setInput("");
    }
  };
  return (
    <div>
      <label className="block text-xs text-white/40 mb-1">{label}</label>
      <div className="flex gap-2">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder={placeholder} className="input flex-1 text-xs font-mono" />
        <button type="button" onClick={add}
          className="btn-ghost text-xs px-3 border border-lukso-border">{addLabel}</button>
      </div>
      {list.length > 0 && (
        <div className="mt-2 space-y-1">
          {list.map((addr) => (
            <div key={addr} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-1.5">
              <span className="text-xs font-mono text-white/60 flex-1 truncate">{addr}</span>
              <button type="button" onClick={() => onRemove(addr)}
                className="text-white/30 hover:text-red-400 text-xs leading-none">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function DropForm({ host, onSave, onCancel, isSaving, prefill }: DropFormProps) {
  const t = useT();
  const currentYear = new Date().getFullYear();
  const monthNames = useMemo(() => getMonthNames(t), [t]);

  const CT_OPTIONS = [
    { value: 0, label: t.typeBirthday },
    { value: 1, label: t.typeAnniversary },
    { value: 2, label: t.typeHoliday },
    { value: 3, label: t.typeCustom },
  ];

  const [name,        setName]        = useState(prefill?.name ?? "");
  const [description, setDesc]        = useState(prefill?.description ?? "");
  const [celebType,   setCelebType]   = useState<CelebrationType>(prefill?.celebrationType ?? 0);
  const [year,        setYear]        = useState(prefill?.year ?? currentYear);
  const [month,       setMonth]       = useState(prefill?.month ?? new Date().getMonth() + 1);
  const [day,         setDay]         = useState(prefill?.day ?? new Date().getDate());
  const [maxSupply,   setMaxSupply]   = useState("");
  const [endDate,     setEndDate]     = useState("");
  const [imageFile,   setImageFile]   = useState<File | undefined>(prefill?.imageFile);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Eligibility
  const [showEligibility, setShowEligibility] = useState(false);
  const [requireFollow,   setRequireFollow]   = useState(false);
  const [minFollowers,    setMinFollowers]     = useState("");
  const [lsp7List,        setLsp7List]         = useState<Address[]>([]);
  const [lsp8List,        setLsp8List]         = useState<Address[]>([]);

  // Templates picker
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTplId, setSelectedTplId] = useState<string | null>(null);

  useEffect(() => {
    if (!imageFile) { setImagePreview(null); return; }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setSelectedTplId(null);
  };

  const hasConditions = requireFollow || !!minFollowers || lsp7List.length > 0 || lsp8List.length > 0;

  function applyHolidayTemplate(tplId: string) {
    const tpl = HOLIDAY_DROP_TEMPLATES.find((t) => t.id === tplId);
    if (!tpl) return;
    setSelectedTplId(tplId);
    setName(`${tpl.name} ${currentYear}`);
    setDesc(tpl.description);
    setCelebType(tpl.celebrationType);
    setMonth(tpl.month);
    setDay(tpl.day);
    setYear(currentYear);
    setImageFile(holidayTemplateToFile(tpl, currentYear));
    setShowTemplates(false);
  }

  const handleSubmit = () => {
    if (!name || !month || !day) return;
    onSave({
      host,
      celebrationType: celebType,
      year,
      month,
      day,
      endAt:             endDate ? new Date(endDate) : undefined,
      maxSupply:         maxSupply ? Number(maxSupply) : undefined,
      requireFollowsHost: requireFollow,
      minFollowers:      minFollowers ? Number(minFollowers) : undefined,
      requiredLSP7:      lsp7List,
      requiredLSP8:      lsp8List,
      name,
      description,
      imageFile,
    });
  };

  return (
    <div className="flex flex-col gap-5">

      {/* ── Holiday templates picker ───────────────────────────────── */}
      <div className="border border-lukso-border rounded-2xl overflow-hidden">
        <button type="button"
          onClick={() => setShowTemplates((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{t.dropFormTemplates}</span>
            {selectedTplId && (
              <span className="badge bg-lukso-purple/20 text-lukso-purple text-xs">{t.dropFormTemplateApplied}</span>
            )}
          </div>
          <span className="text-white/40 text-xs">{showTemplates ? t.dropFormTemplateHide : t.dropFormTemplateBrowse}</span>
        </button>

        {showTemplates && (
          <div className="border-t border-lukso-border px-3 pb-3 pt-2 overflow-x-auto">
            <div className="flex gap-2" style={{ minWidth: "max-content" }}>
              {HOLIDAY_DROP_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => applyHolidayTemplate(tpl.id)}
                  className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl border transition-colors flex-shrink-0 ${
                    selectedTplId === tpl.id
                      ? "border-lukso-purple bg-lukso-purple/15"
                      : "border-lukso-border hover:border-white/30 bg-white/5"
                  }`}
                >
                  <span className="text-2xl">{tpl.emoji}</span>
                  <span className="text-[10px] text-white/70 whitespace-nowrap font-medium">
                    {tpl.name}
                  </span>
                  <span className="text-[9px] text-white/30">
                    {String(tpl.month).padStart(2,"0")}/{String(tpl.day).padStart(2,"0")}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Badge image ────────────────────────────────────────────── */}
      <div>
        <p className="text-xs text-white/40 mb-1.5">{t.dropFormBadgePreview}</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-16 h-16 rounded-2xl bg-white/5 border border-dashed border-white/20 flex items-center justify-center overflow-hidden hover:border-lukso-purple/50 transition-colors flex-shrink-0"
          >
            {imagePreview
              ? <img src={imagePreview} alt="badge" className="w-full h-full object-cover" />
              : <span className="text-2xl">🖼️</span>}
          </button>
          <div className="flex-1 text-xs text-white/40">
            {imageFile
              ? <><span className="text-white/60">{imageFile.name}</span><button type="button" onClick={() => { setImageFile(undefined); setSelectedTplId(null); }} className="block text-white/30 hover:text-white/60 mt-1">{t.dropImageRemove}</button></>
              : selectedTplId
                ? <span className="text-white/60">{t.dropFormTemplateApplied}</span>
                : t.dropFormBadgeHint ?? "Upload your own or pick a template above"}
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>

      {/* ── Basics ─────────────────────────────────────────────────── */}
      <div>
        <label className="block text-xs text-white/40 mb-1">{t.dropFormName}</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)}
          placeholder={t.dropFormNamePlaceholder} className="input w-full" />
      </div>

      <div>
        <label className="block text-xs text-white/40 mb-1">{t.dropFormDescription}</label>
        <textarea value={description} onChange={(e) => setDesc(e.target.value)}
          placeholder={t.dropFormDescPlaceholder}
          rows={2} className="input w-full resize-none" />
      </div>

      <div>
        <label className="block text-xs text-white/40 mb-1">{t.dropFormType}</label>
        <select value={celebType}
          onChange={(e) => setCelebType(Number(e.target.value) as CelebrationType)}
          className="input w-full">
          {CT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* ── Date ───────────────────────────────────────────────────── */}
      <div>
        <label className="block text-xs text-white/40 mb-1">{t.dropFormDate}</label>
        <div className="grid grid-cols-3 gap-2">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
            className="input text-sm py-1.5">
            {monthNames.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
          <select value={day} onChange={(e) => setDay(Number(e.target.value))}
            className="input text-sm py-1.5">
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))}
            min={currentYear} max={2100} className="input text-sm py-1.5" />
        </div>
      </div>

      {/* ── Limits ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-white/40 mb-1">
            {t.dropFormClosesOn} <span className="text-white/20">{t.dropFormOptional}</span>
          </label>
          <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)}
            className="input w-full text-sm" />
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1">
            {t.dropFormMaxClaims} <span className="text-white/20">{t.dropFormOptional}</span>
          </label>
          <input type="number" value={maxSupply} onChange={(e) => setMaxSupply(e.target.value)}
            placeholder={t.dropFormUnlimited} min={1} className="input w-full text-sm" />
        </div>
      </div>

      {/* ── Eligibility (collapsible) ───────────────────────────────── */}
      <div className="border border-lukso-border rounded-2xl overflow-hidden">
        <button type="button" onClick={() => setShowEligibility((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{t.dropFormEligibility}</span>
            {hasConditions && (
              <span className="badge bg-lukso-purple/20 text-lukso-purple">
                {[requireFollow, !!minFollowers, lsp7List.length > 0, lsp8List.length > 0]
                  .filter(Boolean).length} {t.dropFormEligActive}
              </span>
            )}
          </div>
          <span className="text-white/40 text-xs">
            {showEligibility ? t.dropFormEligHide : t.dropFormEligConfigure}
          </span>
        </button>

        {showEligibility && (
          <div className="px-4 pb-4 flex flex-col gap-4 border-t border-lukso-border">
            <p className="text-xs text-white/30 pt-3">
              {t.dropFormEligHint}
            </p>

            <label className="flex items-center gap-3 cursor-pointer">
              <div onClick={() => setRequireFollow((v) => !v)}
                className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 flex-shrink-0 ${
                  requireFollow ? "bg-lukso-purple" : "bg-white/20"
                }`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  requireFollow ? "translate-x-5" : "translate-x-0"
                }`} />
              </div>
              <div>
                <p className="text-sm">{t.dropFormMustFollow}</p>
                <p className="text-xs text-white/30">{t.dropFormMustFollowSub}</p>
              </div>
            </label>

            <div>
              <label className="block text-xs text-white/40 mb-1">
                {t.dropFormMinFollowers} <span className="text-white/20">{t.dropFormMinFollowersHint}</span>
              </label>
              <input type="number" value={minFollowers}
                onChange={(e) => setMinFollowers(e.target.value)}
                placeholder="0" min={0} className="input w-full" />
            </div>

            <AddressListField label={t.dropFormLsp7}
              placeholder={t.dropFormAddrPlaceholder}
              addLabel={t.dropFormAddBtn}
              list={lsp7List}
              onAdd={(a) => setLsp7List([...lsp7List, a])}
              onRemove={(a) => setLsp7List(lsp7List.filter((x) => x !== a))} />

            <AddressListField label={t.dropFormLsp8}
              placeholder={t.dropFormAddrPlaceholder}
              addLabel={t.dropFormAddBtn}
              list={lsp8List}
              onAdd={(a) => setLsp8List([...lsp8List, a])}
              onRemove={(a) => setLsp8List(lsp8List.filter((x) => x !== a))} />
          </div>
        )}
      </div>

      {/* ── Actions ────────────────────────────────────────────────── */}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel}
          className="btn-ghost flex-1 text-sm border border-lukso-border">{t.cancel}</button>
        <button type="button" onClick={handleSubmit}
          disabled={isSaving || !name || !month || !day}
          className="btn-primary flex-1 text-sm">
          {isSaving ? t.creating : t.dropFormCreateBtn}
        </button>
      </div>
    </div>
  );
}
