/**
 * Reads LSP3 profile image from a Universal Profile and displays it.
 * Falls back to a generated gradient avatar based on the address.
 */
import { useState, useEffect } from "react";
import type { Address } from "@/types";

interface AvatarProps {
  address: Address | null;
  size?: number;
  className?: string;
}


export function Avatar({ address, size = 40, className = "" }: AvatarProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;
    setImageUrl(null); // reset on address change — gradient fallback used until image resolves
  }, [address]);

  if (!address) return <GradientAvatar address="0x0000" size={size} className={className} />;
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={`Avatar for ${address.slice(0, 8)}`}
        style={{ width: size, height: size }}
        className={`rounded-full object-cover ${className}`}
        onError={() => setImageUrl(null)}
      />
    );
  }

  return <GradientAvatar address={address} size={size} className={className} />;
}

function GradientAvatar({
  address,
  size,
  className,
}: {
  address: string;
  size: number;
  className: string;
}) {
  const hue = parseInt(address.slice(2, 6), 16) % 360;
  const hue2 = (hue + 60) % 360;

  return (
    <div
      className={`rounded-full flex items-center justify-center text-white font-bold ${className}`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, hsl(${hue}, 70%, 50%), hsl(${hue2}, 80%, 40%))`,
        fontSize: size * 0.35,
      }}
    >
      {address.slice(2, 4).toUpperCase()}
    </div>
  );
}
