interface BalloonIconProps {
  size?: number;
  className?: string;
  /** kept for API compatibility — unused (image has its own color) */
  color?: string;
  foil?: boolean;
}

export function BalloonIcon({ size = 32, className }: BalloonIconProps) {
  // Aspect ratio of balloon-b.png: 2048 × 1519 → ~1.349 wide:tall
  const width = Math.round(size * (2048 / 1519));

  return (
    <img
      src="/balloon-b.png"
      alt=""
      aria-hidden="true"
      style={{ height: size, width }}
      className={className}
    />
  );
}
