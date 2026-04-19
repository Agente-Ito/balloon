import type { Translations } from "@/lib/i18n";

/**
 * Normalize raw on-chain eligibility reasons into localized UI strings.
 */
export function getLocalizedDropEligibilityReason(reason: string | undefined, t: Translations): string {
  if (!reason) return t.dropNotEligible;

  const normalized = reason.trim().toLowerCase();

  if (normalized.includes("drop not found")) return t.dropReasonNotFound;
  if (normalized.includes("window") || normalized.includes("not open")) return t.dropReasonWindowClosed;
  if (normalized.includes("sold out")) return t.dropReasonSoldOut;
  if (normalized.includes("already claimed")) return t.dropReasonAlreadyClaimed;
  if (normalized.includes("must follow")) return t.dropReasonMustFollowHost;
  if (normalized.includes("insufficient followers")) return t.dropReasonInsufficientFollowers;
  if (normalized.includes("lsp7")) return t.dropReasonMissingLSP7;
  if (normalized.includes("lsp8")) return t.dropReasonMissingLSP8;

  return t.dropReasonUnknown;
}
