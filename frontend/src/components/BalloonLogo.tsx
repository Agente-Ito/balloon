/**
 * BalloonLogo — "BALLOON" wordmark rendered as foil balloon letter sprites.
 * Uses BalloonName so there is no background image to fight — letters float
 * transparently over whatever surface they sit on.
 */
import { BalloonName } from "@/components/BalloonName";

interface BalloonLogoProps {
  className?: string;
  /**
   * Letter height in px. Controls overall size.
   * The full wordmark will be roughly 3× this value wide.
   * Default: 36 (matches avatar height in the grid header).
   */
  letterHeight?: number;
  /** Compact: show only the single "B" letter. */
  compact?: boolean;
}

export function BalloonLogo({ className = "", letterHeight = 36, compact = false }: BalloonLogoProps) {
  const text = compact ? "B" : "BALLOON";

  return (
    <span
      aria-label="balloon"
      className={`inline-flex items-end animate-float-logo ${className}`}
    >
      <BalloonName name={text} letterHeight={letterHeight} />
    </span>
  );
}
