interface BalloonIconProps {
  size?: number;
  className?: string;
  /** Optional tint color; applied via hue rotation to the base balloon image. */
  color?: string;
  foil?: boolean;
}

function hexToHue(hex: string): number | null {
  const clean = hex.replace("#", "").trim();
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;

  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 0;

  let h = 0;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;

  return (h * 60 + 360) % 360;
}

export function BalloonIcon({ size = 32, className, color, foil = false }: BalloonIconProps) {
  // Aspect ratio of balloon-b.png: 2048 × 1519 → ~1.349 wide:tall
  const width = Math.round(size * (2048 / 1519));
  const BASE_HUE = 287;

  let filter = "";
  const hue = color ? hexToHue(color) : null;
  if (hue !== null) {
    const rotate = Math.round(hue - BASE_HUE);
    filter = `hue-rotate(${rotate}deg) saturate(1.38) brightness(1.04)`;
  }

  if (foil) {
    filter = `${filter} drop-shadow(0 2px 6px rgba(0,0,0,0.18))`.trim();
  }

  return (
    <img
      src="/balloon-b.png"
      alt=""
      aria-hidden="true"
      style={{ height: size, width, filter }}
      className={className}
    />
  );
}
