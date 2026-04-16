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
  emoji: string;
  month: number;
  day: number;
  celebrationType: CelebrationType;
  description: string;
  /** CSS gradient stops [from, to] */
  gradient: [string, string];
}

export const HOLIDAY_DROP_TEMPLATES: HolidayDropTemplate[] = [
  {
    id: "new-year",
    name: "Happy New Year",
    emoji: "🥂",
    month: 1, day: 1,
    celebrationType: CelebrationType.GlobalHoliday,
    description: "Ring in the new year on LUKSO — claim your commemorative badge!",
    gradient: ["#0f2044", "#0ea5e9"],
  },
  {
    id: "valentines",
    name: "Valentine's Day",
    emoji: "💝",
    month: 2, day: 14,
    celebrationType: CelebrationType.GlobalHoliday,
    description: "Happy Valentine's Day! Claim your love badge.",
    gradient: ["#831843", "#f43f5e"],
  },
  {
    id: "easter",
    name: "Happy Easter",
    emoji: "🐣",
    month: 3, day: 30,
    celebrationType: CelebrationType.GlobalHoliday,
    description: "Happy Easter! Claim your spring badge.",
    gradient: ["#14532d", "#84cc16"],
  },
  {
    id: "halloween",
    name: "Happy Halloween",
    emoji: "🎃",
    month: 10, day: 31,
    celebrationType: CelebrationType.GlobalHoliday,
    description: "Trick or treat on LUKSO! Claim your Halloween badge.",
    gradient: ["#431407", "#f97316"],
  },
  {
    id: "christmas",
    name: "Merry Christmas",
    emoji: "🎄",
    month: 12, day: 25,
    celebrationType: CelebrationType.GlobalHoliday,
    description: "Merry Christmas! Claim your festive badge.",
    gradient: ["#14532d", "#dc2626"],
  },
  {
    id: "new-year-eve",
    name: "New Year's Eve",
    emoji: "🎆",
    month: 12, day: 31,
    celebrationType: CelebrationType.GlobalHoliday,
    description: "Count down to midnight together — claim your NYE badge!",
    gradient: ["#1e1b4b", "#8b5cf6"],
  },
  {
    id: "diwali",
    name: "Happy Diwali",
    emoji: "🪔",
    month: 10, day: 20,
    celebrationType: CelebrationType.GlobalHoliday,
    description: "Festival of lights on LUKSO — claim your Diwali badge!",
    gradient: ["#78350f", "#f59e0b"],
  },
  {
    id: "hanukkah",
    name: "Happy Hanukkah",
    emoji: "🕎",
    month: 12, day: 26,
    celebrationType: CelebrationType.GlobalHoliday,
    description: "Happy Hanukkah! Eight nights of badges.",
    gradient: ["#1e3a5f", "#60a5fa"],
  },
];

// ── SVG generator ─────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function generateHolidaySVG(tpl: HolidayDropTemplate, year: number): string {
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
        font-family="system-ui,sans-serif" font-weight="700">${esc(tpl.name)}</text>
  <text x="200" y="346" font-size="14" fill="rgba(255,255,255,0.55)" text-anchor="middle"
        font-family="system-ui,sans-serif">${year} · 🎈 balloon</text>
</svg>`;
}

export function holidayTemplateToFile(tpl: HolidayDropTemplate, year: number): File {
  const svg  = generateHolidaySVG(tpl, year);
  const blob = new Blob([svg], { type: "image/svg+xml" });
  return new File([blob], `${tpl.id}-${year}.svg`, { type: "image/svg+xml" });
}
