import type { Address } from "./common";

// ── Domain notification types ─────────────────────────────────────────────────
// These are DIFFERENT from the UI toast type ("success"|"error"|"info") in
// NotificationsProvider. Those are ephemeral; these are domain-level events.

export type DomainNotificationType =
  | "badge_available"       // profile can mint their celebration badge today
  | "celebration_today"     // a celebration is happening right now
  | "celebration_upcoming"  // a celebration is N days away
  | "greeting_received"     // someone sent a greeting card
  | "greeting_prompt"       // the viewer can send a greeting to someone they follow
  | "holiday_active";       // a global holiday is active today

export interface AppNotification {
  id: string;
  profileAddress: Address;
  type: DomainNotificationType;
  title: string;
  message: string;
  /** Address of a related profile (e.g. who sent the greeting card) */
  relatedProfile?: Address;
  /** Canonical celebration ID this notification relates to */
  relatedCelebrationId?: string;
  read: boolean;
  createdAt: number; // unix timestamp
}
