/**
 * Data mappers — transform raw contract/IPFS responses into typed domain objects.
 */
import type { CelebrationBadge, GreetingCard } from "@/app/types/nfts";
import type { Address, CelebrationTypeSlug } from "@/app/types/common";
import { UINT8_TO_CELEBRATION_SLUG, CELEBRATION_SLUG_TO_BADGE_TYPE, CELEBRATION_SLUG_TO_GREETING_TYPE } from "@/app/types/common";
import { CelebrationType } from "@/app/types/celebrations";

// ── Badge mappers ─────────────────────────────────────────────────────────────

/** Build a CelebrationBadge from raw on-chain data + resolved IPFS metadata */
export function mapBadge(
  tokenId: string,
  owner: Address,
  isSoulbound: boolean,
  ipfsJson: Record<string, unknown>
): CelebrationBadge {
  const rawType = Number(ipfsJson.celebrationType ?? 3);
  const typeSlug: CelebrationTypeSlug = UINT8_TO_CELEBRATION_SLUG[rawType] ?? "custom_event";
  const year = Number(ipfsJson.year ?? new Date().getFullYear());

  return {
    tokenId,
    owner,
    badgeType: CELEBRATION_SLUG_TO_BADGE_TYPE[typeSlug],
    celebrationType: rawType as CelebrationType,
    celebrationTypeSlug: typeSlug,
    celebrationId: `${typeSlug}:${owner.toLowerCase()}:${year}`,
    year,
    mintedAt: Number(ipfsJson.timestamp ?? 0),
    metadataCID: String(ipfsJson.image ?? ""),
    transferable: !isSoulbound,
  };
}

// ── Greeting card mappers ─────────────────────────────────────────────────────

/** Build a GreetingCard from raw on-chain data + resolved IPFS metadata */
export function mapGreetingCard(
  tokenId: string,
  ipfsJson: Record<string, unknown>
): GreetingCard {
  const rawType = Number(ipfsJson.celebrationType ?? 3);
  const typeSlug: CelebrationTypeSlug = UINT8_TO_CELEBRATION_SLUG[rawType] ?? "custom_event";
  const fromProfile = (ipfsJson.from as Address) ?? "0x0000000000000000000000000000000000000000";
  const toProfile = (ipfsJson.to as Address) ?? "0x0000000000000000000000000000000000000000";
  const year = Number(ipfsJson.year ?? new Date().getFullYear());

  return {
    tokenId,
    fromProfile,
    toProfile,
    greetingType: CELEBRATION_SLUG_TO_GREETING_TYPE[typeSlug],
    celebrationType: rawType as CelebrationType,
    celebrationTypeSlug: typeSlug,
    celebrationId: `${typeSlug}:${toProfile.toLowerCase()}:${year}`,
    message: String(ipfsJson.message ?? ""),
    metadataCID: String(ipfsJson.image ?? ""),
    mintedAt: Number(ipfsJson.timestamp ?? 0),
  };
}

// ── Label helpers ─────────────────────────────────────────────────────────────

export function celebrationTypeLabel(ct: CelebrationType): string {
  const labels: Record<CelebrationType, string> = {
    [CelebrationType.Birthday]:      "Birthday",
    [CelebrationType.UPAnniversary]: "UP Anniversary",
    [CelebrationType.GlobalHoliday]: "Global Holiday",
    [CelebrationType.CustomEvent]:   "Custom Event",
  };
  return labels[ct] ?? "Celebration";
}

export function celebrationTypeEmoji(ct: CelebrationType): string {
  const emojis: Record<CelebrationType, string> = {
    [CelebrationType.Birthday]:      "🎂",
    [CelebrationType.UPAnniversary]: "🎉",
    [CelebrationType.GlobalHoliday]: "🌍",
    [CelebrationType.CustomEvent]:   "⭐",
  };
  return emojis[ct] ?? "✨";
}
