import type { CelebrationTypeSlug, Visibility } from "./common";

// ── GreetingPolicy ────────────────────────────────────────────────────────────

/**
 * Rules for receiving greeting cards on a profile.
 * Source of truth: stored in ERC725Y under CelebrationsSettings.
 * The CelebrationsDelegate reads this on-chain to gate auto-emissions.
 */
export interface GreetingPolicy {
  enabled: boolean;
  /** Who is allowed to send greeting cards */
  allowedSenders: "anyone" | "followers_only" | "nobody";
  /** Minimum hours between cards from the same sender to the same profile */
  rateLimitHours: number;
  /** Maximum character count for card messages */
  maxMessageLength: number;
  /** How many days before/after a celebration the card window is open */
  celebrationWindowDays: number;
}

// ── BadgePolicy ───────────────────────────────────────────────────────────────

/**
 * Settings for badge auto-minting behaviour.
 * The CelebrationsDelegate reads this on-chain to decide whether to auto-mint.
 */
export interface BadgePolicy {
  autoMintBirthdayBadge: boolean;
  autoMintProfileAnniversaryBadge: boolean;
  /** Holiday slugs for which badge minting is enabled (e.g. ["christmas", "new_year"]) */
  enabledHolidayBadges: string[];
  allowCustomEventBadges: boolean;
}

// ── SettingsSchema ────────────────────────────────────────────────────────────

/**
 * Canonical settings object stored in a profile's ERC725Y under the
 * CelebrationsSettings key as a JSONURL-encoded value.
 *
 * This is the single source of truth for all profile-level configuration.
 * Every layer (contracts, indexer, frontend) must reference this shape.
 *
 * Default visibility rules:
 *   - birthday: configurable (default "followers")
 *   - profile_anniversary: public
 *   - global_holiday: public
 *   - custom_event: configurable (default "followers")
 */
export interface SettingsSchema {
  birthdayVisibility: Visibility;
  wishlistVisibility: Visibility;
  greetingPolicy: GreetingPolicy;
  badgePolicy: BadgePolicy;
  /** Which celebration types the profile has enabled */
  enabledCelebrationTypes: CelebrationTypeSlug[];
}

// ── Defaults ──────────────────────────────────────────────────────────────────

export const DEFAULT_GREETING_POLICY: GreetingPolicy = {
  enabled: true,
  allowedSenders: "anyone",
  rateLimitHours: 24,
  maxMessageLength: 280,
  celebrationWindowDays: 7,
};

export const DEFAULT_BADGE_POLICY: BadgePolicy = {
  autoMintBirthdayBadge: true,
  autoMintProfileAnniversaryBadge: true,
  enabledHolidayBadges: ["christmas", "new_year"],
  allowCustomEventBadges: true,
};

export const DEFAULT_SETTINGS: SettingsSchema = {
  birthdayVisibility: "followers",
  wishlistVisibility: "public",
  greetingPolicy: DEFAULT_GREETING_POLICY,
  badgePolicy: DEFAULT_BADGE_POLICY,
  enabledCelebrationTypes: [
    "birthday",
    "profile_anniversary",
    "global_holiday",
    "custom_event",
  ],
};
