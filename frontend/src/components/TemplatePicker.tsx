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
          className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-1 border-2 transition-all ${
            selected === tpl.id ? "scale-105 shadow-lg" : "border-transparent"
          }`}
          style={{
            background: `linear-gradient(135deg, ${tpl.gradient[0]}, ${tpl.gradient[1]})`,
            borderColor: selected === tpl.id ? "rgba(255,255,255,0.8)" : "transparent",
          }}
        >
          <span className="text-2xl">{tpl.emoji}</span>
          {/* Intentionally white — text sits on a colored gradient, not on cream */}
          <span className="text-[10px] font-semibold drop-shadow" style={{ color: "#ffffff" }}>
            {tpl.label}
          </span>
        </button>
      ))}
    </div>
  );
}
