import { CelebrationType, GlobalHoliday } from "@/types";

export const CELEBRATION_LABELS: Record<CelebrationType, string> = {
  [CelebrationType.Birthday]: "Birthday",
  [CelebrationType.UPAnniversary]: "UP Anniversary",
  [CelebrationType.GlobalHoliday]: "Global Holiday",
  [CelebrationType.CustomEvent]: "Custom Event",
};

export const CELEBRATION_EMOJIS: Record<CelebrationType, string> = {
  [CelebrationType.Birthday]: "🎂",
  [CelebrationType.UPAnniversary]: "🆙",
  [CelebrationType.GlobalHoliday]: "🎉",
  [CelebrationType.CustomEvent]: "✨",
};

export const CELEBRATION_COLORS: Record<CelebrationType, string> = {
  [CelebrationType.Birthday]: "bg-pink-500",
  [CelebrationType.UPAnniversary]: "bg-purple-500",
  [CelebrationType.GlobalHoliday]: "bg-yellow-500",
  [CelebrationType.CustomEvent]: "bg-blue-500",
};

export const GLOBAL_HOLIDAYS: GlobalHoliday[] = [
  { id: "christmas", title: "Christmas", date: "12-25", emoji: "🎄", description: "Merry Christmas!" },
  { id: "new-year", title: "New Year", date: "01-01", emoji: "🥂", description: "Happy New Year!" },
  { id: "valentines", title: "Valentine's Day", date: "02-14", emoji: "💝", description: "Happy Valentine's Day!" },
  { id: "halloween", title: "Halloween", date: "10-31", emoji: "🎃", description: "Happy Halloween!" },
  { id: "thanksgiving", title: "Thanksgiving", date: "11-28", emoji: "🦃", description: "Happy Thanksgiving!" },
  { id: "easter", title: "Easter", date: "03-31", emoji: "🐣", description: "Happy Easter!" },
  { id: "independence-day", title: "Independence Day (US)", date: "07-04", emoji: "🎆", description: "Happy 4th of July!" },
  { id: "eid", title: "Eid al-Fitr", date: "04-01", emoji: "🌙", description: "Eid Mubarak!" },
  { id: "diwali", title: "Diwali", date: "10-20", emoji: "🪔", description: "Happy Diwali!" },
  { id: "hanukkah", title: "Hanukkah", date: "12-25", emoji: "🕎", description: "Happy Hanukkah!" },
];

/**
 * Maps CelebrationType to its i18n translation key.
 * Use this to get the type label from translations:
 *   const typeKey = getCelebrationTypeKey(celebration.type);
 *   const label = t[typeKey as keyof typeof t];
 */
export function getCelebrationTypeKey(type: CelebrationType): "typeBirthday" | "typeAnniversary" | "typeHoliday" | "typeCustom" {
  const keys = {
    [CelebrationType.Birthday]: "typeBirthday",
    [CelebrationType.UPAnniversary]: "typeAnniversary",
    [CelebrationType.GlobalHoliday]: "typeHoliday",
    [CelebrationType.CustomEvent]: "typeCustom",
  } as const;
  return keys[type];
}
