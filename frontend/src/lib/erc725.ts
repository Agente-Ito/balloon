/**
 * ERC725.js instance factory and helper wrappers for the Celebrations app.
 *
 * Simple scalar keys (birthday, profileCreatedAt) are read directly via viem
 * to avoid erc725.js BigInt / encoding bugs on empty values.
 *
 * JSONURL array keys (events, wishlist, settings) still use erc725.js for
 * schema-aware array pagination, then we extract the URL ourselves.
 */
import ERC725 from "@erc725/erc725.js";
import { createPublicClient, http } from "viem";
import { CELEBRATIONS_SCHEMA, KEY_BIRTHDAY, KEY_PROFILE_CREATED_AT } from "@/constants/erc725Keys";
import { LUKSO_TESTNET_RPC, LUKSO_MAINNET_RPC } from "@/constants/addresses";
import type { ProfileCelebrationData, ProfileSettings, Celebration, WishlistItem } from "@/types";
import { fetchIPFSJson } from "./ipfs";

// ── Shared ABI for ERC725Y getData ────────────────────────────────────────────

const GET_DATA_ABI = [{
  name: "getData",
  type: "function",
  stateMutability: "view",
  inputs:  [{ name: "dataKey",   type: "bytes32" }],
  outputs: [{ name: "dataValue", type: "bytes"   }],
}] as const;

function makeClient(chainId: number) {
  const rpc = chainId === 42 ? LUKSO_MAINNET_RPC : LUKSO_TESTNET_RPC;
  return createPublicClient({ transport: http(rpc) });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * erc725.js getData() returns { url, hash } objects for JSONURL valueContent.
 * This helper handles both shapes so reads work regardless of library version.
 */
function extractUrl(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "url" in value) {
    return (value as { url: string }).url;
  }
  throw new Error(`[erc725] Cannot extract URL from: ${JSON.stringify(value)}`);
}

/** Decode raw ERC725Y bytes to a UTF-8 string (bypasses erc725.js). */
function bytesToString(hex: string): string | undefined {
  if (!hex || hex === "0x") return undefined;
  const bytes = hex.slice(2).match(/../g)?.map((b) => parseInt(b, 16));
  if (!bytes?.length) return undefined;
  return new TextDecoder().decode(new Uint8Array(bytes));
}

// ── Factory (still used for JSONURL array reads) ───────────────────────────────

export function createERC725(address: string, chainId: number): ERC725 {
  const rpc = chainId === 42 ? LUKSO_MAINNET_RPC : LUKSO_TESTNET_RPC;
  return new ERC725(CELEBRATIONS_SCHEMA as never, address, rpc, {
    ipfsGateway: import.meta.env.VITE_PINATA_GATEWAY ?? "https://gateway.pinata.cloud",
  });
}

// ── Read helpers ──────────────────────────────────────────────────────────────

/** Read birthday directly via viem — avoids erc725.js string decoding quirks. */
export async function readBirthday(
  address: string,
  chainId: number
): Promise<string | undefined> {
  try {
    const raw = await makeClient(chainId).readContract({
      address: address as `0x${string}`,
      abi: GET_DATA_ABI,
      functionName: "getData",
      args: [KEY_BIRTHDAY as `0x${string}`],
    });
    return bytesToString(raw as string);
  } catch {
    return undefined;
  }
}

/** Read profileCreatedAt directly via viem — avoids erc725.js BigInt crash on empty uint256. */
export async function readProfileCreatedAt(
  address: string,
  chainId: number
): Promise<number | undefined> {
  try {
    const raw = await makeClient(chainId).readContract({
      address: address as `0x${string}`,
      abi: GET_DATA_ABI,
      functionName: "getData",
      args: [KEY_PROFILE_CREATED_AT as `0x${string}`],
    });
    if (!raw || raw === "0x") return undefined;
    return Number(BigInt(raw as string));
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

export function encodeBirthday(date: string): string {
  const erc725 = new ERC725(CELEBRATIONS_SCHEMA as never);
  const encoded = erc725.encodeData([
    { keyName: "CelebrationsBirthday", value: date },
  ]);
  return encoded.values[0] as string;
}
