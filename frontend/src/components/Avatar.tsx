import { useLSP3Avatar } from "@/hooks/useLSP3Avatar";
import type { Address } from "@/types";

interface AvatarProps {
  address: Address | null;
  size?: number;
  className?: string;
  /** When provided, loads the real LSP3 profile image from the UP. */
  chainId?: number;
}

export function Avatar({ address, size = 40, className = "", chainId }: AvatarProps) {
  const { data: imageUrl } = useLSP3Avatar(address, chainId);

  if (!address) return <GradientAvatar address="0x0000" size={size} className={className} />;

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        style={{ width: size, height: size }}
        className={`rounded-full object-cover flex-shrink-0 ${className}`}
        onError={() => {/* silent — hook will return undefined on retry failure */}}
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
      className={`rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${className}`}
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
