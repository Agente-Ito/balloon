import type { Address } from "@/types";

export const LUKSO_MAINNET_CHAIN_ID = 42;
export const LUKSO_TESTNET_CHAIN_ID = 4201;

interface NetworkAddresses {
  celebrationsBadge: Address;
  greetingCard: Address;
  celebrationsDelegate: Address;
  dropBadge: Address;
  celebrationsDrop: Address;
  celebrationRegistry: Address;
}

const TESTNET_ADDRESSES: NetworkAddresses = {
  celebrationsBadge: (import.meta.env.VITE_CELEBRATIONS_BADGE_ADDRESS ?? "0x0000000000000000000000000000000000000000") as Address,
  greetingCard: (import.meta.env.VITE_GREETING_CARD_ADDRESS ?? "0x0000000000000000000000000000000000000000") as Address,
  celebrationsDelegate: (import.meta.env.VITE_CELEBRATIONS_DELEGATE_ADDRESS ?? "0x0000000000000000000000000000000000000000") as Address,
  dropBadge: (import.meta.env.VITE_DROP_BADGE_ADDRESS ?? "0x0000000000000000000000000000000000000000") as Address,
  celebrationsDrop: (import.meta.env.VITE_CELEBRATIONS_DROP_ADDRESS ?? "0x0000000000000000000000000000000000000000") as Address,
  celebrationRegistry: (import.meta.env.VITE_CELEBRATION_REGISTRY_ADDRESS ?? "0x0000000000000000000000000000000000000000") as Address,
};

// Mainnet addresses (populated after mainnet deploy)
const MAINNET_ADDRESSES: NetworkAddresses = {
  celebrationsBadge: "0x0000000000000000000000000000000000000000",
  greetingCard: "0x0000000000000000000000000000000000000000",
  celebrationsDelegate: "0x0000000000000000000000000000000000000000",
  dropBadge: "0x0000000000000000000000000000000000000000",
  celebrationsDrop: "0x0000000000000000000000000000000000000000",
  celebrationRegistry: "0x0000000000000000000000000000000000000000",
};

export function getAddresses(chainId: number): NetworkAddresses {
  if (chainId === LUKSO_MAINNET_CHAIN_ID) return MAINNET_ADDRESSES;
  return TESTNET_ADDRESSES;
}

export const LUKSO_TESTNET_RPC = "https://rpc.testnet.lukso.network";
export const LUKSO_MAINNET_RPC = "https://rpc.lukso.network";

// LSP1 URD registration key (well-known, from @lukso/lsp1-contracts)
export const LSP1_URD_KEY =
  "0x0cfc51aec37c55a4d0b1a65c6255c4bf2fbad1f2a2b6eb54ee6ec93af21b19af" as const;
