import type { Celebration } from "./celebrations";
import type { SettingsSchema } from "./settings";
import type { WishlistItem } from "./wishlist";

// ── Profile settings & data ───────────────────────────────────────────────────

/**
 * @deprecated Use SettingsSchema from "./settings".
 * Kept for backward compatibility with existing hooks and views.
 */
export interface ProfileSettings {
  autoMintBadge: boolean;
  birthdayVisible: boolean;
  eventsVisible: boolean;
  wishlistVisible: boolean;
  notifyFollowers: boolean;
}

/**
 * Complete profile data as fetched from ERC725Y.
 * `settings` uses the canonical SettingsSchema going forward.
 */
export interface ProfileCelebrationData {
  version: string;
  birthday?: string; // "YYYY-MM-DD"
  profileCreatedAt?: number; // unix timestamp
  events: Celebration[];
  wishlist: WishlistItem[];
  settings: SettingsSchema;
}
