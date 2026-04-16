// Barrel — re-exports all domain types for convenient single-import access
export type { Address, AppView } from "./common";
export type { CelebrationTypeSlug, BadgeType, GreetingType, Visibility, RecurrenceType } from "./common";
export {
  CELEBRATION_SLUG_TO_UINT8,
  UINT8_TO_CELEBRATION_SLUG,
  CELEBRATION_SLUG_TO_BADGE_TYPE,
  CELEBRATION_SLUG_TO_GREETING_TYPE,
} from "./common";

export { CelebrationType } from "./celebrations";
export type {
  Celebration,
  CustomEvent,
  GlobalHoliday,
  CelebrationDay,
} from "./celebrations";

export type {
  BadgeMetadata,
  CelebrationBadge,
  Badge,
  GreetingMetadata,
  GreetingCard,
  GreetingCardLegacy,
} from "./nfts";

export type {
  GreetingPolicy,
  BadgePolicy,
  SettingsSchema,
} from "./settings";
export { DEFAULT_GREETING_POLICY, DEFAULT_BADGE_POLICY, DEFAULT_SETTINGS } from "./settings";

export type { DomainNotificationType, AppNotification } from "./notifications";
export type { FollowRelation } from "./social";
export type { WishlistItem, WishlistAssetType } from "./wishlist";

export type {
  ProfileSettings,
  ProfileCelebrationData,
} from "./profile";
