import { useLSP3Avatar } from "@/hooks/useLSP3Avatar";
import { useLSP3Name } from "@/hooks/useLSP3Name";
import { useEffect, useMemo, useState } from "react";
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
  const effectiveChainId = chainId ?? 4201;
  // Only run the internal fetch when a pre-resolved imageUrl is NOT provided
  const { data: fetchedUrl } = useLSP3Avatar(imageUrl ? null : address, effectiveChainId);
  const { data: fetchedName } = useLSP3Name(name ? null : address, effectiveChainId);
  const resolvedUrl = imageUrl ?? fetchedUrl;
  const resolvedName = name?.trim() || fetchedName?.trim();
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [resolvedUrl]);

  if (!address && !resolvedUrl) {
    return <IdenticonAvatar address="0x0000" size={size} className={className} />;
  }

  if (resolvedUrl && !imageFailed) {
    return (
      <img
        src={resolvedUrl}
        alt={resolvedName ?? ""}
        style={{ width: size, height: size }}
        className={`rounded-full object-cover flex-shrink-0 ${className}`}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <IdenticonAvatar
      address={address ?? "0x0000"}
      size={size}
      className={className}
      name={resolvedName}
    />
  );
}

function IdenticonAvatar({
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
  const cleanAddress = address.startsWith("0x") ? address.slice(2) : address;
  const seed = cleanAddress.padEnd(40, "0").slice(0, 40);

  const hueA = parseInt(seed.slice(0, 4), 16) % 360;
  const hueB = parseInt(seed.slice(8, 12), 16) % 360;
  const hueC = parseInt(seed.slice(16, 20), 16) % 360;

  const angleA = parseInt(seed.slice(4, 8), 16) % 360;
  const angleB = parseInt(seed.slice(12, 16), 16) % 360;
  const angleC = parseInt(seed.slice(20, 24), 16) % 360;

  const cxA = 20 + (parseInt(seed.slice(24, 26), 16) % 61);
  const cyA = 20 + (parseInt(seed.slice(26, 28), 16) % 61);
  const cxB = 20 + (parseInt(seed.slice(28, 30), 16) % 61);
  const cyB = 20 + (parseInt(seed.slice(30, 32), 16) % 61);
  const rA = 18 + (parseInt(seed.slice(32, 34), 16) % 16);
  const rB = 14 + (parseInt(seed.slice(34, 36), 16) % 14);

  const initials = name ? name.trim().charAt(0).toUpperCase() : "";
  const overlayId = useMemo(() => `identicon-${seed.slice(0, 10)}-${size}`, [seed, size]);

  return (
    <div className={`relative rounded-full overflow-hidden flex-shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        role="img"
        aria-label="profile identicon"
      >
        <defs>
          <clipPath id={`${overlayId}-clip`}>
            <circle cx="50" cy="50" r="50" />
          </clipPath>
          <linearGradient id={`${overlayId}-bg`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={`hsl(${hueA}, 72%, 52%)`} />
            <stop offset="100%" stopColor={`hsl(${hueB}, 68%, 42%)`} />
          </linearGradient>
        </defs>

        <g clipPath={`url(#${overlayId}-clip)`}>
          <rect x="0" y="0" width="100" height="100" fill={`url(#${overlayId}-bg)`} />

          <rect
            x="-20"
            y="18"
            width="140"
            height="22"
            fill={`hsla(${hueC}, 70%, 78%, 0.45)`}
            transform={`rotate(${angleA} 50 50)`}
          />
          <rect
            x="-20"
            y="56"
            width="140"
            height="18"
            fill={`hsla(${(hueB + 30) % 360}, 66%, 80%, 0.35)`}
            transform={`rotate(${angleB} 50 50)`}
          />

          <circle cx={cxA} cy={cyA} r={rA} fill={`hsla(${(hueA + 40) % 360}, 84%, 86%, 0.5)`} />
          <circle cx={cxB} cy={cyB} r={rB} fill={`hsla(${(hueC + 70) % 360}, 78%, 84%, 0.44)`} />

          <rect
            x="24"
            y="24"
            width="52"
            height="52"
            rx="14"
            fill="none"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="5"
            transform={`rotate(${angleC} 50 50)`}
          />
        </g>
      </svg>

      {initials ? (
        <span
          className="absolute inset-0 flex items-center justify-center avatar-initials font-bold text-white/95"
          style={{
            fontSize: size * 0.4,
            textShadow: "0 1px 2px rgba(0,0,0,0.25)",
          }}
        >
          {initials}
        </span>
      ) : null}
    </div>
  );
}
