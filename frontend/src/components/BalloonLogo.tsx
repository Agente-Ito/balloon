/**
 * BalloonLogo — the "balloon" wordmark SVG matching the brand logo.
 * The second 'o' in "balloon" is replaced by the balloon illustration.
 */
export function BalloonLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 60"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="balloon"
      className={className}
      fill="none"
    >
      <defs>
        <radialGradient id="balloon-grad" cx="45%" cy="38%" r="58%">
          <stop offset="0%" stopColor="#D4BAEE" />
          <stop offset="100%" stopColor="#8B50C4" />
        </radialGradient>
      </defs>

      {/* "ball" */}
      <text
        x="2"
        y="46"
        fontFamily="'Inter', 'system-ui', sans-serif"
        fontWeight="700"
        fontSize="46"
        fill="#F5E2C0"
        letterSpacing="-1"
      >
        ball
      </text>

      {/* balloon circle replacing first 'o' */}
      <circle cx="143" cy="26" r="18" fill="url(#balloon-grad)" />
      {/* string */}
      <path
        d="M143 44 Q139 52 136 58"
        stroke="#C9B0E8"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* "on" */}
      <text
        x="163"
        y="46"
        fontFamily="'Inter', 'system-ui', sans-serif"
        fontWeight="700"
        fontSize="46"
        fill="#F5E2C0"
        letterSpacing="-1"
      >
        on
      </text>
    </svg>
  );
}
