/**
 * Read and write celebrations data from/to a Universal Profile's ERC725Y storage.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPublicClient, http, keccak256 } from "viem";
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

/** Wait for a transaction to be mined and return the receipt. */
function makePublicClient(chainId = 4201) {
  const rpc = chainId === 42 ? LUKSO_MAINNET_RPC : LUKSO_TESTNET_RPC;
  const chain = chainId === 42 ? luksoMainnet : luksoTestnet;
  return createPublicClient({ chain, transport: http(rpc) });
}

async function waitForTx(txHash: `0x${string}`, chainId = 4201) {
  const client = makePublicClient(chainId);
  await client.waitForTransactionReceipt({ hash: txHash });
}

/** Read the current uint128 array length stored at an ERC725Y array key. */
async function readArrayLength(upAddress: Address, arrayKey: string, chainId = 4201): Promise<number> {
  const client = makePublicClient(chainId);
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

export function useSetBirthday({ walletClient, upAddress, chainId = 4201 }: WriteContext) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (birthday: string) => {
      const encoded = new TextEncoder().encode(birthday);
      const hex = ("0x" + Array.from(encoded).map((b) => b.toString(16).padStart(2, "0")).join("")) as `0x${string}`;
      const account = await resolveAccount(walletClient, upAddress);

      const txHash = await walletClient.writeContract({
        address: upAddress,
        abi: ERC725Y_ABI,
        functionName: "setData",
        args: [KEY_BIRTHDAY as `0x${string}`, hex],
        account,
        chain: null,
      });
      // Wait for confirmation — swallow timeout errors so the UI still updates
      try { await waitForTx(txHash, chainId); } catch { /* confirmed or timed out */ }
      return birthday;
    },
    onSuccess: (birthday) => {
      // Immediately patch the cache so the UI reflects the new value without
      // waiting for a fresh RPC call (which may still return the old value
      // for a few seconds after the receipt due to node propagation lag).
      queryClient.setQueriesData<{ birthday?: string }>(
        { queryKey: ["profileData"] },
        (old) => old ? { ...old, birthday } : old,
      );
      // Then invalidate in the background to eventually sync from chain
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["profileData"] });
      }, 4000);
    },
  });
}

