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
            selected === tpl.id
              ? "border-white scale-105 shadow-lg"
              : "border-transparent hover:border-white/30"
          }`}
          style={{
            background: `linear-gradient(135deg, ${tpl.gradient[0]}, ${tpl.gradient[1]})`,
          }}
        >
          <span className="text-2xl">{tpl.emoji}</span>
          <span className="text-[10px] text-white font-semibold drop-shadow">{tpl.label}</span>
        </button>
      ))}
    </div>
  );
}
