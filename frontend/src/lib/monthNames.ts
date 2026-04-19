/**
 * monthNames.ts — Get month names from i18n translations.
 * Use this to get a localized array of month names for dropdowns and displays.
 */
import type { Translations } from "./i18n";

export function getMonthNames(t: Translations): string[] {
  return [
    t.monthJan,
    t.monthFeb,
    t.monthMar,
    t.monthApr,
    t.monthMay,
    t.monthJun,
    t.monthJul,
    t.monthAug,
    t.monthSep,
    t.monthOct,
    t.monthNov,
    t.monthDec,
  ];
}

/**
 * Get a month name by index (1-indexed).
 * getMonthName(t, 1) → "January" or "Enero" depending on locale
 */
export function getMonthName(t: Translations, monthNum: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12): string {
  const names = getMonthNames(t);
  return names[monthNum - 1] ?? "";
}