export function useSetSettings({ walletClient, upAddress, chainId = 4201 }: WriteContext) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: ProfileSettings) => {
      const ipfsUrl = await uploadJSONToIPFS(settings, `celebrations-settings-${upAddress}`);

      const contentBytes = new TextEncoder().encode(JSON.stringify(settings));
      const hashHex = keccak256(contentBytes).slice(2); // 64 hex chars, no 0x
      const urlHex = Array.from(new TextEncoder().encode(ipfsUrl))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      const encodedValue = `0x6f357c6a${hashHex}${urlHex}` as `0x${string}`;

      const account = await resolveAccount(walletClient, upAddress);
      const txHash = await walletClient.writeContract({
        address: upAddress,
        abi: ERC725Y_ABI,
        functionName: "setData",
        args: [KEY_SETTINGS as `0x${string}`, encodedValue],
        account,
        chain: null,
      });
      await waitForTx(txHash, chainId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profileData"] });
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
      // Abort if IPFS is unavailable — data URIs are too large to store on-chain
      if (!ipfsUrl.startsWith("ipfs://")) {
        throw new Error("IPFS upload unavailable. Check your VITE_IPFS_PROXY_URL and try again.");
      }

      // Build array element key: first 16 bytes of array key + 00*12 + 4-byte index (= 32 bytes per LSP2)
      const arrayKey = KEY_EVENTS_ARRAY.slice(0, 34); // "0x" + 32 hex chars = 16 bytes
      const indexHex = currentLength.toString(16).padStart(8, "0");
      const elementKey = (arrayKey + "000000000000000000000000" + indexHex) as `0x${string}`;

      const newCount = currentLength + 1;
      const lengthValue = ("0x" + newCount.toString(16).padStart(64, "0")) as `0x${string}`;

      const contentHash = hashJSON(event);
      const urlHex = Array.from(new TextEncoder().encode(ipfsUrl))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      const elementValue = ("0x6f357c6a" + contentHash + urlHex) as `0x${string}`;

      const account = await resolveAccount(walletClient, upAddress);
      const txHash = await walletClient.writeContract({
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
      await waitForTx(txHash, chainId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profileData"] });
    },
    onError: (err) => {
      console.error("[useAddEvent] mutation error:", err);
    },
  });
}

export function useQuickSetupBatch({ walletClient, upAddress, chainId = 4201 }: WriteContext) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      birthday,
      event,
      settings,
    }: {
      birthday: string;
      event: Celebration;
      settings?: ProfileSettings;
    }) => {
      const currentLength = await readArrayLength(upAddress, KEY_EVENTS_ARRAY, chainId);

      const ipfsUrl = await uploadJSONToIPFS(event, `celebrations-event-${event.id}`);
      if (!ipfsUrl.startsWith("ipfs://")) {
        throw new Error("IPFS upload unavailable. Check your VITE_IPFS_PROXY_URL and try again.");
      }

      const birthdayBytes = new TextEncoder().encode(birthday);
      const birthdayValue = (
        "0x" + Array.from(birthdayBytes).map((b) => b.toString(16).padStart(2, "0")).join("")
      ) as `0x${string}`;

      const arrayKey = KEY_EVENTS_ARRAY.slice(0, 34);
      const indexHex = currentLength.toString(16).padStart(8, "0");
      const elementKey = (arrayKey + "000000000000000000000000" + indexHex) as `0x${string}`;

      const newCount = currentLength + 1;
      const lengthValue = ("0x" + newCount.toString(16).padStart(64, "0")) as `0x${string}`;

      const contentHash = hashJSON(event);
      const urlHex = Array.from(new TextEncoder().encode(ipfsUrl))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      const elementValue = ("0x6f357c6a" + contentHash + urlHex) as `0x${string}`;

      const keys: `0x${string}`[] = [
        KEY_BIRTHDAY as `0x${string}`,
        KEY_EVENTS_ARRAY as `0x${string}`,
        elementKey,
      ];
      const values: `0x${string}`[] = [birthdayValue, lengthValue, elementValue];

      if (settings) {
        const settingsIpfsUrl = await uploadJSONToIPFS(settings, `celebrations-settings-${upAddress}`);
        const settingsBytes = new TextEncoder().encode(JSON.stringify(settings));
        const settingsHashHex = keccak256(settingsBytes).slice(2);
        const settingsUrlHex = Array.from(new TextEncoder().encode(settingsIpfsUrl))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        const settingsValue = (`0x6f357c6a${settingsHashHex}${settingsUrlHex}`) as `0x${string}`;
        keys.push(KEY_SETTINGS as `0x${string}`);
        values.push(settingsValue);
      }

      const account = await resolveAccount(walletClient, upAddress);
      const txHash = await walletClient.writeContract({
        address: upAddress,
        abi: ERC725Y_ABI,
        functionName: "setDataBatch",
        args: [keys, values],
        account,
        chain: null,
      });
      await waitForTx(txHash, chainId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profileData"] });
    },
  });
}

export function useAddWishlistItem({ walletClient, upAddress, chainId = 4201 }: WriteContext) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: WishlistItem) => {
      const currentLength = await readArrayLength(upAddress, KEY_WISHLIST_ARRAY, chainId);

      const ipfsUrl = await uploadJSONToIPFS(item, `celebrations-wishlist-${item.id}`);
      if (!ipfsUrl.startsWith("ipfs://")) {
        throw new Error("IPFS upload unavailable. Check your VITE_IPFS_PROXY_URL and try again.");
      }

      const arrayKey = KEY_WISHLIST_ARRAY.slice(0, 34);
      const indexHex = currentLength.toString(16).padStart(8, "0");
      const elementKey = (arrayKey + "000000000000000000000000" + indexHex) as `0x${string}`;

      const newCount = currentLength + 1;
      const lengthValue = ("0x" + newCount.toString(16).padStart(64, "0")) as `0x${string}`;

      const contentHash = hashJSON(item);
      const urlHex = Array.from(new TextEncoder().encode(ipfsUrl))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      const elementValue = ("0x6f357c6a" + contentHash + urlHex) as `0x${string}`;

      const account = await resolveAccount(walletClient, upAddress);
      const txHash = await walletClient.writeContract({
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
      await waitForTx(txHash, chainId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profileData"] });
    },
  });
}

function hashJSON(obj: object): string {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  return keccak256(bytes).slice(2); // 64 hex chars, no 0x prefix
}
