import { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import toast from "react-hot-toast";
import { CELEBRATION_LABELS } from "@/constants/celebrationTypes";
import { uploadFileToIPFS } from "@/lib/ipfs";
import { generateTemplateSVG, templateToFile } from "@/lib/celebrationTemplates";
import { TemplatePicker } from "@/components/TemplatePicker";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useT } from "@/hooks/useT";
import { CelebrationType } from "@/types";
import type { Celebration } from "@/types";
import type { CelebrationTemplate } from "@/lib/celebrationTemplates";

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

interface EventFormProps {
  onSave: (event: Celebration) => void;
  onCancel: () => void;
}

export function EventForm({ onSave, onCancel }: EventFormProps) {
  const t = useT();
  const [title, setTitle] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [year, setYear] = useState("");
  const [type, setType] = useState<CelebrationType>(CelebrationType.CustomEvent);
  const [recurring, setRecurring] = useState(true);
  const [description, setDescription] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<CelebrationTemplate | null>(null);
  const [customImageFile, setCustomImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!selectedTemplate) return;
    const svg = generateTemplateSVG(selectedTemplate, title || selectedTemplate.label);
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedTemplate, title]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("File too large (max 10 MB)"); return; }
    setCustomImageFile(file);
    setSelectedTemplate(null);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setCustomImageFile(null);
    setSelectedTemplate(null);
    setImagePreview(null);
  };

  const isValid = title.trim() !== "" && month !== "" && day !== "" && (recurring || year !== "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    const mm = month.padStart(2, "0");
    const dd = day.padStart(2, "0");
    const currentYear = new Date().getFullYear();
    const yy = recurring ? (year || String(currentYear)) : year;
    const date = `${yy}-${mm}-${dd}`;

    const fileToUpload = customImageFile ?? (selectedTemplate ? templateToFile(selectedTemplate, title.trim() || selectedTemplate.label) : null);

    let imageUrl: string | undefined;
    if (fileToUpload) {
      try {
        setIsUploading(true);
        const result = await uploadFileToIPFS(fileToUpload);
        imageUrl = result.url;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        console.warn("[EventForm] image upload failed, saving without image:", msg);
        toast("Image upload skipped — event saved without image", { icon: "⚠️" });
      } finally {
        setIsUploading(false);
      }
    }

    onSave({
      id: uuidv4(),
      type,
      title: title.trim(),
      date,
      recurring,
      description: description.trim() || undefined,
      imageUrl,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-xs text-white/50 mb-1">{t.eventName}</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t.eventNamePlaceholder}
          className="input"
          maxLength={60}
        />
      </div>

      {/* Date */}
      <div>
        <label className="block text-xs text-white/50 mb-1">{t.eventDate}</label>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[10px] text-white/40 mb-1">{t.eventMonth}</label>
            <select value={month} onChange={(e) => setMonth(e.target.value)} className="input text-sm py-1.5">
              <option value="">—</option>
              {MONTH_NAMES.map((m, i) => (
                <option key={m} value={String(i + 1)}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-white/40 mb-1">{t.eventDay}</label>
            <select value={day} onChange={(e) => setDay(e.target.value)} className="input text-sm py-1.5">
              <option value="">—</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={String(d)}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-white/40 mb-1">
              {t.eventYear} {recurring ? <span className="text-white/25">{t.eventYearOpt}</span> : "*"}
            </label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder={recurring ? t.eventYearOpt : "e.g. 2025"}
              min={1900}
              max={2100}
              className="input text-sm py-1.5"
              required={!recurring}
            />
          </div>
        </div>
      </div>

      {/* Type */}
      <div>
        <label className="block text-xs text-white/50 mb-1">{t.eventType}</label>
        <select
          value={type}
          onChange={(e) => setType(Number(e.target.value) as CelebrationType)}
          className="input"
        >
          {Object.entries(CELEBRATION_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs text-white/50 mb-1">{t.eventDesc}</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t.eventDescPlaceholder}
          rows={2}
          className="input resize-none"
          maxLength={200}
        />
      </div>

      {/* Image / Template */}
      <div>
        <label className="block text-xs text-white/50 mb-2">{t.eventImage}</label>
        {!customImageFile && (
          <div className="mb-3">
            <p className="text-[10px] text-white/30 mb-1.5">{t.eventTemplatePick}</p>
            <TemplatePicker
              selected={selectedTemplate?.id ?? null}
              onSelect={(tpl) => {
                setCustomImageFile(null);
                setSelectedTemplate(tpl);
              }}
            />
          </div>
        )}
        <div className="flex items-center gap-3 mt-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-16 h-16 rounded-xl bg-white/5 border border-dashed border-white/20 flex items-center justify-center overflow-hidden hover:border-lukso-purple/50 transition-colors flex-shrink-0"
            title="Upload your own image"
          >
            {imagePreview
              ? <img src={imagePreview} alt="preview" className="w-full h-full object-cover rounded-xl" />
              : <span className="text-2xl">📎</span>}
          </button>
          <div className="flex-1">
            <p className="text-xs text-white/40">
              {customImageFile
                ? customImageFile.name
                : selectedTemplate
                  ? `${t.eventTemplateLabel} ${selectedTemplate.label}`
                  : t.eventOrUpload}
            </p>
            {(customImageFile || selectedTemplate) && (
              <button type="button" onClick={clearImage} className="text-[10px] text-white/30 hover:text-white/60 mt-1">
                {t.eventRemove}
              </button>
            )}
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>

      {/* Recurring toggle */}
      <div className="card">
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <p className="text-sm font-medium">{t.eventRepeats}</p>
            <p className="text-xs text-white/40">{t.eventRepeatsSub}</p>
          </div>
          <button
            type="button"
            onClick={() => setRecurring(!recurring)}
            className={`w-12 h-6 rounded-full transition-colors relative ${recurring ? "bg-lukso-purple" : "bg-white/10"}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${recurring ? "translate-x-6" : "translate-x-0.5"}`} />
          </button>
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">
          {t.cancel}
        </button>
        <button
          type="submit"
          className="btn-primary flex-1 flex items-center justify-center gap-2"
          disabled={!isValid || isUploading}
        >
          {isUploading ? <><LoadingSpinner size="sm" /> {t.eventUploading}</> : t.eventSave}
        </button>
      </div>
    </form>
  );
}
