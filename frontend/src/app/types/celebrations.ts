import type { Address, CelebrationTypeSlug, RecurrenceType, Visibility } from "./common";

export enum CelebrationType {
  Birthday     = 0,
  UPAnniversary = 1,
  GlobalHoliday = 2,
  CustomEvent   = 3,
}

/**
 * Canonical Celebration entity used across frontend, indexer, and API.
 *
 * `source` distinguishes where the celebration originates:
 *   - user_defined  → created explicitly by the profile owner
 *   - derived       → auto-computed (UP anniversary, next birthday occurrence)
 *   - global_registry → sourced from the CelebrationRegistry contract
 */
export interface Celebration {
  /** Canonical ID: "birthday:<addr>:<year>", "holiday:<id>:<addr>:<year>", etc. */
  id: string;
  type: CelebrationType;
  /** Canonical string slug for cross-layer communication */
  typeSlug: CelebrationTypeSlug;
  title: string;
  /** "YYYY-MM-DD" for one-time events, "MM-DD" for recurring */
  date: string;
  recurring: boolean;
  recurrence: RecurrenceType;
  source: "user_defined" | "derived" | "global_registry";
  visibility: Visibility;
  badgeEligible: boolean;
  greetingEligible: boolean;
  /** Set for social celebrations sourced from followed profiles */
  profileAddress?: Address;
  description?: string;
  /** Only for global_holiday source */
  holidayId?: string;
  /** Only for user_defined custom events */
  customEventId?: string;
}

/**
 * User-defined custom event stored in ERC725Y as a JSONURL.
 */
export interface CustomEvent {
  id: string;
  title: string;
  description?: string;
  /** "YYYY-MM-DD" or "MM-DD" */
  date: string;
  recurrence: RecurrenceType;
  visibility: Visibility;
  allowBadge: boolean;
  allowGreetings: boolean;
}

/**
 * Global holiday sourced from CelebrationRegistry contract.
 */
export interface GlobalHoliday {
  id: string;
  slug: string;
  title: string;
  /** "MM-DD" */
  date: string;
  month: number;
  day: number;
  emoji: string;
  description: string;
  badgeEnabled: boolean;
  greetingEnabled: boolean;
  defaultVisibility: Visibility;
}

export interface CelebrationDay {
  /** "YYYY-MM-DD" */
  date: string;
  celebrations: Celebration[];
}
