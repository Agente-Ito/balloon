// ─────────────────────────────────────────────────────────────────────────────
// Domain types for the Celebrations dApp
// ─────────────────────────────────────────────────────────────────────────────

export type Address = `0x${string}`;

// ── Celebration types ────────────────────────────────────────────────────────

export enum CelebrationType {
  Birthday = 0,
  UPAnniversary = 1,
  GlobalHoliday = 2,
  CustomEvent = 3,
}

export interface Celebration {
  id: string;
  type: CelebrationType;
  title: string;
  date: string; // "YYYY-MM-DD" or "MM-DD" for recurring
  recurring: boolean;
  storage?: "onchain" | "local";
  updatedAt?: number;
  deletedAt?: number | null;
  profileAddress?: Address; // for social celebrations from followed profiles
  description?: string;
  imageUrl?: string; // ipfs:// URL of an attached image
  notifyDaysBefore?: number; // 0 = day of, 1 = 1 day before, 3 = 3 days before, 7 = 1 week before
  notifyTime?: string;        // "HH:MM" 24h, e.g. "09:00" — time of day to fire the notification
}

// ── NFTs ─────────────────────────────────────────────────────────────────────

export interface BadgeMetadata {
  title: string;
  celebrationType: CelebrationType;
  year: number;
  ownerProfile: Address;
  image: string;   // ipfs://...
  timestamp: number;
}

export interface Badge {
  tokenId: string; // bytes32 hex
  owner: Address;
  metadata: BadgeMetadata;
  soulbound: boolean;
}

export interface GreetingCardMetadata {
  title: string;
  from: Address;
  to: Address;
  celebration: CelebrationType;
  message: string;
  year: number;
  timestamp: number;
  image: string; // ipfs://...
}

export interface GreetingCard {
  tokenId: string; // bytes32 hex (sequential)
  metadata: GreetingCardMetadata;
}

// ── Wishlist ─────────────────────────────────────────────────────────────────

export type WishlistItemType = "lsp8" | "lsp7" | "note";

export interface WishlistItem {
  id: string;
  type: WishlistItemType;
  assetAddress?: Address; // for lsp8 / lsp7
  tokenId?: string;       // for specific lsp8 token
  name: string;
  description?: string;
  image?: string;         // ipfs://...
}

// ── Profile data stored in ERC725Y ───────────────────────────────────────────

export interface ProfileCelebrationData {
  version: string;
  birthday?: string;        // "YYYY-MM-DD"
  profileCreatedAt?: number; // unix timestamp
  events: Celebration[];
  wishlist: WishlistItem[];
  settings: ProfileSettings;
}

export interface ProfileSettings {
  autoMintBadge: boolean;
  birthdayVisible: boolean;
  eventsVisible: boolean;
  wishlistVisible: boolean;
  notifyFollowers: boolean;
  reminderFrequency?: "monthly" | "weekly" | "daily";
}

// ── Global holidays ───────────────────────────────────────────────────────────

export interface GlobalHoliday {
  id: string;
  title: string;
  date: string; // "MM-DD"
  emoji: string;
  description: string;
}

// ── Drops ─────────────────────────────────────────────────────────────────────

export interface DropConfig {
  host: Address;
  celebrationType: CelebrationType;
  year: number;
  month: number;
  day: number;
  startAt: number;        // unix timestamp; 0 = immediate
  endAt: number;          // unix timestamp; 0 = no expiry
  maxSupply: number;      // 0 = unlimited
  requireFollowsHost: boolean;
  minFollowers: number;
  requiredLSP7: Address[];
  requiredLSP8: Address[];
  name: string;
  imageIPFS: string;
  metadataBytes: string;  // hex-encoded bytes
}

/** A drop as returned by the indexer API */
export interface IndexedDrop {
  dropId: string;
  host: Address;
  celebrationType: string;  // "birthday" | "profile_anniversary" | etc.
  year: number;
  month: number;
  day: number;
  startAt: number;
  endAt: number | null;
  maxSupply: number | null;
  claimed: number;
  name: string;
  imageIPFS: string | null;
  requireFollow: boolean;
  minFollowers: number;
  requiredLSP7: Address[];
  requiredLSP8: Address[];
  blockNumber: number;
  isActive: boolean;
}

/** Profile dates for social calendar */
export interface SocialProfile {
  address: Address;
  birthdayMonth: number;
  birthdayDay: number;
  upCreatedAt: number | null;
  notifyFollowers?: boolean;
  reminderFrequency?: "monthly" | "weekly" | "daily";
  reminderDueSoon?: boolean;
}

// ── UI state ──────────────────────────────────────────────────────────────────

export type AppView =
  | "grid"
  | "calendar"
  | "celebration"
  | "editor"
  | "wishlist"
  | "drops"
  | "drops-manage"
  | "drop-detail"
  | "series";

// ── Drop series (community art voting) ────────────────────────────────────────

export interface DropSeries {
  id: string;
  name: string;
  description: string | null;
  celebrationType: number;
  month: number;
  day: number;
  curator: string;
  submissionOpen: boolean;
  selectedDropId: string | null;
  votingDeadline: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface SeriesSubmission {
  id: number;
  seriesId: string;
  artist: string;
  imageIPFS: string;
  message: string | null;
  selected: boolean;
  submittedAt: number;
  voteCount: number;
  votedByViewer: boolean;
}

export interface CelebrationDay {
  date: string; // "YYYY-MM-DD"
  celebrations: Celebration[];
}
