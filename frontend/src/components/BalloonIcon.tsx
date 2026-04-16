/**
 * BalloonIcon — the Balloon app's SVG logo mark.
 * A clean, minimal balloon with knot, string, and soft shine.
 */
interface BalloonIconProps {
  size?: number;
  color?: string;
  className?: string;
}

export function BalloonIcon({ size = 32, color = "currentColor", className }: BalloonIconProps) {
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
      {/* Balloon body */}
      <ellipse cx="20" cy="18" rx="15" ry="17" fill={color} />

      {/* Shine highlight */}
      <ellipse cx="13" cy="11" rx="4.5" ry="5.5" fill="white" opacity="0.22" />

      {/* Knot */}
      <path
        d="M17.5 35 Q20 39.5 22.5 35"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />

      {/* String */}
      <path
        d="M20 38 Q23 45 17 54"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.55"
      />
    </svg>
  );
}
