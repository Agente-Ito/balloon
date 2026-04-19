/**
 * BalloonLogo — the "balloon" wordmark.
 * Shows the balloon-wordmark image asset (purple foil balloon letters on cream).
 * Falls back to the SVG wordmark if the image fails to load.
 */
import { useState, useRef, useEffect } from "react";

interface BalloonLogoProps {
  className?: string;
  /** Height in px. Width auto-scales. Default: 40 */
  height?: number;
  /** Force compact mode (show only the B balloon). Auto-detects by default via CSS. */
  compact?: boolean;
}

export function BalloonLogo({ className = "", height = 40, compact = false }: BalloonLogoProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const [bFailed, setBFailed] = useState(false);
  const ballRef = useRef<SVGTextElement>(null);
  const [cx, setCx] = useState(110);

  useEffect(() => {
    if (!imgFailed || !ballRef.current) return;
    const w = ballRef.current.getComputedTextLength();
    setCx(Math.round(2 + w + 19 + 1));
  }, [imgFailed]);

  // Compact mode: show only the "B" balloon image
  if (compact) {
    if (!bFailed) {
      return (
        <img
          src="/balloon-b.jpeg"
          alt="balloon"
          style={{ height, width: "auto", objectFit: "contain" }}
          className={`rounded-sm ${className}`}
          onError={() => setBFailed(true)}
          draggable={false}
        />
      );
    }
    // Fallback: foil SVG balloon icon
    return (
      <svg width={height} height={height} viewBox="0 0 40 56" fill="none" className={className}>
        <defs>
          <radialGradient id="bl-foil" cx="35%" cy="28%" r="65%">
            <stop offset="0%" stopColor="#C9A8F0" />
            <stop offset="40%" stopColor="#9C4EDB" />
            <stop offset="100%" stopColor="#6A1B9A" />
          </radialGradient>
        </defs>
        <ellipse cx="20" cy="18" rx="15" ry="17" fill="url(#bl-foil)" />
        <ellipse cx="13" cy="11" rx="5" ry="6" fill="white" opacity="0.28" />
        <path d="M17.5 35 Q20 39.5 22.5 35" stroke="#9C4EDB" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <path d="M20 38 Q23 45 17 54" stroke="#9C4EDB" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.6" />
      </svg>
    );
  }

  // Full wordmark
  if (!imgFailed) {
    return (
      <img
        src="/balloon-wordmark.jpeg"
        alt="balloon"
        style={{ height, width: "auto", objectFit: "contain" }}
        className={className}
        onError={() => setImgFailed(true)}
        draggable={false}
      />
    );
  }

  // SVG fallback with light-mode palette
  const onX = cx + 19 + 2;
  const FONT = "'Inter', 'system-ui', sans-serif";

  return (
    <svg
      viewBox="0 0 215 68"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="balloon"
      className={className}
      style={{ height, width: "auto" }}
      fill="none"
    >
      <defs>
        <radialGradient id="bal-grad" cx="36%" cy="30%" r="65%" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor="#C9B0E8" />
          <stop offset="45%"  stopColor="#9C4EDB" />
          <stop offset="100%" stopColor="#6A1B9A" />
        </radialGradient>
      </defs>

      <text
        ref={ballRef}
        x="2" y="46"
        fontFamily={FONT}
        fontWeight="800"
        fontSize="46"
        fill="#6A1B9A"
        letterSpacing="-1"
      >
        ball
      </text>

      <circle cx={cx} cy="26" r="19" fill="url(#bal-grad)" />
      <ellipse cx={cx - 6} cy="19" rx="6" ry="5" fill="white" fillOpacity="0.32" />

      <path
        d={`M${cx - 2.5} 44.5 Q${cx} 48 ${cx + 2.5} 44.5`}
        stroke="#6A1B9A" strokeWidth="1.8" strokeLinecap="round" fill="none"
      />
      <circle cx={cx} cy="46.5" r="1.8" fill="#9C4EDB" />

      <path
        d={`M${cx} 48.5 C${cx - 1} 52 ${cx - 6} 55 ${cx - 11} 61`}
        stroke="#9C4EDB" strokeWidth="1.4" strokeLinecap="round" fill="none"
      />

      <text
        x={onX} y="46"
        fontFamily={FONT}
        fontWeight="800"
        fontSize="46"
        fill="#6A1B9A"
        letterSpacing="-1"
      >
        on
      </text>
    </svg>
  );
}
