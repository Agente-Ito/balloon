/**
 * BalloonLogo — the "balloon" wordmark SVG matching the brand logo.
 * The first 'o' in "balloon" is replaced by a 3D balloon illustration.
 */
export function BalloonLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 210 68"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="balloon"
      className={className}
      fill="none"
    >
      <defs>
        {/* 3D balloon gradient: light lavender top-left → rich purple bottom-right */}
        <radialGradient id="bal-grad" cx="36%" cy="30%" r="65%" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor="#C9B0E8" />
          <stop offset="45%"  stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#5B2FA0" />
        </radialGradient>
      </defs>

      {/* ── "ball" ── */}
      <text
        x="2"
        y="46"
        fontFamily="'Inter', 'system-ui', sans-serif"
        fontWeight="800"
        fontSize="46"
        fill="#F5E2C0"
        letterSpacing="-1"
      >
        ball
      </text>

      {/* ── Balloon sphere replacing first 'o' ── */}
      <circle cx="127" cy="26" r="19" fill="url(#bal-grad)" />

      {/* Soft highlight — upper-left area */}
      <ellipse cx="121" cy="19" rx="6" ry="5" fill="white" fillOpacity="0.22" />

      {/* Knot at bottom of balloon */}
      <path
        d="M124.5 44.5 Q127 48 129.5 44.5"
        stroke="#E8D5B7"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      {/* Knot tie dot */}
      <circle cx="127" cy="46.5" r="1.8" fill="#D4B896" />

      {/* String — curls naturally down and to the left */}
      <path
        d="M127 48.5 C126 52 121 55 116 61"
        stroke="#E8D5B7"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />

      {/* ── "on" ── */}
      <text
        x="148"
        y="46"
        fontFamily="'Inter', 'system-ui', sans-serif"
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
