/**
 * Canonical domain types for the Celebrations indexer.
 *
 * These types mirror the frontend's app/types/ schema and the Solidity
 * interfaces. Any type added here must also exist in frontend/src/app/types/
 * to maintain consistency across all layers.
 *
 * Source of truth: docs/domain-schema.md (human-readable)
 * Source of truth: frontend/src/app/types/ (TypeScript)
 */

// ── Primitive types ───────────────────────────────────────────────────────────

export type Address = `0x${string}`;

/** String-based celebration type — same values as in frontend CelebrationTypeSlug */
export type CelebrationTypeSlug =
  | "birthday"
  | "profile_anniversary"
  | "global_holiday"
  | "custom_event";

/** Maps CelebrationTypeSlug to the uint8 stored in contract events */
export const CELEBRATION_TYPE_TO_UINT8: Record<CelebrationTypeSlug, number> = {
  birthday: 0,
  profile_anniversary: 1,
  global_holiday: 2,
  custom_event: 3,
};

export const UINT8_TO_CELEBRATION_TYPE: Record<number, CelebrationTypeSlug> = {
  0: "birthday",
  1: "profile_anniversary",
  2: "global_holiday",
  3: "custom_event",
};

export type BadgeType =
  | "birthday_badge"
  | "profile_anniversary_badge"
  | "holiday_badge"
  | "custom_event_badge";

export type GreetingType =
  | "birthday_greeting"
  | "profile_anniversary_greeting"
  | "holiday_greeting"
  | "custom_event_greeting";

export type Visibility = "public" | "followers" | "private";

// ── Indexed entities ──────────────────────────────────────────────────────────

/** A minted celebration badge as indexed from BadgeMinted events */
export interface IndexedBadge {
  tokenId: string;
  ownerProfile: Address;
  badgeType: BadgeType;
  celebrationType: CelebrationTypeSlug;
  /** Canonical celebration ID: e.g. "birthday:<addr>:<year>" */
  celebrationId: string;
  year: number;
  mintedAtBlock: number;
  mintedAtTimestamp: number;
  /** Resolved from IPFS — null until metadata worker runs */
  ipfsUrl: string | null;
  contentHash: string | null;
  transferable: boolean;
}

/** A sent greeting card as indexed from GreetingCardSent events */
export interface IndexedGreetingCard {
  tokenId: string;
  fromProfile: Address;
  toProfile: Address;
  greetingType: GreetingType;
  celebrationType: CelebrationTypeSlug;
  /** Canonical celebration ID */
  celebrationId: string;
  sentAtBlock: number;
  sentAtTimestamp: number;
  /** Resolved from IPFS — null until metadata worker runs */
  ipfsUrl: string | null;
  contentHash: string | null;
  message: string | null;
}

/** A detected celebration event (from BirthdayDetected / UPAnniversaryDetected logs) */
export interface IndexedCelebration {
  id: string; // canonical celebration ID
  profileAddress: Address;
  celebrationType: CelebrationTypeSlug;
  year: number;
  detectedAtBlock: number;
  detectedAtTimestamp: number;
}

/** A follow or unfollow event from LSP26 */
export interface IndexedFollowEvent {
  followerProfile: Address;
  followedProfile: Address;
  action: "follow" | "unfollow";
  blockNumber: number;
  timestamp: number;
}

/** Materialised follow relation — computed from follow_events table */
export interface FollowRelation {
  followerProfile: Address;
  followedProfile: Address;
  createdAt: number;
  active: boolean;
}

// ── Domain notification types ─────────────────────────────────────────────────

export type DomainNotificationType =
  | "badge_available"
  | "celebration_today"
  | "celebration_upcoming"
  | "greeting_received"
  | "greeting_prompt"
  | "holiday_active";

/** A drop campaign as indexed from DropCreated events */
export interface IndexedDrop {
  dropId: string;
  host: Address;
  celebrationType: CelebrationTypeSlug;
  year: number;
  month: number;
  day: number;
  startAt: number;       // unix timestamp; 0 = immediate
  endAt: number | null;  // null = no expiry
  maxSupply: number | null;
  claimed: number;
  name: string;
  imageIPFS: string | null;
  requireFollow: boolean;
  minFollowers: number;
  requiredLSP7: string[];
  requiredLSP8: string[];
  blockNumber: number;
  isActive: boolean;     // computed: startAt <= now <= endAt && claimed < maxSupply
}

/** A single drop claim as indexed from DropClaimed events */
export interface IndexedDropClaim {
  dropId: string;
  claimer: Address;
  tokenId: string;
  blockNumber: number;
}

/** Profile birthday + visibility data, read from UP ERC725Y keys */
export interface IndexedProfile {
  address: Address;
  birthdayMonth: number | null;
  birthdayDay: number | null;
  upCreatedAt: number | null;
  birthdayVis: "public" | "followers" | "private";
  eventsVis: "public" | "followers" | "private";
  notifyFollowers: boolean;
  reminderFrequency: "monthly" | "weekly" | "daily";
  reminderDueSoon?: boolean;
}

// ── Canonical ID helpers ──────────────────────────────────────────────────────

/**
 * Generate the canonical celebration ID for the given type.
 * Must produce the same value as the frontend's id-generation logic.
 */
export function makeCelebrationId(
  type: CelebrationTypeSlug,
  profileAddress: Address,
  year: number,
  extra?: string
): string {
  switch (type) {
    case "birthday":
      return `birthday:${profileAddress.toLowerCase()}:${year}`;
    case "profile_anniversary":
      return `profile_anniversary:${profileAddress.toLowerCase()}:${year}`;
    case "global_holiday":
      return `holiday:${extra ?? "unknown"}:${profileAddress.toLowerCase()}:${year}`;
    case "custom_event":
      return `custom:${profileAddress.toLowerCase()}:${extra ?? "unknown"}:${year}`;
  }
}
