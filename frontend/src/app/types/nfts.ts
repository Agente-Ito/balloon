import type { Address, BadgeType, GreetingType, CelebrationTypeSlug } from "./common";
import type { CelebrationType } from "./celebrations";

// ── Badge NFTs ────────────────────────────────────────────────────────────────

export interface BadgeMetadata {
  title: string;
  description: string;
  badgeType: BadgeType;
  celebrationType: CelebrationTypeSlug;
  year: number;
  ownerProfile: Address;
  image: string; // ipfs://...
  /** keccak256 of the image for LSP4 verification */
  imageHash: string;
  attributes: Array<{ trait_type: string; value: string | number | boolean }>;
}

export interface CelebrationBadge {
  /** bytes32 hex tokenId (deterministic: keccak256(owner, type, year)) */
  tokenId: string;
  owner: Address;
  badgeType: BadgeType;
  celebrationType: CelebrationType;
  celebrationTypeSlug: CelebrationTypeSlug;
  /** Canonical celebration ID that originated this badge */
  celebrationId: string;
  year: number;
  mintedAt: number;
  metadataCID: string;
  transferable: boolean;
}

/**
 * @deprecated Use CelebrationBadge. Kept for backwards compatibility with
 * hooks that import Badge from the old types layer.
 */
export interface Badge {
  tokenId: string;
  owner: Address;
  metadata: Pick<BadgeMetadata, "title" | "celebrationType" | "year" | "ownerProfile" | "image">;
  soulbound: boolean;
}

// ── Greeting Card NFTs ────────────────────────────────────────────────────────

export interface GreetingMetadata {
  title: string;
  description: string;
  greetingType: GreetingType;
  celebrationType: CelebrationTypeSlug;
  fromProfile: Address;
  toProfile: Address;
  message: string;
  image: string; // ipfs://...
  /** keccak256 of the image for LSP4 verification */
  imageHash: string;
  year: number;
  attributes: Array<{ trait_type: string; value: string | number | boolean }>;
}

export interface GreetingCard {
  /** bytes32 hex tokenId (sequential) */
  tokenId: string;
  fromProfile: Address;
  toProfile: Address;
  greetingType: GreetingType;
  celebrationType: CelebrationType;
  celebrationTypeSlug: CelebrationTypeSlug;
  /** Canonical celebration ID this card belongs to */
  celebrationId: string;
  message: string;
  metadataCID: string;
  mintedAt: number;
}

/**
 * @deprecated Use GreetingCard. Kept for backwards compatibility.
 */
export interface GreetingCardLegacy {
  tokenId: string;
  metadata: {
    title: string;
    from: Address;
    to: Address;
    celebration: CelebrationType;
    message: string;
    year: number;
    timestamp: number;
    image: string;
  };
}
