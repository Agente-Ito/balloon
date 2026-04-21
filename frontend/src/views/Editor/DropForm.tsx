/**
 * DropForm — form for creating a new badge drop campaign.
 * Supports pre-filling from events, anniversary, and holiday templates.
 */
import { useState, useEffect, useRef, useMemo } from "react";
import type { CreateDropParams } from "@/hooks/useCreateDrop";
import type { Address, CelebrationType } from "@/types";
import { HOLIDAY_DROP_TEMPLATES, generateHolidaySVG, holidayTemplateToFile } from "@/constants/dropTemplates";
import { useSocialContacts } from "@/hooks/useSocialContacts";
import { useLSP3Name } from "@/hooks/useLSP3Name";
import { Avatar } from "@/components/Avatar";
import { useT } from "@/hooks/useT";
import { useAppStore } from "@/store/useAppStore";
import { getMonthNames } from "@/lib/monthNames";

const TEMPLATE_ASSET_PATHS: Partial<Record<string, string>> = {
  anniversary: "/templates/anniversary-balloon.png",
  milestone: "/templates/milestone-balloon.png",
  celebration: "/templates/celebration-balloon.png",
  graduation: "/templates/graduation-balloon.png",
  holiday: "/templates/holiday-balloon.png",
  birthday: "/templates/birthday-balloon.png",
};

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
  chainId?: number;
  onSave: (params: CreateDropParams) => void;
  onCancel: () => void;
  isSaving: boolean;
  prefill?: DropFormPrefill;
}

