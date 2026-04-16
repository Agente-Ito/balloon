/**
 * LanguageToggle — compact EN / ES switcher.
 * Renders as two pill buttons; selected one is highlighted.
 */
import { useAppStore } from "@/store/useAppStore";
import type { Lang } from "@/lib/i18n";

export function LanguageToggle() {
  const { lang, setLang } = useAppStore();

  const btn = (code: Lang, label: string) => (
    <button
      key={code}
      onClick={() => setLang(code)}
      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
        lang === code
          ? "bg-lukso-purple text-white"
          : "text-white/40 hover:text-white/70"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex items-center gap-0.5 bg-white/5 rounded-xl p-0.5">
      {btn("en", "EN")}
      {btn("es", "ES")}
    </div>
  );
}
