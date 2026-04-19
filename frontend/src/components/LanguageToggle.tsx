import { useAppStore } from "@/store/useAppStore";
import type { Lang } from "@/lib/i18n";

export function LanguageToggle() {
  const { lang, setLang } = useAppStore();

  const btn = (code: Lang, label: string) => (
    <button
      key={code}
      onClick={() => setLang(code)}
      className="px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors"
      style={
        lang === code
          ? { background: "rgba(106,27,154,0.15)", color: "#6A1B9A" }
          : { color: "#8B7D7D" }
      }
    >
      {label}
    </button>
  );

  return (
    <div
      className="flex items-center gap-0.5 rounded-xl p-0.5"
      style={{ background: "rgba(106,27,154,0.06)" }}
    >
      {btn("en", "EN")}
      {btn("es", "ES")}
    </div>
  );
}
