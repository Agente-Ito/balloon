import { CELEBRATION_TEMPLATES } from "@/lib/celebrationTemplates";
import type { CelebrationTemplate } from "@/lib/celebrationTemplates";

interface TemplatePickerProps {
  selected: string | null;
  onSelect: (tpl: CelebrationTemplate) => void;
}

export function TemplatePicker({ selected, onSelect }: TemplatePickerProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {CELEBRATION_TEMPLATES.map((tpl) => (
        <button
          key={tpl.id}
          type="button"
          onClick={() => onSelect(tpl)}
          className={`rounded-xl overflow-hidden border-2 transition-all relative ${
            selected === tpl.id
              ? "border-lukso-purple scale-105 shadow-lg"
              : "border-transparent hover:border-lukso-purple/40"
          }`}
          title={tpl.label}
        >
          <div className="aspect-square relative">
            <img
              src={`/templates/${tpl.id}-balloon.png`}
              alt={tpl.label}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                (e.currentTarget.nextElementSibling as HTMLElement | null)?.classList.remove("hidden");
              }}
            />
            {/* Fallback gradient shown if PNG fails to load */}
            <span
              className="hidden absolute inset-0 flex items-center justify-center text-3xl"
              style={{ background: `linear-gradient(135deg, ${tpl.gradient[0]}, ${tpl.gradient[1]})` }}
            >
              {tpl.emoji}
            </span>
          </div>
          <span
            className="block text-[10px] font-semibold text-center py-1 px-1 truncate"
            style={{ color: selected === tpl.id ? "#6A1B9A" : "#5a4a38" }}
          >
            {tpl.label}
          </span>
        </button>
      ))}
    </div>
  );
}
