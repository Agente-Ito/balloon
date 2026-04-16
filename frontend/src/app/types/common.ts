// Shared primitive types used across all domain modules

export type Address = `0x${string}`;

export type AppView =
  | "grid"
  | "calendar"
  | "celebration"
  | "editor"
  | "wishlist"
  | "badges"
  | "inbox"
  | "settings";

// ── Canonical domain primitives ───────────────────────────────────────────────

/**
 * String-based canonical celebration type used across all domain layers.
 * Maps to the uint8 enum in the contracts: birthday=0, profile_anniversary=1,
 * global_holiday=2, custom_event=3.
 */
export type CelebrationTypeSlug =
  | "birthday"
  | "profile_anniversary"
  | "global_holiday"
  | "custom_event";

/** Derived badge type — one per CelebrationTypeSlug */
export type BadgeType =
  | "birthday_badge"
  | "profile_anniversary_badge"
  | "holiday_badge"
  | "custom_event_badge";

/** Derived greeting type — one per CelebrationTypeSlug */
export type GreetingType =
  | "birthday_greeting"
  | "profile_anniversary_greeting"
  | "holiday_greeting"
  | "custom_event_greeting";

/** Who can see a piece of data or interact with a celebration */
export type Visibility = "public" | "followers" | "private";

/** Recurrence rule for custom events */
export type RecurrenceType = "none" | "yearly" | "monthly";

// ── Contract-level mapping utilities ─────────────────────────────────────────

export const CELEBRATION_SLUG_TO_UINT8: Record<CelebrationTypeSlug, number> = {
  birthday: 0,
  profile_anniversary: 1,
  global_holiday: 2,
  custom_event: 3,
};

export const UINT8_TO_CELEBRATION_SLUG: Record<number, CelebrationTypeSlug> = {
  0: "birthday",
  1: "profile_anniversary",
  2: "global_holiday",
  3: "custom_event",
};

export const CELEBRATION_SLUG_TO_BADGE_TYPE: Record<CelebrationTypeSlug, BadgeType> = {
  birthday: "birthday_badge",
  profile_anniversary: "profile_anniversary_badge",
  global_holiday: "holiday_badge",
  custom_event: "custom_event_badge",
};

export const CELEBRATION_SLUG_TO_GREETING_TYPE: Record<CelebrationTypeSlug, GreetingType> = {
  birthday: "birthday_greeting",
  profile_anniversary: "profile_anniversary_greeting",
  global_holiday: "holiday_greeting",
  custom_event: "custom_event_greeting",
};
