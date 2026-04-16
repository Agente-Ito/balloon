/**
 * viem client builders for LUKSO networks.
 * The wallet client uses the UP Provider injected by the Grid host.
 */
import { createPublicClient, createWalletClient, http, custom } from "viem";
import type { Chain } from "viem";

// LUKSO chain definitions (not yet in viem's built-in chains at time of writing)
export const luksoMainnet = {
  id: 42,
  name: "LUKSO",
  nativeCurrency: { name: "LYX", symbol: "LYX", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.lukso.network"] },
    public: { http: ["https://rpc.lukso.network"] },
  },
  blockExplorers: {
    default: { name: "Universal Page", url: "https://explorer.execution.mainnet.lukso.network" },
  },
} as const satisfies Chain;

export const luksoTestnet = {
  id: 4201,
  name: "LUKSO Testnet",
  nativeCurrency: { name: "LYXt", symbol: "LYXt", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.testnet.lukso.network"] },
    public: { http: ["https://rpc.testnet.lukso.network"] },
  },
  blockExplorers: {
    default: { name: "Universal Page Testnet", url: "https://explorer.execution.testnet.lukso.network" },
  },
  testnet: true,
} as const satisfies Chain;

// Public clients (read-only, use HTTP RPC directly — faster than UP Provider for reads)
export const publicClientMainnet = createPublicClient({
  chain: luksoMainnet,
  transport: http(),
});

export const publicClientTestnet = createPublicClient({
  chain: luksoTestnet,
  transport: http(),
});

export function getPublicClient(chainId: number) {
  return chainId === 42 ? publicClientMainnet : publicClientTestnet;
}

export function getChain(chainId: number): Chain {
  return chainId === 42 ? luksoMainnet : luksoTestnet;
}

/**
 * Create a wallet client backed by the UP Provider.
 * The UP Provider is injected by the LUKSO Grid host iframe.
 * Transactions signed through this client are executed by the Universal Profile
 * (via its Key Manager), not by a plain EOA.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createUPWalletClient(upProvider: any, chainId: number) {
  return createWalletClient({
    chain: getChain(chainId),
    transport: custom(upProvider),
  });
}

// ── Utility: encode ERC725Y JSONURL value ─────────────────────────────────────

/**
 * Encode a JSONURL value per LSP2 spec:
 * Prepend 0x6f357c6a (keccak256 hash function marker) + keccak256(json) + ipfs://CID
 * erc725.js handles this automatically when using encodeData with valueContent:'JSONURL'
 */
export function encodeJSONURL(ipfsUrl: string, contentHash: string): string {
  // hashFunction prefix for keccak256: 0x6f357c6a
  return "0x6f357c6a" + contentHash.replace("0x", "") + Buffer.from(ipfsUrl).toString("hex");
}
