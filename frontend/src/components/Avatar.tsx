import { useLSP3Avatar } from "@/hooks/useLSP3Avatar";
import { BalloonLetter, LETTER_MAP } from "@/components/BalloonName";
import type { Address } from "@/types";

interface AvatarProps {
  address: Address | null;
  size?: number;
  className?: string;
  chainId?: number;
  /** Pre-resolved image URL — skips the internal fetch when provided */
  imageUrl?: string;
  /** Profile name — used as initials fallback when no image is available */
  name?: string;
}

export function Avatar({ address, size = 40, className = "", chainId, imageUrl, name }: AvatarProps) {
  // Only run the internal fetch when a pre-resolved imageUrl is NOT provided
  const { data: fetchedUrl } = useLSP3Avatar(imageUrl ? null : address, chainId);
  const resolvedUrl = imageUrl ?? fetchedUrl;

  if (!address && !resolvedUrl) {
    return <GradientAvatar address="0x0000" size={size} className={className} />;
  }

  if (resolvedUrl) {
    return (
      <img
        src={resolvedUrl}
        alt={name ?? ""}
        style={{ width: size, height: size }}
        className={`rounded-full object-cover flex-shrink-0 ${className}`}
        onError={() => {/* silent */}}
      />
    );
  }

  return (
    <GradientAvatar
      address={address ?? "0x0000"}
      size={size}
      className={className}
      name={name}
    />
  );
}

function GradientAvatar({
  address,
  size,
  className,
  name,
}: {
  address: string;
  size: number;
  className: string;
  name?: string;
}) {
  const hue = parseInt(address.slice(2, 6), 16) % 360;
  const hue2 = (hue + 60) % 360;

  const firstLetter = name?.trim()[0]?.toUpperCase() ?? "";
  const hasBalloonLetter = !!firstLetter && !!LETTER_MAP[firstLetter];

  // Scale letter so its width ≈ 80% of avatar diameter; the circle clips top/bottom
  const letterHeight = size * 2.5;

  const initials = name
    ? name.trim().split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join("")
    : address.slice(2, 4).toUpperCase();

  return (
    <div
      className={`rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${className}`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, hsl(${hue}, 70%, 50%), hsl(${hue2}, 80%, 40%))`,
        position: "relative",
      }}
    >
      {hasBalloonLetter ? (
        // absolute + left 50% + translateX(-50%) = true horizontal center inside the circle
        <div style={{
          position: "absolute",
          top: -(letterHeight * 0.15),
          left: "50%",
          transform: "translateX(-50%)",
        }}>
          <BalloonLetter letter={firstLetter} height={letterHeight} />
        </div>
      ) : (
        <span
          className="avatar-initials font-bold"
          style={{ fontSize: size * 0.35 }}
        >
          {initials}
        </span>
      )}
    </div>
  );
}
