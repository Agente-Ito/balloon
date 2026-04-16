/**
 * Metadata service — builds LSP4-compliant JSON, uploads to IPFS, and
 * encodes the JSONURL bytes that are passed to contract mint functions.
 *
 * This module is the canonical implementation; `src/lib/lsp4Builder.ts` delegates
 * to it for backwards compatibility.
 */
import { keccak256 } from "viem";
import type { CelebrationType } from "@/app/types";
import { buildBadgeLSP4, buildGreetingCardLSP4 } from "@/constants/lsp4Metadata";
import { uploadJSONToIPFS } from "@/lib/ipfs";

// ── Default assets (on-chain fallback for no-image mints) ────────────────────

const DEFAULT_BADGE_IMAGE_URL  = "ipfs://QmDefaultBadgeImage";
const DEFAULT_BADGE_IMAGE_HASH = "0x" + "00".repeat(32);

const DEFAULT_CARD_IMAGE_URL  = "ipfs://QmDefaultCardImage";
const DEFAULT_CARD_IMAGE_HASH = "0x" + "00".repeat(32);

// ── Result type ───────────────────────────────────────────────────────────────

export interface BuiltMetadata {
  ipfsUrl: string;
  /** keccak256 (SHA-256 for browser) of the JSON content */
  contentHash: string;
}

// ── Badge metadata ────────────────────────────────────────────────────────────

export async function buildBadgeMetadata(params: {
  ownerAddress: string;
  celebrationType: CelebrationType;
  year: number;
  imageUrl?: string;
  imageHash?: string;
}): Promise<BuiltMetadata> {
  const json = buildBadgeLSP4({
    ownerAddress: params.ownerAddress,
    celebrationType: params.celebrationType,
    year: params.year,
    imageUrl: params.imageUrl ?? DEFAULT_BADGE_IMAGE_URL,
    imageHash: params.imageHash ?? DEFAULT_BADGE_IMAGE_HASH,
  });

  const ipfsUrl     = await uploadJSONToIPFS(json, `badge-${params.celebrationType}-${params.year}`);
  const contentHash = hashJSON(json);
  return { ipfsUrl, contentHash };
}

// ── Greeting card metadata ────────────────────────────────────────────────────

export async function buildGreetingMetadata(params: {
  fromAddress: string;
  toAddress: string;
  celebrationType: CelebrationType;
  message: string;
  year: number;
  imageUrl?: string;
  imageHash?: string;
}): Promise<BuiltMetadata> {
  const json = buildGreetingCardLSP4({
    fromAddress: params.fromAddress,
    toAddress: params.toAddress,
    celebrationType: params.celebrationType,
    message: params.message,
    year: params.year,
    imageUrl: params.imageUrl ?? DEFAULT_CARD_IMAGE_URL,
    imageHash: params.imageHash ?? DEFAULT_CARD_IMAGE_HASH,
  });

  const ipfsUrl     = await uploadJSONToIPFS(json, `card-from-${params.fromAddress.slice(0, 8)}`);
  const contentHash = hashJSON(json);
  return { ipfsUrl, contentHash };
}

// ── JSONURL encoding ──────────────────────────────────────────────────────────

/**
 * Encode an IPFS URL + content hash into the bytes passed as `metadataBytes`
 * to `mintBadge` / `mintCard`.
 * Format: bytes32(contentHash) + utf8(ipfsUrl)
 */
export function encodeMetadataBytes(ipfsUrl: string, contentHash: string): `0x${string}` {
  const urlBytes  = new TextEncoder().encode(ipfsUrl);
  const hashBytes = hexToBytes(contentHash);

  const combined = new Uint8Array(32 + urlBytes.length);
  combined.set(hashBytes.slice(0, 32), 0);
  combined.set(urlBytes, 32);

  return ("0x" + Array.from(combined).map((b) => b.toString(16).padStart(2, "0")).join("")) as `0x${string}`;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function hashJSON(json: object): string {
  // keccak256 is required by the LSP4 JSONURL standard for content verification.
  const data = new TextEncoder().encode(JSON.stringify(json));
  return keccak256(data);
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace("0x", "").padStart(64, "0");
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
