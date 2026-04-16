/**
 * Read and write celebrations data from/to a Universal Profile's ERC725Y storage.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPublicClient, http } from "viem";
import { readAllCelebrationData } from "@/lib/erc725";
import { uploadJSONToIPFS } from "@/lib/ipfs";
import { KEY_BIRTHDAY, KEY_SETTINGS, KEY_EVENTS_ARRAY, KEY_WISHLIST_ARRAY } from "@/constants/erc725Keys";
import { LUKSO_TESTNET_RPC, LUKSO_MAINNET_RPC } from "@/constants/addresses";
import { luksoTestnet, luksoMainnet } from "@/lib/lukso";
import type { Address, ProfileSettings, Celebration, WishlistItem } from "@/types";
import type { WalletClient } from "viem";

// ABI fragment for ERC725Y setData
const ERC725Y_ABI = [
  {
    name: "setData",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "dataKey", type: "bytes32" },
      { name: "dataValue", type: "bytes" },
    ],
    outputs: [],
  },
  {
    name: "setDataBatch",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "dataKeys", type: "bytes32[]" },
      { name: "dataValues", type: "bytes[]" },
    ],
    outputs: [],
  },
] as const;

// ── Read ──────────────────────────────────────────────────────────────────────

export function useProfileData(profileAddress: Address | null, chainId: number) {
  return useQuery({
    queryKey: ["profileData", profileAddress, chainId],
    queryFn: () => readAllCelebrationData(profileAddress!, chainId),
    enabled: !!profileAddress,
    staleTime: 60_000, // 1 min
    retry: 2,
  });
}

// ── Write ─────────────────────────────────────────────────────────────────────

interface WriteContext {
  walletClient: WalletClient;
  upAddress: Address;
  chainId?: number;
}

/** Resolve the account address from the UP Provider, falling back to upAddress. */
async function resolveAccount(walletClient: WalletClient, upAddress: Address): Promise<Address> {
  try {
    const accounts = await walletClient.requestAddresses();
    return (accounts[0] ?? upAddress) as Address;
  } catch {
    return upAddress;
  }
}

/** Read the current uint128 array length stored at an ERC725Y array key. */
async function readArrayLength(upAddress: Address, arrayKey: string, chainId = 4201): Promise<number> {
  const rpc = chainId === 42 ? LUKSO_MAINNET_RPC : LUKSO_TESTNET_RPC;
  const chain = chainId === 42 ? luksoMainnet : luksoTestnet;
  const client = createPublicClient({ chain, transport: http(rpc) });
  const raw = await client.readContract({
    address: upAddress,
    abi: [{ name: "getData", type: "function", stateMutability: "view",
            inputs: [{ name: "dataKey", type: "bytes32" }],
            outputs: [{ name: "dataValue", type: "bytes" }] }] as const,
    functionName: "getData",
    args: [arrayKey as `0x${string}`],
  });
  if (!raw || raw === "0x") return 0;
  return parseInt(raw as string, 16);
}

export function useSetBirthday({ walletClient, upAddress }: WriteContext) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (birthday: string) => {
      const encoded = new TextEncoder().encode(birthday);
      const hex = ("0x" + Array.from(encoded).map((b) => b.toString(16).padStart(2, "0")).join("")) as `0x${string}`;
      const account = await resolveAccount(walletClient, upAddress);

      return walletClient.writeContract({
        address: upAddress,
        abi: ERC725Y_ABI,
        functionName: "setData",
        args: [KEY_BIRTHDAY as `0x${string}`, hex],
        account,
        chain: null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profileData", upAddress] });
    },
  });
}

export function useSetSettings({ walletClient, upAddress }: WriteContext) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: ProfileSettings) => {
      const ipfsUrl = await uploadJSONToIPFS(settings, `celebrations-settings-${upAddress}`);

      const json = JSON.stringify(settings);
      const hashBuffer = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(json)
      );
      const hashHex = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const urlHex = Array.from(new TextEncoder().encode(ipfsUrl))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const encodedValue = ("0x6f357c6a" + hashHex + urlHex) as `0x${string}`;

      const account = await resolveAccount(walletClient, upAddress);
      return walletClient.writeContract({
        address: upAddress,
        abi: ERC725Y_ABI,
        functionName: "setData",
        args: [KEY_SETTINGS as `0x${string}`, encodedValue],
        account,
        chain: null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profileData", upAddress] });
    },
  });
}

export function useAddEvent({ walletClient, upAddress, chainId = 4201 }: WriteContext) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (event: Celebration) => {
      // Read the current array length directly from chain — no client cache dependency
      const currentLength = await readArrayLength(upAddress, KEY_EVENTS_ARRAY, chainId);

      const ipfsUrl = await uploadJSONToIPFS(event, `celebrations-event-${event.id}`);

      // Build array element key: first 16 bytes of array key + 00*8 + 4-byte index
      const arrayKey = KEY_EVENTS_ARRAY.slice(0, 34); // "0x" + 32 hex chars
      const indexHex = currentLength.toString(16).padStart(8, "0");
      const elementKey = (arrayKey + "0000000000000000" + indexHex) as `0x${string}`;

      const newCount = currentLength + 1;
      const lengthValue = ("0x" + newCount.toString(16).padStart(64, "0")) as `0x${string}`;

      const contentHash = await hashJSON(event);
      const urlHex = Array.from(new TextEncoder().encode(ipfsUrl))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      const elementValue = ("0x6f357c6a" + contentHash + urlHex) as `0x${string}`;

      const account = await resolveAccount(walletClient, upAddress);
      return walletClient.writeContract({
        address: upAddress,
        abi: ERC725Y_ABI,
        functionName: "setDataBatch",
        args: [
          [KEY_EVENTS_ARRAY as `0x${string}`, elementKey],
          [lengthValue, elementValue],
        ],
        account,
        chain: null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profileData", upAddress] });
    },
    onError: (err) => {
      console.error("[useAddEvent] mutation error:", err);
    },
  });
}

export function useAddWishlistItem({ walletClient, upAddress, chainId = 4201 }: WriteContext) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: WishlistItem) => {
      const currentLength = await readArrayLength(upAddress, KEY_WISHLIST_ARRAY, chainId);

      const ipfsUrl = await uploadJSONToIPFS(item, `celebrations-wishlist-${item.id}`);

      const arrayKey = KEY_WISHLIST_ARRAY.slice(0, 34);
      const indexHex = currentLength.toString(16).padStart(8, "0");
      const elementKey = (arrayKey + "0000000000000000" + indexHex) as `0x${string}`;

      const newCount = currentLength + 1;
      const lengthValue = ("0x" + newCount.toString(16).padStart(64, "0")) as `0x${string}`;

      const contentHash = await hashJSON(item);
      const urlHex = Array.from(new TextEncoder().encode(ipfsUrl))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      const elementValue = ("0x6f357c6a" + contentHash + urlHex) as `0x${string}`;

      const account = await resolveAccount(walletClient, upAddress);
      return walletClient.writeContract({
        address: upAddress,
        abi: ERC725Y_ABI,
        functionName: "setDataBatch",
        args: [
          [KEY_WISHLIST_ARRAY as `0x${string}`, elementKey],
          [lengthValue, elementValue],
        ],
        account,
        chain: null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profileData", upAddress] });
    },
  });
}

async function hashJSON(obj: object): Promise<string> {
  const json = JSON.stringify(obj);
  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(json));
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
