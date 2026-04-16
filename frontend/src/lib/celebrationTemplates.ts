/**
 * Built-in SVG celebration card templates.
 * Generated at runtime — no static files needed, no pre-uploading to IPFS.
 */

export interface CelebrationTemplate {
  id: string;
  label: string;
  emoji: string;
  gradient: [string, string];
}

export const CELEBRATION_TEMPLATES: CelebrationTemplate[] = [
  { id: "birthday",    label: "Birthday",    emoji: "🎂", gradient: ["#ec4899", "#9333ea"] },
  { id: "anniversary", label: "Anniversary", emoji: "💫", gradient: ["#f59e0b", "#f97316"] },
  { id: "holiday",     label: "Holiday",     emoji: "🎉", gradient: ["#22c55e", "#14b8a6"] },
  { id: "graduation",  label: "Graduation",  emoji: "🎓", gradient: ["#3b82f6", "#6366f1"] },
  { id: "celebration", label: "Celebration", emoji: "🥂", gradient: ["#8b5cf6", "#ec4899"] },
  { id: "milestone",   label: "Milestone",   emoji: "⭐", gradient: ["#f59e0b", "#ef4444"] },
];

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function generateTemplateSVG(tpl: CelebrationTemplate, title: string): string {
  const [c1, c2] = tpl.gradient;
  const safeTitle = escapeXml(title.slice(0, 28));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="rgba(0,0,0,0.3)"/>
    </filter>
  </defs>
  <rect width="400" height="400" fill="url(#g)" rx="24"/>
  <rect x="16" y="16" width="368" height="368" rx="16" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
  <text x="200" y="190" font-size="110" text-anchor="middle" dominant-baseline="middle" filter="url(#shadow)">${tpl.emoji}</text>
  <rect x="40" y="296" width="320" height="72" rx="12" fill="rgba(0,0,0,0.25)"/>
  <text x="200" y="327" font-size="22" fill="white" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="700">${safeTitle !== "" ? safeTitle : escapeXml(tpl.label)}</text>
  <text x="200" y="354" font-size="14" fill="rgba(255,255,255,0.65)" text-anchor="middle" font-family="system-ui,sans-serif">${escapeXml(tpl.label)}</text>
</svg>`;
}

/** Convert a template + title into a File ready to pass to uploadFileToIPFS. */
export function templateToFile(tpl: CelebrationTemplate, title: string): File {
  const svg = generateTemplateSVG(tpl, title);
  const blob = new Blob([svg], { type: "image/svg+xml" });
  return new File([blob], `${tpl.id}-template.svg`, { type: "image/svg+xml" });
}
