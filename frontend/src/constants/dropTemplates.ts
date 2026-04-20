/**
 * Curated holiday drop templates.
 * Each template can generate its own SVG badge image client-side, so no
 * pre-uploaded IPFS files are needed. A different image is generated each
 * year (year number embedded), giving collectors distinct annual NFTs.
 */
import { CelebrationType } from "@/types";

export interface HolidayDropTemplate {
  id: string;
  name: string;
  nameEs: string;
  emoji: string;
  /** 0 = no preset date — user must choose */
  month: number;
  day: number;
  celebrationType: CelebrationType;
  description: string;
  descEs: string;
  /** CSS gradient stops [from, to] */
  gradient: [string, string];
}

export const HOLIDAY_DROP_TEMPLATES: HolidayDropTemplate[] = [
  {
    id: "birthday",
    name: "Birthday",
    nameEs: "Cumpleaños",
    emoji: "🎂",
    month: 0, day: 0,
    celebrationType: CelebrationType.Birthday,
    description: "Celebrate a birthday with an exclusive balloon badge! 🎈 Claim yours now.",
    descEs: "¡Celebra un cumpleaños con una insignia globo exclusiva! 🎈 Reclama la tuya ahora.",
    gradient: ["#c084fc", "#f472b6"],
  },
  {
    id: "holiday",
    name: "Holiday",
    nameEs: "Festividad",
    emoji: "🎉",
    month: 0, day: 0,
    celebrationType: CelebrationType.GlobalHoliday,
    description: "Join the celebration — claim your exclusive holiday badge on LUKSO!",
    descEs: "Únete a la festividad — ¡reclama tu insignia exclusiva en LUKSO!",
    gradient: ["#7c3aed", "#16a34a"],
  },
  {
    id: "anniversary",
    name: "Anniversary",
    nameEs: "Aniversario",
    emoji: "📅",
    month: 0, day: 0,
    celebrationType: CelebrationType.UPAnniversary,
    description: "Mark this special anniversary with a commemorative badge. Claim yours!",
    descEs: "Marca este aniversario especial con una insignia conmemorativa. ¡Reclama la tuya!",
    gradient: ["#6d28d9", "#b45309"],
  },
  {
    id: "milestone",
    name: "Milestone",
    nameEs: "Hito",
    emoji: "⭐",
    month: 0, day: 0,
    celebrationType: CelebrationType.CustomEvent,
    description: "A milestone worth commemorating — claim your exclusive badge on LUKSO!",
    descEs: "Un hito que merece ser recordado — ¡reclama tu insignia exclusiva en LUKSO!",
    gradient: ["#5b21b6", "#92400e"],
  },
  {
    id: "celebration",
    name: "Celebration",
    nameEs: "Celebración",
    emoji: "🥂",
    month: 0, day: 0,
    celebrationType: CelebrationType.CustomEvent,
    description: "Something worth celebrating! Claim your commemorative badge on LUKSO.",
    descEs: "¡Algo digno de celebrar! Reclama tu insignia conmemorativa en LUKSO.",
    gradient: ["#7e22ce", "#db2777"],
  },
  {
    id: "graduation",
    name: "Graduation",
    nameEs: "Graduación",
    emoji: "🎓",
    month: 0, day: 0,
    celebrationType: CelebrationType.CustomEvent,
    description: "Congratulations, graduate! Claim your commemorative badge on LUKSO.",
    descEs: "¡Felicitaciones, graduado! Reclama tu insignia conmemorativa en LUKSO.",
    gradient: ["#4c1d95", "#1d4ed8"],
  },
];

// ── SVG generator ─────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function generateHolidaySVG(tpl: HolidayDropTemplate, year: number, lang?: string): string {
  const [c1, c2] = tpl.gradient;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="rgba(0,0,0,0.4)"/>
    </filter>
  </defs>
  <rect width="400" height="400" fill="url(#g)" rx="24"/>
  <rect x="16" y="16" width="368" height="368" rx="16"
        fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"/>
  <!-- Emoji centrepiece -->
  <text x="200" y="208" font-size="118" text-anchor="middle" dominant-baseline="middle"
        filter="url(#shadow)">${esc(tpl.emoji)}</text>
  <!-- Bottom pill -->
  <rect x="28" y="294" width="344" height="78" rx="16" fill="rgba(0,0,0,0.32)"/>
  <text x="200" y="318" font-size="21" fill="white" text-anchor="middle"
        font-family="system-ui,sans-serif" font-weight="700">${esc(lang === "es" ? tpl.nameEs : tpl.name)}</text>
  <text x="200" y="346" font-size="14" fill="rgba(255,255,255,0.55)" text-anchor="middle"
        font-family="system-ui,sans-serif">${year} · 🎈 balloon</text>
</svg>`;
}

export function holidayTemplateToFile(tpl: HolidayDropTemplate, year: number, lang?: string): File {
  const svg  = generateHolidaySVG(tpl, year, lang);
  const blob = new Blob([svg], { type: "image/svg+xml" });
  return new File([blob], `${tpl.id}-${year}.svg`, { type: "image/svg+xml" });
}
