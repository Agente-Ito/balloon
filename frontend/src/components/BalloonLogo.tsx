/**
 * BalloonLogo — "BALLOON" wordmark as individual sprite letters.
 * Each letter floats independently with a staggered delay → wave effect.
 * No background image, no wrapping issues.
 */
import { BalloonLetter } from "@/components/BalloonName";

interface BalloonLogoProps {
  className?: string;
  letterHeight?: number;
  compact?: boolean;
}

export function BalloonLogo({ className = "", letterHeight = 36, compact = false }: BalloonLogoProps) {
  const text = compact ? "B" : "BALLOON";

  return (
    <span
      role="img"
      aria-label="balloon"
      className={`inline-flex items-end flex-nowrap gap-px ${className}`}
    >
      {text.split("").map((char, i) => (
        <span
          key={i}
          className="animate-float-logo"
          style={{ animationDelay: `${i * 0.2}s` }}
        >
          <BalloonLetter letter={char} height={letterHeight} />
        </span>
      ))}
    </span>
  );
}
