/**
 * BalloonLogo — "BALLOON" wordmark as individual sprite letters.
 *
 * The sprite cells are 1:3 (wide:tall), so we render at a larger spriteHeight
 * to get readable letter widths, then clip each letter to displayHeight so only
 * the balloon body (top portion) shows — not the knot/string below it.
 * Each letter floats with a staggered delay for a wave effect.
 */
import { BalloonLetter } from "@/components/BalloonName";

interface BalloonLogoProps {
  className?: string;
  /**
   * Visible display height in px. Sprite is rendered 2× taller internally
   * for better letter width, then clipped. Default: 40.
   */
  displayHeight?: number;
  compact?: boolean;
}

export function BalloonLogo({ className = "", displayHeight = 40, compact = false }: BalloonLogoProps) {
  const text = compact ? "B" : "BALLOON";
  // Render sprite taller so each letter is ~⅔ as wide as it is tall (more readable)
  const spriteHeight = displayHeight * 2.2;

  return (
    <span
      role="img"
      aria-label="balloon"
      className={`inline-flex items-center flex-nowrap gap-px ${className}`}
    >
      {text.split("").map((char, i) => (
        <span
          key={i}
          className="animate-float-logo"
          style={{
            animationDelay: `${i * 0.18}s`,
            // Clip each letter to displayHeight; shows the balloon body, hides the string
            display: "inline-block",
            height: displayHeight,
            overflow: "hidden",
            verticalAlign: "top",
          }}
        >
          <BalloonLetter letter={char} height={spriteHeight} />
        </span>
      ))}
    </span>
  );
}
