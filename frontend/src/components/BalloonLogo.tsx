interface BalloonLogoProps {
  className?: string;
  /** Visible display height in px. Width scales automatically. Default: 40. */
  displayHeight?: number;
  compact?: boolean;
}

export function BalloonLogo({ className = "", displayHeight = 40 }: BalloonLogoProps) {
  // Aspect ratio of the PNG: 2048 × 1519 → ~1.349
  const width = Math.round(displayHeight * (2048 / 1519));

  return (
    <img
      src="/balloon-logo.png"
      alt="balloon"
      className={`animate-float-logo flex-shrink-0 ${className}`}
      style={{ height: displayHeight, width }}
    />
  );
}
