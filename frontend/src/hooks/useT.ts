/**
 * useT — returns the typed translation map for the current language.
 *
 * Usage:
 *   const t = useT();
 *   <button>{t.save}</button>
 */
import { useAppStore } from "@/store/useAppStore";
import { getTranslations } from "@/lib/i18n";

export function useT() {
  const lang = useAppStore((s) => s.lang);
  return getTranslations(lang);
}
