/**
 * Build LSP4-compliant metadata JSON for Celebrations NFTs,
 * upload to IPFS, and return the IPFS URL + content hash.
 */
import type { CelebrationType } from "@/types";
import { buildBadgeLSP4, buildGreetingCardLSP4 } from "@/constants/lsp4Metadata";
import { uploadJSONToIPFS } from "./ipfs";

// Default badge image hosted on IPFS (fallback for cases where user doesn't upload art)
const DEFAULT_BADGE_IMAGE_URL = "ipfs://QmDefaultBadgeImage";
const DEFAULT_BADGE_IMAGE_HASH = "0x0000000000000000000000000000000000000000000000000000000000000000";

const DEFAULT_CARD_IMAGE_URL = "ipfs://QmDefaultCardImage";
const DEFAULT_CARD_IMAGE_HASH = "0x0000000000000000000000000000000000000000000000000000000000000000";

export interface BuiltMetadata {
  ipfsUrl: string;
  /** keccak256 hash of the JSON content — used for JSONURL encoding */
  contentHash: string;
}

export async function buildAndUploadBadgeMetadata(params: {
  ownerAddress: string;
  celebrationType: CelebrationType;
  year: number;
  imageUrl?: string;
  imageHash?: string;
}): Promise<BuiltMetadata> {
  const metadata = buildBadgeLSP4({
    ownerAddress: params.ownerAddress,
    celebrationType: params.celebrationType,
    year: params.year,
    imageUrl: params.imageUrl ?? DEFAULT_BADGE_IMAGE_URL,
    imageHash: params.imageHash ?? DEFAULT_BADGE_IMAGE_HASH,
  });

  const ipfsUrl = await uploadJSONToIPFS(
    metadata,
    `celebrations-badge-${params.celebrationType}-${params.year}`
  );

  // Compute content hash of the serialized JSON
  const json = JSON.stringify(metadata);
  const contentHash = await hashString(json);

  return { ipfsUrl, contentHash };
}

export async function buildAndUploadGreetingCardMetadata(params: {
  fromAddress: string;
  toAddress: string;
  celebrationType: CelebrationType;
  message: string;
  year: number;
  imageUrl?: string;
  imageHash?: string;
}): Promise<BuiltMetadata> {
  const metadata = buildGreetingCardLSP4({
    fromAddress: params.fromAddress,
    toAddress: params.toAddress,
    celebrationType: params.celebrationType,
    message: params.message,
    year: params.year,
    imageUrl: params.imageUrl ?? DEFAULT_CARD_IMAGE_URL,
    imageHash: params.imageHash ?? DEFAULT_CARD_IMAGE_HASH,
  });

  const ipfsUrl = await uploadJSONToIPFS(
    metadata,
    `celebrations-card-from-${params.fromAddress.slice(0, 8)}`
  );

  const contentHash = await hashString(JSON.stringify(metadata));
  return { ipfsUrl, contentHash };
}

async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return "0x" + hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Encode the IPFS URL + hash into bytes for passing as `metadataBytes`
 * to the smart contract mint functions.
 */
export function encodeMetadataBytes(ipfsUrl: string, contentHash: string): `0x${string}` {
  // Store as ABI-encoded (ipfsUrl, contentHash) tuple
  // The contract stores this in per-token ERC725Y data
  const encoder = new TextEncoder();
  const urlBytes = encoder.encode(ipfsUrl);
  const hashBytes = hexToBytes(contentHash);

  const combined = new Uint8Array(32 + urlBytes.length);
  combined.set(hashBytes.slice(0, 32), 0);
  combined.set(urlBytes, 32);

  return ("0x" + Array.from(combined).map((b) => b.toString(16).padStart(2, "0")).join("")) as `0x${string}`;
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace("0x", "").padStart(64, "0");
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
