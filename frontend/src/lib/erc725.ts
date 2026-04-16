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

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * erc725.js getData() returns { url, hash } objects for JSONURL valueContent,
 * not plain strings. This helper handles both shapes so the read functions
 * work correctly regardless of library version.
 */
function extractUrl(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "url" in value) {
    return (value as { url: string }).url;
  }
  throw new Error(`[erc725] Cannot extract URL from: ${JSON.stringify(value)}`);
}

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
    // getData returns { url, hash } for JSONURL — we must fetch the URL ourselves
    const url = extractUrl(result.value);
    return await fetchIPFSJson<ProfileSettings>(url);
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
    // erc725.js getData returns { url, hash } objects for JSONURL elements — extract the URL
    const celebrations = await Promise.all(
      (result.value as unknown[]).map((item) => fetchIPFSJson<Celebration>(extractUrl(item)))
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
      (result.value as unknown[]).map((item) => fetchIPFSJson<WishlistItem>(extractUrl(item)))
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
  // Each read is individually guarded so one failure doesn't block the rest
  const [birthday, profileCreatedAt, events, wishlist, settings] = await Promise.all([
    readBirthday(address, chainId).catch(() => undefined),
    readProfileCreatedAt(address, chainId).catch(() => undefined),
    readEvents(address, chainId).catch(() => [] as Celebration[]),
    readWishlist(address, chainId).catch(() => [] as WishlistItem[]),
    readSettings(address, chainId).catch(() => undefined),
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
