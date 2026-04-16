/**
 * ContractsProvider — makes typed contract references available to the entire app
 * via React context. Consumers use `useContracts()` to get pre-configured viem
 * contract instances without re-creating them on every render.
 */
import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { PublicClient, WalletClient } from "viem";
import { getAddresses } from "@/constants/addresses";

// ── ABI fragments (minimal — only functions called by the frontend) ────────────

const BADGE_ABI = [
  {
    name: "mintBadge",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "celebrationType", type: "uint8" },
      { name: "year", type: "uint16" },
      { name: "soulbound", type: "bool" },
      { name: "metadataBytes", type: "bytes" },
      { name: "force", type: "bool" },
    ],
    outputs: [{ name: "tokenId", type: "bytes32" }],
  },
  {
    name: "badgeExists",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "celebrationType", type: "uint8" },
      { name: "year", type: "uint16" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

const GREETING_CARD_ABI = [
  {
    name: "mintCard",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "celebrationType", type: "uint8" },
      { name: "metadataBytes", type: "bytes" },
      { name: "force", type: "bool" },
    ],
    outputs: [{ name: "tokenId", type: "bytes32" }],
  },
  {
    name: "nextAllowedAt",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "sender", type: "address" },
      { name: "recipient", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

// ── Context value ─────────────────────────────────────────────────────────────

interface ContractsContextValue {
  addresses: ReturnType<typeof getAddresses>;
  badgeAbi: typeof BADGE_ABI;
  greetingCardAbi: typeof GREETING_CARD_ABI;
  walletClient: WalletClient | null;
  publicClient: PublicClient;
}

const ContractsContext = createContext<ContractsContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

interface ContractsProviderProps {
  children: ReactNode;
  walletClient: WalletClient | null;
  publicClient: PublicClient;
  chainId: number;
}

export function ContractsProvider({
  children,
  walletClient,
  publicClient,
  chainId,
}: ContractsProviderProps) {
  const value = useMemo<ContractsContextValue>(
    () => ({
      addresses:       getAddresses(chainId),
      badgeAbi:        BADGE_ABI,
      greetingCardAbi: GREETING_CARD_ABI,
      walletClient,
      publicClient,
    }),
    [walletClient, publicClient, chainId]
  );

  return (
    <ContractsContext.Provider value={value}>
      {children}
    </ContractsContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useContracts(): ContractsContextValue {
  const ctx = useContext(ContractsContext);
  if (!ctx) throw new Error("useContracts must be used within <ContractsProvider>");
  return ctx;
}
