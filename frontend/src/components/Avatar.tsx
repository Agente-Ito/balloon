import { useLSP3Avatar } from "@/hooks/useLSP3Avatar";
import { useLSP3Name } from "@/hooks/useLSP3Name";
import { useEffect, useState } from "react";
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
    return <GradientAvatar address="0x0000" size={size} className={className} />;
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
    <GradientAvatar
      address={address ?? "0x0000"}
      size={size}
      className={className}
      name={resolvedName}
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

  const initials = name
    ? name.trim().charAt(0).toUpperCase()
    : (address.startsWith("0x") ? address.slice(2, 4).toUpperCase() : "??");

  return (
    <div
      className={`rounded-full flex items-center justify-center flex-shrink-0 avatar-initials font-bold ${className}`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, hsl(${hue}, 70%, 50%), hsl(${hue2}, 80%, 40%))`,
        fontSize: size * 0.38,
      }}
    >
      {initials}
    </div>
  );
}