function CoHostRow({
  address,
  chainId,
  source,
  selected,
  onToggle,
}: {
  address: Address;
  chainId: number;
  source: "following" | "followers" | "both";
  selected: boolean;
  onToggle: () => void;
}) {
  const t = useT();
  const { data: name } = useLSP3Name(address, chainId);

  const sourceLabel = source === "both"
    ? t.dropFormCoHostsBoth
    : source === "following"
      ? t.dropFormCoHostsFollowing
      : t.dropFormCoHostsFollowers;

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full flex items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition-colors ${
        selected
          ? "border-lukso-purple/50 bg-lukso-purple/10"
          : "border-white/10 bg-white/5 hover:border-white/20"
      }`}
    >
      <Avatar address={address} size={22} chainId={chainId} className="ring-1 ring-white/10" />
      <div className="min-w-0 flex-1">
        <p className="text-xs truncate">{name ?? `${address.slice(0, 6)}…${address.slice(-4)}`}</p>
        <p className="text-[10px] text-[#7b6950] truncate">{address}</p>
      </div>
      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#fff5df] border border-[#d9c49a] text-[#6f5c3f]">{sourceLabel}</span>
    </button>
  );
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
      <label className="block text-xs text-[#7b6950] mb-1">{label}</label>
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
              <span className="text-xs font-mono text-[#6f5c3f] flex-1 truncate">{addr}</span>
              <button type="button" onClick={() => onRemove(addr)}
                className="text-white/30 hover:text-red-400 text-xs leading-none">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function DropForm({ host, chainId = 4201, onSave, onCancel, isSaving, prefill }: DropFormProps) {
  const t = useT();
  const lang = useAppStore((s) => s.lang);
  const currentYear = new Date().getFullYear();
  const monthNames = useMemo(() => getMonthNames(t), [t]);

  const initialTemplateId = useMemo(() => {
    // If we already got concrete prefill data, don't force a template.
    if (prefill?.name || prefill?.description || prefill?.imageFile) return null;
    if (prefill?.celebrationType === 0) return "birthday";
    if (prefill?.celebrationType === 1) return "anniversary";
    if (prefill?.celebrationType === 2) return "holiday";
    // Default for new drops: practical birthday-style starter.
    return "birthday";
  }, [prefill]);

  const initialTemplate = useMemo(() => (
    initialTemplateId ? HOLIDAY_DROP_TEMPLATES.find((tpl) => tpl.id === initialTemplateId) ?? null : null
  ), [initialTemplateId]);

  const initialName = useMemo(() => {
    if (prefill?.name) return prefill.name;
    if (!initialTemplate) return "";
    return lang === "es" ? initialTemplate.nameEs : initialTemplate.name;
  }, [prefill, initialTemplate, lang]);

  const initialDescription = useMemo(() => {
    if (prefill?.description) return prefill.description;
    if (!initialTemplate) return "";
    return lang === "es" ? initialTemplate.descEs : initialTemplate.description;
  }, [prefill, initialTemplate, lang]);

  const [name,        setName]        = useState(initialName);
  const [description, setDesc]        = useState(initialDescription);
  const [celebType,   setCelebType]   = useState<CelebrationType>(prefill?.celebrationType ?? (initialTemplate?.celebrationType ?? 0));
  const [year,        setYear]        = useState(prefill?.year ? String(prefill.year) : "");
  const [month,       setMonth]       = useState(prefill?.month ?? new Date().getMonth() + 1);
  const [day,         setDay]         = useState(prefill?.day ?? new Date().getDate());
  const [maxSupply,   setMaxSupply]   = useState("");
  const [endDate,     setEndDate]     = useState("");
  const [imageFile,   setImageFile]   = useState<File | undefined>(() => (
    prefill?.imageFile ?? (initialTemplate ? holidayTemplateToFile(initialTemplate, currentYear, lang) : undefined)
  ));
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Eligibility
  const [showEligibility, setShowEligibility] = useState(false);
  const [requireFollow,   setRequireFollow]   = useState(true);
  const [minFollowers,    setMinFollowers]     = useState("");
  const [lsp7List,        setLsp7List]         = useState<Address[]>([]);
  const [lsp8List,        setLsp8List]         = useState<Address[]>([]);

  // Optional co-celebrators
  const [showCoHosts, setShowCoHosts] = useState(false);
  const [coHostSearch, setCoHostSearch] = useState("");
  const [coHosts, setCoHosts] = useState<Address[]>([]);
  const [manualCoHost, setManualCoHost] = useState("");
  const { data: socialContacts = [] } = useSocialContacts(host);

  const [selectedTplId, setSelectedTplId] = useState<string | null>(initialTemplate?.id ?? null);

  const typeMenuOptions = useMemo(() => {
    const templateOptions = HOLIDAY_DROP_TEMPLATES.map((tpl) => ({
      value: `tpl:${tpl.id}`,
      label: lang === "es" ? tpl.nameEs : tpl.name,
    }));

    return [...templateOptions, { value: "custom", label: t.typeCustom }]
      .sort((a, b) => a.label.localeCompare(b.label, lang === "es" ? "es" : "en", { sensitivity: "base" }));
  }, [lang, t]);

  const typeMenuValue = useMemo(() => {
    if (selectedTplId) return `tpl:${selectedTplId}`;
    if (celebType === 0) return "tpl:birthday";
    if (celebType === 1) return "tpl:anniversary";
    if (celebType === 2) return "tpl:holiday";
    return "custom";
  }, [selectedTplId, celebType]);

  const templateThumbs = useMemo(() => {
    const byId: Record<string, string> = {};
    for (const tpl of HOLIDAY_DROP_TEMPLATES) {
      const assetSrc = TEMPLATE_ASSET_PATHS[tpl.id];
      if (assetSrc) {
        byId[tpl.id] = assetSrc;
      } else {
        const svg = generateHolidaySVG(tpl, currentYear, lang);
        byId[tpl.id] = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
      }
    }
    return byId;
  }, [currentYear, lang]);

  const selectedTemplate = useMemo(() => {
    if (!selectedTplId) return null;
    return HOLIDAY_DROP_TEMPLATES.find((tpl) => tpl.id === selectedTplId) ?? null;
  }, [selectedTplId]);

  const imageDisplayName = useMemo(() => {
    if (!imageFile) return "";
    if (!selectedTemplate) return imageFile.name;

    const templateName = lang === "es" ? selectedTemplate.nameEs : selectedTemplate.name;
    return lang === "es" ? `Balloon ${templateName}` : `${templateName} Balloon`;
  }, [imageFile, selectedTemplate, lang]);

  async function templateAssetToFile(tplId: string): Promise<File | undefined> {
    const src = TEMPLATE_ASSET_PATHS[tplId];
    if (!src) return undefined;
    try {
      const res = await fetch(src, { cache: "no-store" });
      if (!res.ok) return undefined;
      const blob = await res.blob();
      const type = blob.type || "image/svg+xml";
      const ext = type.includes("jpeg")
        ? "jpg"
        : type.includes("webp")
          ? "webp"
          : type.includes("svg")
            ? "svg"
            : "png";
      return new File([blob], `${tplId}.${ext}`, { type });
    } catch {
      return undefined;
    }
  }

  async function normalizeToSquarePng(file: File, size = 1024): Promise<File> {
    const objectUrl = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("Failed to decode image"));
        el.src = objectUrl;
      });

      const srcW = img.naturalWidth || img.width;
      const srcH = img.naturalHeight || img.height;
      const side = Math.min(srcW, srcH);
      const sx = Math.floor((srcW - side) / 2);
      const sy = Math.floor((srcH - side) / 2);

      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext("2d");
      if (!ctx) return file;

      ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), "image/png", 0.95);
      });
      if (!blob) return file;

      const baseName = file.name.replace(/\.[^.]+$/, "") || "template";
      return new File([blob], `${baseName}-square.png`, { type: "image/png" });
    } catch {
      return file;
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

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

  const filteredContacts = useMemo(() => {
    const q = coHostSearch.trim().toLowerCase();
    if (!q) return socialContacts;
    return socialContacts.filter((contact) => contact.address.toLowerCase().includes(q));
  }, [coHostSearch, socialContacts]);

  const canAddManualCoHost = manualCoHost.trim().startsWith("0x") && manualCoHost.trim().length === 42;

  async function applyHolidayTemplate(tplId: string) {
    const tpl = HOLIDAY_DROP_TEMPLATES.find((t) => t.id === tplId);
    if (!tpl) return;
    setSelectedTplId(tplId);
    const localName = lang === "es" ? tpl.nameEs : tpl.name;
    setName(localName);
    setDesc(lang === "es" ? tpl.descEs : tpl.description);
    setCelebType(tpl.celebrationType);
    if (tpl.month > 0) setMonth(tpl.month);
    if (tpl.day > 0) setDay(tpl.day);
    setYear(tpl.month > 0 && tpl.day > 0 ? String(currentYear) : "");
    const realImageFile = await templateAssetToFile(tplId);
    const nextFile = realImageFile ?? holidayTemplateToFile(tpl, currentYear, lang);
    setImageFile(await normalizeToSquarePng(nextFile));
  }

  async function handleTypeMenuChange(value: string) {
    if (value === "custom") {
      setSelectedTplId(null);
      setCelebType(3 as CelebrationType);
      return;
    }
    await applyHolidayTemplate(value.replace("tpl:", ""));
  }

  const handleSubmit = () => {
    if (!name || !month || !day) return;

    const normalizedCoHosts = Array.from(new Set(coHosts.map((a) => a.toLowerCase())));
    const metaSuffix = normalizedCoHosts.length
      ? `\n\n[co-celebrators:${normalizedCoHosts.join(",")}]`
      : "";

    onSave({
      host,
      celebrationType: celebType,
      year: year ? Number(year) : 0,
      month,
      day,
      endAt:             endDate ? new Date(endDate) : undefined,
      maxSupply:         maxSupply ? Number(maxSupply) : undefined,
      requireFollowsHost: requireFollow,
      minFollowers:      minFollowers ? Number(minFollowers) : undefined,
      requiredLSP7:      lsp7List,
      requiredLSP8:      lsp8List,
      name,
      description: `${description ?? ""}${metaSuffix}`.trim(),
      imageFile,
    });
  };

  return (
    <div className="flex flex-col gap-5">

      {/* ── Badge image ────────────────────────────────────────────── */}
      <div>
        <p className="text-xs text-[#7b6950] mb-1.5">{t.dropFormBadgePreview}</p>
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
          <div className="flex-1 text-xs text-[#7b6950]">
            {imageFile
              ? <><span className="text-[#6f5c3f]">{imageDisplayName}</span><button type="button" onClick={() => { setImageFile(undefined); setSelectedTplId(null); }} className="block text-[#9b8a6a] hover:text-[#6f5c3f] mt-1">{t.dropImageRemove}</button></>
              : selectedTplId
                ? <span className="text-[#6f5c3f]">{t.dropFormTemplateApplied}</span>
                : t.dropFormBadgeHint ?? "Upload your own or pick a template above"}
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>

      {/* ── Basics ─────────────────────────────────────────────────── */}
      <div>
        <label className="block text-xs text-[#7b6950] mb-1">{t.dropFormName}</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)}
          onFocus={(e) => e.target.select()}
          placeholder={t.dropFormNamePlaceholder} className="input w-full" />
      </div>

      <div>
        <label className="block text-xs text-[#7b6950] mb-1">{t.dropFormDescription}</label>
        <textarea value={description} onChange={(e) => setDesc(e.target.value)}
          onFocus={(e) => e.target.select()}
          placeholder={t.dropFormDescPlaceholder}
          rows={2} className="input w-full resize-none" />
      </div>

      <div>
        <label className="block text-xs text-[#7b6950] mb-1">{t.dropFormType}</label>
        <select value={typeMenuValue}
          onChange={(e) => { void handleTypeMenuChange(e.target.value); }}
          className="input w-full">
          {typeMenuOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <div className="mt-2">
          <div className="flex gap-2.5 overflow-x-auto pb-2 px-1 -mx-1 snap-x snap-mandatory scroll-px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {HOLIDAY_DROP_TEMPLATES.map((tpl) => {
              const active = selectedTplId === tpl.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => { void applyHolidayTemplate(tpl.id); }}
                  className={`w-[102px] shrink-0 rounded-xl border p-1.5 transition-all snap-center ${
                    active ? "border-lukso-purple bg-lukso-purple/15 shadow-[0_4px_16px_rgba(106,27,154,0.18)]" : "border-lukso-border bg-white/5 hover:border-white/30"
                  }`}
                  title={lang === "es" ? tpl.nameEs : tpl.name}
                >
                  <img
                    src={templateThumbs[tpl.id]}
                    alt={lang === "es" ? tpl.nameEs : tpl.name}
                    className="w-full aspect-square rounded-md object-cover"
                    onError={(e) => {
                      const svg = generateHolidaySVG(tpl, currentYear, lang);
                      e.currentTarget.src = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
                    }}
                  />
                  <span className="block mt-1.5 text-[11px] leading-tight text-center text-[#6f5c3f] truncate">
                    {lang === "es" ? tpl.nameEs : tpl.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Date ───────────────────────────────────────────────────── */}
      <div>
        <label className="block text-xs text-[#7b6950] mb-1">{t.dropFormDate}</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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
          <input type="number" value={year} onChange={(e) => setYear(e.target.value)}
            placeholder={t.dropFormYearAny} min={0} max={2100} className="input text-sm py-1.5 col-span-2 md:col-span-1" />
        </div>
      </div>

      {/* ── Limits ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-[#7b6950] mb-1">
            {t.dropFormClosesOn} <span className="text-[#9b8a6a]">{t.dropFormOptional}</span>
          </label>
          <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)}
            className="input w-full text-sm" />
        </div>
        <div>
          <label className="block text-xs text-[#7b6950] mb-1">
            {t.dropFormMaxClaims} <span className="text-[#9b8a6a]">{t.dropFormOptional}</span>
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
          <span className="text-[#7b6950] text-xs">
            {showEligibility ? t.dropFormEligHide : t.dropFormEligConfigure}
          </span>
        </button>

        {showEligibility && (
          <div className="px-4 pb-4 flex flex-col gap-4 border-t border-lukso-border">
            <p className="text-xs text-[#7b6950] pt-3">
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
                <p className="text-xs text-[#7b6950]">{t.dropFormMustFollowSub}</p>
              </div>
            </label>

            <div>
              <label className="block text-xs text-[#7b6950] mb-1">
                {t.dropFormMinFollowers} <span className="text-[#9b8a6a]">{t.dropFormMinFollowersHint}</span>
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
      <div className="border border-lukso-border rounded-2xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowCoHosts((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{t.dropFormCoHosts}</span>
            {coHosts.length > 0 && (
              <span className="badge bg-lukso-purple/20 text-lukso-purple text-xs">
                {coHosts.length} {t.dropFormCoHostsSelected}
              </span>
            )}
          </div>
          <span className="text-[#7b6950] text-xs">
            {showCoHosts ? t.dropFormCoHostsHide : t.dropFormCoHostsConfigure}
          </span>
        </button>

        {showCoHosts && (
          <div className="px-4 pb-4 pt-3 border-t border-lukso-border space-y-3">
            <p className="text-xs text-[#7b6950]">{t.dropFormCoHostsHint}</p>

            <input
              type="text"
              value={coHostSearch}
              onChange={(e) => setCoHostSearch(e.target.value)}
              placeholder={t.dropFormCoHostsSearchPlaceholder}
              className="input w-full text-sm"
            />

            <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
              {filteredContacts.length === 0 ? (
                <p className="text-xs text-[#7b6950]">{t.dropFormCoHostsEmpty}</p>
              ) : (
                filteredContacts.map((contact) => (
                  <CoHostRow
                    key={contact.address}
                    address={contact.address}
                    chainId={chainId}
                    source={contact.source}
                    selected={coHosts.includes(contact.address)}
                    onToggle={() => {
                      setCoHosts((prev) => (
                        prev.includes(contact.address)
                          ? prev.filter((a) => a !== contact.address)
                          : [...prev, contact.address]
                      ));
                    }}
                  />
                ))
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={manualCoHost}
                onChange={(e) => setManualCoHost(e.target.value)}
                placeholder={t.dropFormCoHostsManualPlaceholder}
                className="input flex-1 text-xs font-mono"
              />
              <button
                type="button"
                onClick={() => {
                  const addr = manualCoHost.trim() as Address;
                  if (!addr.startsWith("0x") || addr.length !== 42) return;
                  setCoHosts((prev) => (prev.includes(addr) ? prev : [...prev, addr]));
                  setManualCoHost("");
                }}
                disabled={!canAddManualCoHost}
                className="btn-ghost text-xs px-3 border border-lukso-border disabled:opacity-40"
              >
                {t.dropFormAddBtn}
              </button>
            </div>

            {coHosts.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {coHosts.map((addr) => (
                  <span key={addr} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-lukso-purple/10 border border-lukso-purple/20 text-[11px]">
                    {addr.slice(0, 6)}…{addr.slice(-4)}
                    <button
                      type="button"
                      onClick={() => setCoHosts((prev) => prev.filter((a) => a !== addr))}
                      className="text-[#9b8a6a] hover:text-red-400 leading-none"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}

            <p className="text-[11px] text-[#7b6950]">{t.dropFormCoHostsMetaNote}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
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
