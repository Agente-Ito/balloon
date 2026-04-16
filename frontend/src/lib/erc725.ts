/**
 * ERC725.js instance factory and helper wrappers for the Celebrations app.
 * ERC725.js handles encoding/decoding of ERC725Y key-value pairs per LSP2 spec,
 * including JSONURL encoding for IPFS references.
 */
import ERC725 from "@erc725/erc725.js";
import { CELEBRATIONS_SCHEMA } from "@/constants/erc725Keys";
import { LUKSO_TESTNET_RPC, LUKSO_MAINNET_RPC } from "@/constants/addresses";
import type { ProfileCelebrationData, ProfileSettings, Celebration, WishlistItem } from "@/types";
import { fetchIPFSJson } from "./ipfs";

// ── Factory ───────────────────────────────────────────────────────────────────

export function createERC725(address: string, chainId: number): ERC725 {
  const rpc = chainId === 42 ? LUKSO_MAINNET_RPC : LUKSO_TESTNET_RPC;
  return new ERC725(CELEBRATIONS_SCHEMA as never, address, rpc, {
    ipfsGateway: import.meta.env.VITE_PINATA_GATEWAY_URL ?? "https://gateway.pinata.cloud",
  });
}

// ── Read helpers ──────────────────────────────────────────────────────────────

export async function readBirthday(
  address: string,
  chainId: number
): Promise<string | undefined> {
  const erc725 = createERC725(address, chainId);
  try {
    const result = await erc725.getData("CelebrationsBirthday");
    return result.value as string | undefined;
  } catch {
    return undefined;
  }
}

export async function readProfileCreatedAt(
  address: string,
  chainId: number
): Promise<number | undefined> {
  const erc725 = createERC725(address, chainId);
  try {
    const result = await erc725.getData("CelebrationsProfileCreatedAt");
    const val = result.value;
    return val ? Number(val) : undefined;
  } catch {
    return undefined;
  }
}

export async function readSettings(
  address: string,
  chainId: number
): Promise<ProfileSettings | undefined> {
  const erc725 = createERC725(address, chainId);
  try {
    const result = await erc725.getData("CelebrationsSettings");
    if (!result.value) return undefined;
    // JSONURL: erc725.js resolves the IPFS URL and returns the fetched JSON
    return result.value as unknown as ProfileSettings;
  } catch {
    return undefined;
  }
}

export async function readEvents(
  address: string,
  chainId: number
): Promise<Celebration[]> {
  const erc725 = createERC725(address, chainId);
  try {
    const result = await erc725.getData("CelebrationsEvents[]");
    if (!Array.isArray(result.value)) return [];
    // Each element is a JSONURL that points to a Celebration JSON on IPFS
    const celebrations = await Promise.all(
      (result.value as string[]).map((url) => fetchIPFSJson<Celebration>(url))
    );
    return celebrations;
  } catch {
    return [];
  }
}

export async function readWishlist(
  address: string,
  chainId: number
): Promise<WishlistItem[]> {
  const erc725 = createERC725(address, chainId);
  try {
    const result = await erc725.getData("CelebrationsWishlist[]");
    if (!Array.isArray(result.value)) return [];
    const items = await Promise.all(
      (result.value as string[]).map((url) => fetchIPFSJson<WishlistItem>(url))
    );
    return items;
  } catch {
    return [];
  }
}

export async function readAllCelebrationData(
  address: string,
  chainId: number
): Promise<ProfileCelebrationData> {
  const [birthday, profileCreatedAt, events, wishlist, settings] = await Promise.all([
    readBirthday(address, chainId),
    readProfileCreatedAt(address, chainId),
    readEvents(address, chainId),
    readWishlist(address, chainId),
    readSettings(address, chainId),
  ]);

  return {
    version: "1",
    birthday,
    profileCreatedAt,
    events,
    wishlist,
    settings: settings ?? defaultSettings(),
  };
}

export function defaultSettings(): ProfileSettings {
  return {
    autoMintBadge: false,
    birthdayVisible: true,
    eventsVisible: true,
    wishlistVisible: true,
    notifyFollowers: true,
  };
}

// ── Encode helpers ────────────────────────────────────────────────────────────

/**
 * Encode a birthday string for storage in ERC725Y.
 * Returns the ABI-encoded bytes to pass to setData().
 */
export function encodeBirthday(date: string): string {
  // Simple string encoding — erc725.js handles it for valueType: 'string'
  const erc725 = new ERC725(CELEBRATIONS_SCHEMA as never);
  const encoded = erc725.encodeData([
    { keyName: "CelebrationsBirthday", value: date },
  ]);
  return encoded.values[0] as string;
}
