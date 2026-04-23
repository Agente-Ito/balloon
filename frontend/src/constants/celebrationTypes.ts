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
  [CelebrationType.Birthday]: "bg-amber-400",
  [CelebrationType.UPAnniversary]: "bg-amber-500",
  [CelebrationType.GlobalHoliday]: "bg-yellow-400",
  [CelebrationType.CustomEvent]: "bg-yellow-500",
};

export const GLOBAL_HOLIDAYS: GlobalHoliday[] = [
  // ── January ──────────────────────────────────────────────────────────────
  { id: "new-year",          title: "New Year",                 titleEs: "Año Nuevo",                date: "01-01", emoji: "🥂",  description: "Happy New Year!",                   descEs: "¡Feliz Año Nuevo!",                      image: "/holidays/new-year.png" },
  // ── February ─────────────────────────────────────────────────────────────
  { id: "valentines",        title: "Valentine's Day",          titleEs: "San Valentín",             date: "02-14", emoji: "💝",  description: "Happy Valentine's Day!",             descEs: "¡Feliz Día de San Valentín!",             image: "/holidays/valentines.png" },
  // ── March ────────────────────────────────────────────────────────────────
  { id: "easter",            title: "Easter",                   titleEs: "Semana Santa",             date: "03-31", emoji: "🐣",  description: "Happy Easter!",                     descEs: "¡Felices Pascuas!" },
  // ── April ────────────────────────────────────────────────────────────────
  { id: "eid",               title: "Eid al-Fitr",              titleEs: "Eid al-Fitr",              date: "04-01", emoji: "🌙",  description: "Eid Mubarak!",                      descEs: "¡Eid Mubarak!" },
  { id: "earth-day",         title: "Earth Day",                titleEs: "Día de la Tierra",         date: "04-22", emoji: "🌍",  description: "Happy Earth Day!",                  descEs: "¡Feliz Día de la Tierra!",               image: "/holidays/earth-day.png" },
  // ── May ──────────────────────────────────────────────────────────────────
  { id: "press-freedom-day", title: "World Press Freedom Day",  titleEs: "Día Lib. de Prensa",       date: "05-03", emoji: "📰",  description: "World Press Freedom Day",           descEs: "Día Mundial de la Libertad de Prensa",   image: "/holidays/press-freedom-day.png" },
  { id: "museum-day",        title: "International Museum Day", titleEs: "Día de los Museos",        date: "05-18", emoji: "🏛️", description: "Happy International Museum Day!",   descEs: "¡Feliz Día de los Museos!",              image: "/holidays/museum-day.png" },
  { id: "lukso-anniversary", title: "LUKSO Anniversary",        titleEs: "Aniversario LUKSO",        date: "05-23", emoji: "🔮",  description: "Happy LUKSO Anniversary!",          descEs: "¡Feliz Aniversario de LUKSO!",           image: "/holidays/lukso-anniversary.png" },
  // ── July ─────────────────────────────────────────────────────────────────
  { id: "independence-day",  title: "Independence Day (US)",    titleEs: "Día Independencia (EE.UU)",date: "07-04", emoji: "🎆",  description: "Happy 4th of July!",               descEs: "¡Feliz 4 de Julio!" },
  // ── October ──────────────────────────────────────────────────────────────
  { id: "diwali",            title: "Diwali",                   titleEs: "Diwali",                  date: "10-20", emoji: "🪔",  description: "Happy Diwali!",                     descEs: "¡Feliz Diwali!" },
  { id: "halloween",         title: "Halloween",                titleEs: "Halloween",               date: "10-31", emoji: "🎃",  description: "Happy Halloween!",                  descEs: "¡Feliz Halloween!",                      image: "/holidays/halloween.png" },
  // ── November ─────────────────────────────────────────────────────────────
  { id: "thanksgiving",      title: "Thanksgiving",             titleEs: "Día de Acción de Gracias",date: "11-28", emoji: "🦃",  description: "Happy Thanksgiving!",               descEs: "¡Feliz Día de Acción de Gracias!" },
  // ── December ─────────────────────────────────────────────────────────────
  { id: "hanukkah",          title: "Hanukkah",                 titleEs: "Hanukkah",                date: "12-25", emoji: "🕎",  description: "Happy Hanukkah!",                   descEs: "¡Feliz Hanukkah!" },
  { id: "christmas",         title: "Christmas",                titleEs: "Navidad",                 date: "12-25", emoji: "🎄",  description: "Merry Christmas!",                  descEs: "¡Feliz Navidad!" },
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
