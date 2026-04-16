/**
 * BalloonLogo — "balloon" wordmark where the first 'o' is a 3D balloon.
 * Uses getComputedTextLength() after mount so the balloon is always flush
 * with the "ball" text regardless of how the browser renders the font.
 */
import { useRef, useEffect, useState } from "react";

export function BalloonLogo({ className = "" }: { className?: string }) {
  const ballRef = useRef<SVGTextElement>(null);
  // cx = center of balloon; initialised to a sensible default so SSR / first
  // paint looks reasonable before the effect fires.
  const [cx, setCx] = useState(110);

  useEffect(() => {
    if (ballRef.current) {
      const w = ballRef.current.getComputedTextLength();
      // x-start (2) + text width + balloon radius (19) + 1px visual gap
      setCx(Math.round(2 + w + 19 + 1));
    }
  }, []);

  const onX  = cx + 19 + 2;   // balloon right edge + small gap
  const FONT = "'Inter', 'system-ui', sans-serif";

  return (
    <svg
      viewBox="0 0 215 68"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="balloon"
      className={className}
      fill="none"
    >
      <defs>
        <radialGradient id="bal-grad" cx="36%" cy="30%" r="65%" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor="#C9B0E8" />
          <stop offset="45%"  stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#5B2FA0" />
        </radialGradient>
      </defs>

      {/* "ball" — measured after mount to place balloon correctly */}
      <text
        ref={ballRef}
        x="2"
        y="46"
        fontFamily={FONT}
        fontWeight="800"
        fontSize="46"
        fill="#F5E2C0"
        letterSpacing="-1"
      >
        ball
      </text>

      {/* 3D balloon sphere */}
      <circle cx={cx} cy="26" r="19" fill="url(#bal-grad)" />
      {/* Soft highlight — upper-left */}
      <ellipse cx={cx - 6} cy="19" rx="6" ry="5" fill="white" fillOpacity="0.22" />

      {/* Knot */}
      <path
        d={`M${cx - 2.5} 44.5 Q${cx} 48 ${cx + 2.5} 44.5`}
        stroke="#E8D5B7"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx={cx} cy="46.5" r="1.8" fill="#D4B896" />

      {/* String — curls down and to the left */}
      <path
        d={`M${cx} 48.5 C${cx - 1} 52 ${cx - 6} 55 ${cx - 11} 61`}
        stroke="#E8D5B7"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />

      {/* "on" */}
      <text
        x={onX}
        y="46"
        fontFamily={FONT}
        fontWeight="800"
        fontSize="46"
        fill="#F5E2C0"
        letterSpacing="-1"
      >
        on
      </text>
    </svg>
  );
}
