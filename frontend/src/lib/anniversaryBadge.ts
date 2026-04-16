/**
 * Generates an SVG anniversary badge for UP milestones.
 * The year number is rendered large so it changes with every annual drop,
 * giving collectors a distinct NFT for each year on LUKSO.
 */

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function generateAnniversarySVG(years: number, upName?: string): string {
  // Scale font size: single digit fits bigger
  const numSize  = years > 9 ? 128 : 150;
  const subtitle = upName ? esc(upName.slice(0, 22)) : "on LUKSO";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  <defs>
    <radialGradient id="bg" cx="45%" cy="35%" r="70%">
      <stop offset="0%"   stop-color="#a78bfa"/>
      <stop offset="55%"  stop-color="#7c3aed"/>
      <stop offset="100%" stop-color="#3b0764"/>
    </radialGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="10" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="shadow">
      <feDropShadow dx="0" dy="3" stdDeviation="7" flood-color="rgba(0,0,0,0.45)"/>
    </filter>
  </defs>

  <!-- Background circle -->
  <circle cx="200" cy="200" r="200" fill="url(#bg)"/>
  <!-- Inner decorative ring -->
  <circle cx="200" cy="200" r="183" fill="none"
          stroke="rgba(255,255,255,0.12)" stroke-width="1.5"/>

  <!-- Decorative stars -->
  <text x="58"  y="82"  font-size="20" text-anchor="middle" opacity="0.55">✦</text>
  <text x="342" y="74"  font-size="15" text-anchor="middle" opacity="0.40">✦</text>
  <text x="48"  y="328" font-size="14" text-anchor="middle" opacity="0.30">✦</text>
  <text x="352" y="312" font-size="18" text-anchor="middle" opacity="0.45">✦</text>

  <!-- "YEAR(S)" top label -->
  <text x="200" y="88" font-size="22" text-anchor="middle" dominant-baseline="middle"
        font-family="system-ui,sans-serif" fill="rgba(255,255,255,0.75)"
        letter-spacing="5" font-weight="600">YEAR${years !== 1 ? "S" : ""}</text>

  <!-- Large year number (the main visual) -->
  <text x="200" y="218" font-size="${numSize}" text-anchor="middle" dominant-baseline="middle"
        font-family="Georgia,Times New Roman,serif" fill="white" font-weight="bold"
        filter="url(#shadow)">${years}</text>

  <!-- Bottom pill -->
  <rect x="55" y="300" width="290" height="58" rx="15" fill="rgba(0,0,0,0.32)"/>
  <text x="200" y="322" font-size="17" text-anchor="middle" dominant-baseline="middle"
        font-family="system-ui,sans-serif" fill="rgba(255,255,255,0.92)"
        font-weight="600">${subtitle}</text>
  <text x="200" y="344" font-size="12" text-anchor="middle" dominant-baseline="middle"
        font-family="system-ui,sans-serif" fill="rgba(255,255,255,0.45)">
    🎈 balloon · UP Anniversary
  </text>
</svg>`;
}

/** Convert the anniversary SVG into a File object ready for IPFS upload. */
export function anniversarySVGToFile(years: number, upName?: string): File {
  const svg  = generateAnniversarySVG(years, upName);
  const blob = new Blob([svg], { type: "image/svg+xml" });
  return new File([blob], `up-anniversary-year-${years}.svg`, { type: "image/svg+xml" });
}
