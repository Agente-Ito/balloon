import { LUKSO_MAINNET_CHAIN_ID } from "@/constants/addresses";

interface NetworkBadgeProps {
  chainId: number;
}

export function NetworkBadge({ chainId }: NetworkBadgeProps) {
  const isMainnet = chainId === LUKSO_MAINNET_CHAIN_ID;

  return (
    <span
      className={`badge ${isMainnet ? "bg-amber-500/20 text-amber-300" : "bg-yellow-500/20 text-yellow-400"}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {isMainnet ? "LUKSO" : "Testnet"}
    </span>
  );
}
