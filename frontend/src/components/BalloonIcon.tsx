/**
 * BalloonIcon — metallic foil balloon SVG logo mark.
 */
interface BalloonIconProps {
  size?: number;
  color?: string;
  className?: string;
  /** Use foil gradient instead of solid color */
  foil?: boolean;
}

export function BalloonIcon({
  size = 32,
  color = "#6A1B9A",
  className,
  foil = false,
}: BalloonIconProps) {
  const gradId = `foil-${size}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {foil && (
        <defs>
          <radialGradient id={gradId} cx="35%" cy="28%" r="65%" gradientUnits="objectBoundingBox">
            <stop offset="0%"   stopColor="#C9A8F0" />
            <stop offset="40%"  stopColor="#9C4EDB" />
            <stop offset="100%" stopColor="#6A1B9A" />
          </radialGradient>
        </defs>
      )}

      {/* Balloon body */}
      <ellipse cx="20" cy="18" rx="15" ry="17" fill={foil ? `url(#${gradId})` : color} />

      {/* Foil highlight */}
      <ellipse cx="13" cy="11" rx="5" ry="6" fill="white" opacity={foil ? "0.28" : "0.22"} />
      {foil && (
        <ellipse cx="10" cy="9" rx="2.5" ry="3" fill="white" opacity="0.18" />
      )}

      {/* Knot */}
      <path
        d="M17.5 35 Q20 39.5 22.5 35"
        stroke={foil ? "#9C4EDB" : color}
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />

      {/* String */}
      <path
        d="M20 38 Q23 45 17 54"
        stroke={foil ? "#9C4EDB" : color}
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
    </svg>
  );
}
